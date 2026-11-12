/**
 * 아르스킨 일일보고 웹앱 백엔드 (Google Apps Script)
 * - 이 스크립트를 "아르스킨 일일보고 시트"에 바인딩(확장 프로그램 > Apps Script)해서 붙여넣고
 *   배포 > 새 배포 > 웹 앱 / 실행: 나 / 액세스: 모든 사용자 로 배포한 뒤 URL을 config.js 에 넣는다.
 * - 데이터는 월별 탭("2026-11")에 한 행 = 한 항목으로 저장된다.
 *   id | 날짜 | 구분 | 열 | 상태 | 내용 | 시작 | 종료 | 수정시각
 */
// 사람별 일일보고 시트(허용 목록). 웹앱은 이름(who)만 보내고, 여기 없는 이름은 거부한다.
var REPORT_SHEETS = {
  '박선희': '1uQzBVCdV0h840CFLDAbAXP2riNBSM7iuw0MjmdGgrtQ',
  '전성환': '1wx4ttcTh2Wro7xjFLIss6wcEqkAWouM1FYYnuiGIltw',
  '양욱정': '1h4kk5Q8EIOrm8T9Gfsb5dSa-xuw6o7usf_K0vLKR1SQ',
  '공통': '1i4kLJttpdo0uQwdUspIDgMBcVdkojFEAJp7lDrUmMMU', // 공유 캘린더(구분=일정)·공통 업무
};
var CALENDAR_SS_ID = '1onONNURdaBteNOeEP4VGANBYLQHlipe451M4rnKqBLo';
var CALENDAR_TAB = '컨텐츠 캘린더';
// 인증: 비밀값은 코드에 두지 않고 스크립트 속성(프로젝트 설정 → 스크립트 속성)에서만 읽는다.
//   ACCESS_CODES      = {"사람별코드":"이름", ...}  (JSON)
//   REVENUE_VIEW_KEY  = 매출표 비밀번호
// 속성이 없으면 모든 요청을 거부한다(실패 시 차단).
function memberFor_(code) {
  var raw = PropertiesService.getScriptProperties().getProperty('ACCESS_CODES');
  if (!raw || !code) return '';
  try { var map = JSON.parse(raw); return Object.prototype.hasOwnProperty.call(map, code) ? String(map[code]) : ''; } catch (e) { return ''; }
}
var HEADER = ['id', '날짜', '구분', '열', '상태', '내용', '시작', '종료', '수정시각', '생성일', '완료일', '원본id'];
var NCOL = HEADER.length;
function todayKst_() { return Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd'); }

function doGet(e) {
  var p = e.parameter || {};
  if (!memberFor_(p.code)) return json({ error: 'unauthorized' });
  if (p.action === 'ping') return json({ v: 7, auth: 'code', content: true, instagram: true, revenue: true }); // 웹앱이 사람별 시트 지원 여부를 확인
  if (p.action === 'content') { try { return json(contentData(p.fresh === '1')); } catch (err) { return json({ error: err.message }); } }
  if (p.action === 'calendar') return json({ grid: calendarGrid() });
  if (!sheetIdFor(p.who)) return json({ error: 'no sheet for ' + p.who });
  return json({ rows: listRows(p.who, p.from, p.to) });
}

function doPost(e) {
  var body = JSON.parse(e.postData.contents || '{}');
  if (!memberFor_(body.code)) return json({ error: 'unauthorized' });
  if (body.action === 'revenueRows') { try { return json({ rows: revenueRows_(body.revenueKey) }); } catch (err) { return json({ error: err.message }); } }
  if (body.action === 'revenue') { try { return json(revenueData_(body.viewKey)); } catch (err) { return json({ error: err.message }); } }
  if (body.action === 'contentPlanSave' || body.action === 'contentPlanAdd') {
    try { return json({ plan: contentPlanWrite(body) }); } catch (err) { return json({ error: err.message }); }
  }
  var who = body.who;
  if (!sheetIdFor(who)) return json({ error: 'no sheet for ' + who });
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    if (body.action === 'upsert') (body.rows || []).forEach(function (o) { upsertRow(who, o); });
    else if (body.action === 'delete') (body.ids || []).forEach(function (id) { deleteRow(who, id); });
    else return json({ error: 'unknown action' });
  } finally {
    lock.releaseLock();
  }
  return json({ ok: true });
}

function sheetIdFor(who) {
  return Object.prototype.hasOwnProperty.call(REPORT_SHEETS, who) ? REPORT_SHEETS[who] : '';
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function monthSheet(who, date, create) {
  var ss = SpreadsheetApp.openById(sheetIdFor(who));
  var name = String(date).slice(0, 7);
  var sh = ss.getSheetByName(name);
  if (!sh && create) {
    sh = ss.insertSheet(name, 0);
    sh.getRange('A:L').setNumberFormat('@');
    sh.appendRow(HEADER);
    sh.setFrozenRows(1);
  }
  return sh;
}

// from, to: 'YYYY-MM-DD' (둘 다 포함)
function listRows(who, from, to) {
  var out = [];
  var months = {};
  var d = new Date(from + 'T00:00:00');
  var end = new Date(to + 'T00:00:00');
  for (; d <= end; d.setDate(d.getDate() + 1)) months[isoDate(d).slice(0, 7)] = 1;
  Object.keys(months).forEach(function (m) {
    var sh = monthSheet(who, m + '-01', false);
    if (!sh || sh.getLastRow() < 2) return;
    sh.getRange(2, 1, sh.getLastRow() - 1, NCOL).getDisplayValues().forEach(function (r) {
      if (r[1] >= from && r[1] <= to) out.push(toObj(r));
    });
  });
  return out;
}

function toObj(r) {
  return { id: r[0], date: r[1], section: r[2], col: r[3], status: r[4], text: r[5], start: r[6], end: r[7], updated: r[8], created: r[9] || r[1], completed: r[10], origin: r[11] || r[0] };
}

function upsertRow(who, o) {
  if (!o.id || !o.date) return;
  var sh = monthSheet(who, o.date, true);
  var idx = findRow(sh, o.id);
  // 생성일·완료일·원본id 는 서버가 관리: 클라이언트가 안 보내도 기존 값을 유지한다
  var prev = idx ? sh.getRange(idx, 10, 1, 3).getDisplayValues()[0] : ['', '', ''];
  var done = o.status === 'done' || o.status === '⭕';
  var vals = [o.id, o.date, o.section || '', o.col || '', o.status || '', o.text || '', o.start || '', o.end || '', new Date().toISOString(),
    o.created || prev[0] || todayKst_(), done ? (prev[1] || todayKst_()) : '', o.origin || prev[2] || o.id];
  if (idx) sh.getRange(idx, 1, 1, NCOL).setValues([vals]);
  else sh.appendRow(vals);
}

function deleteRow(who, idWithDate) {
  // "YYYY-MM-DD|id" 또는 id 만 (id 앞 8자리가 날짜)
  var parts = String(idWithDate).split('|');
  var id = parts[parts.length - 1];
  var date = parts.length > 1 ? parts[0] : id.slice(0, 4) + '-' + id.slice(4, 6) + '-' + id.slice(6, 8);
  var sh = monthSheet(who, date, false);
  if (!sh) return;
  var idx = findRow(sh, id);
  if (idx) sh.deleteRow(idx);
}

function findRow(sh, id) {
  var last = sh.getLastRow();
  if (last < 2) return 0;
  var ids = sh.getRange(2, 1, last - 1, 1).getDisplayValues();
  for (var i = 0; i < ids.length; i++) if (ids[i][0] === id) return i + 2;
  return 0;
}

function calendarGrid() {
  var sh = SpreadsheetApp.openById(CALENDAR_SS_ID).getSheetByName(CALENDAR_TAB);
  return sh.getRange(1, 1, Math.min(sh.getLastRow(), 60), 8).getDisplayValues();
}

function isoDate(d) {
  return Utilities.formatDate(d, 'Asia/Seoul', 'yyyy-MM-dd');
}


// 콘텐츠 스튜디오. 원본 시트의 셀/열 배치와 기존 보고서 API는 유지합니다.
var CONTENT_SOURCES = [
  { ch: 'hongzz', sheet: 'dr.hongzz+영상리스트', col: 3, width: 6 },
  { ch: 'global', sheet: 'dr.hongzz_global', col: 3, width: 6 },
  { ch: 'figo', sheet: 'Figo', col: 3, width: 6 },
  { ch: 'arskin', sheet: 'arskin_hongdae', col: 3, width: 6 },
  { ch: 'won', sheet: '블로그 업로드', col: 3, width: 4 },
  { ch: 'jasa', sheet: '블로그 업로드', col: 9, width: 4 }
];
function contentData(fresh) {
  var instagram = instagramSync_(fresh);
  var cache = CacheService.getScriptCache(), hit = cache.get('content-v3');
  if (hit && !fresh) { var cached = JSON.parse(hit); cached.instagram = instagram; return cached; }
  var ss = SpreadsheetApp.openById(CALENDAR_SS_ID);
  var out = { updated: Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss'), instagram: instagram };
  CONTENT_SOURCES.forEach(function(source) {
    var sh = ss.getSheetByName(source.sheet);
    if (!sh) throw new Error('시트 연결을 확인해 주세요: ' + source.sheet);
    var count = sh.getLastRow() - 3;
    out[source.ch] = count > 0 ? sh.getRange(4, source.col, count, source.width).getDisplayValues().filter(function(r) { return r[0] && r[2]; }) : [];
  });
  out.plan = contentPlanRead(ss);
  var payload = JSON.stringify(out);
  // Apps Script 캐시 항목 제한(100 KB)을 넘는 데이터는 캐시 없이 정상 반환합니다.
  if (Utilities.newBlob(payload).getBytes().length < 95000) cache.put('content-v3', payload, 30);
  return out;
}
function contentPlanSheet(ss) {
  var sh = ss.getSheetByName('dr.hongzz+영상리스트');
  if (!sh) throw new Error('영상 기획 시트를 찾을 수 없습니다.');
  return sh;
}
function contentPlanRead(ss) {
  var sh = contentPlanSheet(ss), count = sh.getLastRow() - 3;
  if (count < 1) return [];
  return sh.getRange(4, 10, count, 7).getDisplayValues().map(function(v, i) { return { row: i + 4, v: v }; }).filter(function(r) { return r.v.some(function(x) { return String(x).trim(); }); });
}
function contentClean(values) {
  if (!Array.isArray(values) || values.length !== 7) throw new Error('입력 형식을 확인해 주세요.');
  return values.map(function(x) { return String(x == null ? '' : x).slice(0, 2000); });
}
function contentPlanWrite(body) {
  var after = contentClean(body.action === 'contentPlanAdd' ? body.values : body.after);
  if (!after.some(function(x) { return x.trim(); })) throw new Error('내용을 하나 이상 입력해 주세요.');
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    var ss = SpreadsheetApp.openById(CALENDAR_SS_ID), sh = contentPlanSheet(ss), row;
    if (body.action === 'contentPlanSave') {
      row = Number(body.row); var before = contentClean(body.before);
      if (!Number.isInteger(row) || row < 4 || row > sh.getLastRow()) throw new Error('행 번호가 올바르지 않습니다.');
      var now = sh.getRange(row, 10, 1, 7).getDisplayValues()[0];
      if (!now.every(function(x, i) { return String(x).trim() === before[i].trim(); })) throw new Error('다른 사람이 먼저 수정했어요. 새로고침 후 다시 저장해 주세요.');
    } else {
      var last = Math.max(4, sh.getLastRow()), values = sh.getRange(4, 10, last - 3, 7).getDisplayValues(); row = last + 1;
      for (var i = 0; i < values.length; i++) if (values[i].every(function(x) { return !String(x).trim(); })) { row = i + 4; break; }
      if (row > sh.getMaxRows()) sh.insertRowsAfter(sh.getMaxRows(), 1);
    }
    // 사용자 입력이 수식으로 실행되지 않도록 문자열로 저장합니다.
    sh.getRange(row, 10, 1, 7).setValues([after.map(function(x) { return /^=/.test(x) ? "'" + x : x; })]);
    SpreadsheetApp.flush(); CacheService.getScriptCache().remove('content-v3');
    return contentPlanRead(ss);
  } finally { lock.releaseLock(); }
}

// Instagram 신규 게시물 수집. 토큰은 프로젝트 설정의 스크립트 속성에서만 읽습니다.
// IG_ACCESS_TOKENS: Instagram 사용자 토큰들을 줄바꿈으로 구분 (계정은 /me로 자동 확인).
// 선택: IG_GRAPH_VERSION (기본 v24.0), IG_SYNC_INTERVAL_SECONDS (기본 120).
var IG_ACCOUNT_SHEETS = {
  'dr.hongzz': 'dr.hongzz+영상리스트', 'dr.hongzz_global': 'dr.hongzz_global',
  'figo_seoul': 'Figo', 'arskin_hongdae': 'arskin_hongdae'
};
function instagramRequest_(path, token) {
  var version = PropertiesService.getScriptProperties().getProperty('IG_GRAPH_VERSION') || 'v24.0';
  if (!/^v\d+\.\d+$/.test(version)) throw new Error('Instagram API 버전 설정을 확인해 주세요.');
  var response = UrlFetchApp.fetch('https://graph.instagram.com/' + version + '/' + path, {
    headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true
  });
  var data;
  try { data = JSON.parse(response.getContentText()); } catch (err) { throw new Error('Instagram 응답을 읽지 못했습니다.'); }
  if (response.getResponseCode() >= 400 || data.error) {
    var code = data.error && data.error.code;
    throw new Error(code === 190 ? 'Instagram 토큰이 만료되었거나 유효하지 않습니다.' : 'Instagram 연결 실패' + (code ? ' (코드 ' + code + ')' : ''));
  }
  return data;
}
function instagramSync_(force) {
  var props = PropertiesService.getScriptProperties(), raw = props.getProperty('IG_ACCESS_TOKENS') || '';
  var tokens = raw.split(/[\s,]+/).filter(Boolean);
  if (!tokens.length) return { configured: false, message: 'Instagram 자동 수집 설정이 필요합니다.', accounts: [] };
  var interval = Math.max(60, Number(props.getProperty('IG_SYNC_INTERVAL_SECONDS')) || 120);
  var last = Number(props.getProperty('IG_LAST_SYNC_MS')) || 0;
  if (!force && Date.now() - last < interval * 1000) {
    try { return JSON.parse(props.getProperty('IG_LAST_SYNC_RESULT') || '{}'); } catch (err) { return { configured: true }; }
  }
  var lock = LockService.getUserLock();
  if (!lock.tryLock(1000)) return { configured: true, message: 'Instagram 정보를 동기화하고 있습니다.', accounts: [] };
  var result = { configured: true, updated: Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss'), accounts: [] };
  try {
    var ss = SpreadsheetApp.openById(CALENDAR_SS_ID), seen = {};
    tokens.slice(0, 4).forEach(function(token, i) {
      var username = '';
      try {
        var profile = instagramRequest_('me?fields=id,username', token); username = String(profile.username || '').toLowerCase();
        if (!Object.prototype.hasOwnProperty.call(IG_ACCOUNT_SHEETS, username)) throw new Error('연결 대상 계정이 아닙니다.');
        if (seen[username]) return; seen[username] = true;
        var sh = ss.getSheetByName(IG_ACCOUNT_SHEETS[username]);
        if (!sh) throw new Error('계정의 원본 시트를 찾을 수 없습니다.');
        var media = [], after = '';
        // 최근 50개를 조회합니다. 새 글은 permalink로 비교해 중복 없이 반영합니다.
        for (var page = 0; page < 1; page++) {
          var path = 'me/media?fields=id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count&limit=50';
          if (after) path += '&after=' + encodeURIComponent(after);
          var batch = instagramRequest_(path, token); media = media.concat(batch.data || []);
          if (!(batch.paging && batch.paging.next && batch.paging.cursors && batch.paging.cursors.after)) break;
          after = batch.paging.cursors.after;
        }
        var writeLock = LockService.getScriptLock(); writeLock.waitLock(10000);
        try { var added = instagramMerge_(sh, media); SpreadsheetApp.flush(); } finally { writeLock.releaseLock(); }
        result.accounts.push({ account: username, ok: true, added: added, fetched: media.length });
      } catch (err) { result.accounts.push({ account: username || '연결 ' + (i + 1), ok: false, error: err.message }); }
    });
    SpreadsheetApp.flush();
    props.setProperty('IG_LAST_SYNC_MS', String(Date.now()));
    props.setProperty('IG_LAST_SYNC_RESULT', JSON.stringify(result));
    CacheService.getScriptCache().remove('content-v3');
    return result;
  } finally { lock.releaseLock(); }
}
function instagramLinkKey_(value) {
  var match = String(value || '').match(/instagram\.com\/(?:p|reels?|tv)\/([\w-]+)/i);
  return match ? match[1] : String(value || '').trim().replace(/\?.*$/, '').replace(/\/$/, '');
}
function instagramLiteral_(value) {
  var text = String(value == null ? '' : value).slice(0, 2000);
  return /^=/.test(text) ? "'" + text : text;
}
function instagramMerge_(sh, media) {
  var last = Math.max(3, sh.getLastRow());
  var values = last > 3 ? sh.getRange(4, 3, last - 3, 6).getDisplayValues() : [];
  var links = {}, free = [];
  values.forEach(function(row, i) {
    if (row[2]) links[instagramLinkKey_(row[2])] = { row: i + 4, values: row };
    else if (row.every(function(value) { return !String(value).trim(); })) free.push(i + 4);
  });
  var added = 0;
  media.slice().sort(function(a,b) { return String(a.timestamp).localeCompare(String(b.timestamp)); }).forEach(function(item) {
    if (!item.permalink || !item.timestamp) return;
    var date = new Date(item.timestamp); if (isNaN(date.getTime())) return;
    var key = instagramLinkKey_(item.permalink), old = links[key], row = old ? old.row : free.length ? free.shift() : ++last;
    if (row < 4) row = last = 4;
    if (row > sh.getMaxRows()) sh.insertRowsAfter(sh.getMaxRows(), row - sh.getMaxRows());
    // G열 기존 조회수는 보존합니다. 미디어 API가 제공하는 좋아요/댓글만 갱신합니다.
    var next = [Utilities.formatDate(date, 'Asia/Seoul', 'yyyy. M. d'), instagramLiteral_(item.caption || '(제목 없음)'), item.permalink,
      item.like_count == null ? old ? old.values[3] : '' : item.like_count,
      old ? old.values[4] : '', item.comments_count == null ? old ? old.values[5] : '' : item.comments_count];
    if (!old || next.some(function(value,i) { return String(value) !== String(old.values[i]); })) sh.getRange(row, 3, 1, 6).setValues([next]);
    if (!old) added++;
    links[key] = { row: row, values: next };
  });
  return added;
}
// Apps Script에서 한 번 직접 실행: 권한 승인 + 10분 간격 자동 수집 트리거 설치.
function installInstagramSync() {
  var result = instagramSync_(true);
  if (!result.configured) throw new Error('프로젝트 설정 → 스크립트 속성에 IG_ACCESS_TOKENS를 먼저 입력해 주세요.');
  if (!result.accounts.some(function(account) { return account.ok; })) throw new Error('Instagram 연결을 확인해 주세요. ' + result.accounts.map(function(account) { return account.error; }).join(' / '));
  ScriptApp.getProjectTriggers().forEach(function(trigger) { if (trigger.getHandlerFunction() === 'syncInstagramNow') ScriptApp.deleteTrigger(trigger); });
  ScriptApp.newTrigger('syncInstagramNow').timeBased().everyMinutes(10).create();
  return result;
}
function syncInstagramNow() { return instagramSync_(true); }

// 월간 매출표: 공개 API_KEY와 별개인 비공개 조회키가 있어야 읽을 수 있습니다.
var REVENUE_SS_ID = '1XoxsdvRVo8-L_zSuZp6kWzLdlHLqikXRVhYgnIZmQpw';
// 매출표 원본(월간요약 A1:AF100)을 비밀번호 확인 후 표시값 그대로 돌려준다. 화면 파싱은 revenue-model.js가 한다.
function revenueRows_(provided) {
  var expected = PropertiesService.getScriptProperties().getProperty('REVENUE_VIEW_KEY');
  if (!expected) throw new Error('매출표 비밀번호가 아직 설정되지 않았습니다.');
  if (String(provided || '') !== expected) throw new Error('매출 비밀번호가 맞지 않습니다.');
  var sh = SpreadsheetApp.openById(REVENUE_SS_ID).getSheetByName('월간요약');
  if (!sh || sh.getSheetId() !== 1411519381) throw new Error('월간요약 시트를 확인해 주세요.');
  return sh.getRange('A1:AF100').getDisplayValues();
}
function revenueData_(provided) {
  var expected = PropertiesService.getScriptProperties().getProperty('REVENUE_VIEW_KEY');
  if (!expected) throw new Error('매출표 조회 연결을 준비 중입니다.');
  if (String(provided || '') !== expected) throw new Error('매출표 조회키를 확인해 주세요.');
  var ss = SpreadsheetApp.openById(REVENUE_SS_ID), sh = ss.getSheetByName('월간요약');
  if (!sh || sh.getSheetId() !== 1411519381) throw new Error('월간요약 시트를 확인해 주세요.');
  var range = sh.getRange('A1:AF100');
  var out = revenueParse_(range.getValues(), range.getDisplayValues());
  out.updated = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
  return out;
}
function revenueNumber_(value) {
  if (typeof value === 'number') return isFinite(value) ? value : null;
  var text = String(value == null ? '' : value).trim();
  if (!text || text.charAt(0) === '#') return null;
  var number = Number(text.replace(/[₩원,%\s]/g, ''));
  return isFinite(number) ? number : null;
}
function revenueParse_(values, display) {
  var title = String((display[0] || [])[0] || ''), match = title.match(/(\d{4})년\s*(\d{1,2})월/);
  if (!match) throw new Error('월간요약의 기준 연월을 확인해 주세요.');
  var year = Number(match[1]), month = Number(match[2]);
  if ((display[5] || [])[0] !== '날짜' || (display[5] || [])[2] !== '총금액' || (display[2] || [])[0] !== '보고 건수') throw new Error('월간요약 열 구성이 변경되었습니다.');
  var number = function(r,c) { return revenueNumber_((values[r] || [])[c]); };
  var total = number(3,2), count = number(3,0);
  if (total == null || count == null) throw new Error('월간 합계에 계산 오류가 있습니다. 원본 시트를 확인해 주세요.');
  var metric = { total: total, count: count, vegas: number(3,4), upsellBasis: number(3,6), checkDifference: number(3,16) };
  var paymentCols = [[8,'강남언니/바비톡'],[10,'카드'],[12,'현금'],[14,'큐릭'],[18,'기타/계좌']];
  var payments = paymentCols.map(function(x) { return { name: x[1], value: number(3,x[0]) }; });
  var daily = [];
  for (var r = 6; r < 37; r++) {
    var label = String((display[r] || [])[0] || ''), date = label.match(/^(\d{1,2})-(\d{1,2})$/);
    if (!date || Number(date[1]) !== month) continue;
    var day = Number(date[2]);
    daily.push({ day: day, label: label, weekday: new Date(Date.UTC(year,month-1,day)).getUTCDay(), count: number(r,1), total: number(r,2), cumulative: number(r,10) });
  }
  var staff = [];
  for (var r = 6; r < 9; r++) if ((display[r] || [])[13]) staff.push({ name: display[r][13], count: number(r,14), total: number(r,15), checkDifference: number(r,22) });
  var categories = [];
  for (var r = 6; r < 21; r++) if ((display[r] || [])[26]) {
    var ratio = number(r,28); if (typeof (values[r] || [])[28] === 'string' && String(values[r][28]).indexOf('%') >= 0 && ratio != null) ratio /= 100;
    categories.push({ name: display[r][26], count: number(r,27), ratio: ratio, domestic: number(r,29), overseas: number(r,30) });
  }
  var countryHeader = -1;
  for (var r = 40; r < Math.min(display.length,100); r++) if ((display[r] || [])[0] === '국가별 총금액') { countryHeader = r + 1; break; }
  var countries = [];
  if (countryHeader >= 0) for (var c = 1; c <= 6; c++) {
    var sum = 0, valid = true;
    for (var r = countryHeader+1; r < Math.min(values.length,countryHeader+33); r++) {
      if (!/^\d{1,2}-\d{1,2}$/.test(String((display[r] || [])[0] || ''))) continue;
      var v = number(r,c); if (v == null) valid = false; else sum += v;
    }
    countries.push({ name: display[countryHeader][c], value: valid ? sum : null });
  }
  var active = daily.filter(function(d) { return d.count > 0; });
  var validDaily = daily.length === new Date(Date.UTC(year, month, 0)).getUTCDate() && daily.every(function(d) { return d.total != null && d.count != null; });
  var sumDaily = validDaily ? daily.reduce(function(sum,d) { return sum+d.total; },0) : null;
  var sumCount = validDaily ? daily.reduce(function(sum,d) { return sum+d.count; },0) : null;
  var sumPayments = payments.every(function(x) { return x.value != null; }) ? payments.reduce(function(sum,x) { return sum+x.value; },0) : null;
  var sumCountries = countries.length && countries.every(function(x) { return x.value != null; }) ? countries.reduce(function(sum,x) { return sum+x.value; },0) : null;
  metric.recordedDays = active.length; metric.averageRecord = count ? total/count : null;
  metric.averageRecordedDay = active.length ? total/active.length : null;
  var abroad = countries.filter(function(x) { return x.name !== '국내'; });
  metric.overseasShare = total && abroad.length && abroad.every(function(x) { return x.value != null; }) ? abroad.reduce(function(sum,x) { return sum+x.value; },0)/total : null;
  var weeks = [];
  var firstOffset = (new Date(Date.UTC(year,month-1,1)).getUTCDay()+6)%7;
  daily.forEach(function(d) { var i = Math.floor((d.day-1+firstOffset)/7); if (!weeks[i]) weeks[i]={ name: (i+1)+'주차', total: 0, count: 0, days: 0, valid: true }; weeks[i].days++; if(d.total==null||d.count==null) weeks[i].valid=false; else { weeks[i].total+=d.total; weeks[i].count+=d.count; } });
  return { schema: 1, title: title, year: year, month: month, metric: metric, daily: daily, staff: staff, payments: payments, countries: countries, categories: categories, weeks: weeks.filter(Boolean),
    checks: { staffDifference: staff.length && staff.every(function(s) { return s.total != null; }) ? total-staff.reduce(function(sum,s) { return sum+s.total; },0) : null, cumulativeDifference: daily.length && daily[daily.length-1].cumulative != null ? total-daily[daily.length-1].cumulative : null, dailyDifference: sumDaily == null ? null : total-sumDaily, countDifference: sumCount == null ? null : count-sumCount, paymentDifference: sumPayments == null ? null : total-sumPayments, countryDifference: sumCountries == null ? null : total-sumCountries } };
}
