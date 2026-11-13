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
  '원장님': '1P3QPPH6vb7ZuEfiZ0F2UeZxppuGFnlkAZoLWlTpvdnM', // 원장님 워크시트 (월~토)
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
var HEADER = ['id', '날짜', '구분', '열', '상태', '내용', '시작', '종료', '수정시각', '생성일', '완료일', '원본id', '순서'];
var NCOL = HEADER.length;
function todayKst_() { return Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd'); }

function doGet(e) {
  var p = e.parameter || {};
  if (!memberFor_(p.code)) return json({ error: 'unauthorized' });
  if (p.action === 'ping') return json({ v: 22, auth: 'code', content: true, instagram: true, revenue: true }); // 웹앱이 사람별 시트 지원 여부를 확인
  if (p.action === 'content') { try { return json(contentData(p.fresh === '1')); } catch (err) { return json({ error: err.message }); } }
  if (p.action === 'calendar') return json({ grid: calendarGrid() });
  if (p.action === 'director') { try { return json({ tasks: directorList_(), me: memberFor_(p.code) }); } catch (err) { return json({ error: err.message }); } }
  if (p.action === 'trash') { try { return json({ rows: trashList_(p.who) }); } catch (err) { return json({ error: err.message }); } }
  if (p.action === 'reelsPlan') { try { return json({ items: reelsPlan_() }); } catch (err) { return json({ error: err.message }); } }
  if (p.action === 'leaves') { try { return json({ leaves: leaveList_() }); } catch (err) { return json({ error: err.message }); } }
  if (p.action === 'tags') { try { return json({ tags: tagList_() }); } catch (err) { return json({ error: err.message }); } }
  if (p.action === 'nudgeAcks') { try { return json({ acks: nudgeAcks_(memberFor_(p.code), p.since) }); } catch (err) { return json({ error: err.message }); } }
  if (p.action === 'nudges') { try { return json({ nudges: memberFor_(p.code) === DIRECTOR ? nudgeList_(p.since) : [] }); } catch (err) { return json({ error: err.message }); } }
  if (p.action === 'holidays') { try { return json({ holidays: holidays_(p.fresh === '1') }); } catch (err) { return json({ error: err.message }); } }
  if (!sheetIdFor(p.who)) return json({ error: 'no sheet for ' + p.who });
  return json({ rows: listRows(p.who, p.from, p.to) });
}

function doPost(e) {
  var body = JSON.parse(e.postData.contents || '{}');
  if (!memberFor_(body.code)) return json({ error: 'unauthorized' });
  if (body.action === 'revenueArchive') { try { return json(revenueArchive_(body, memberFor_(body.code))); } catch (err) { return json({ error: err.message }); } }
  if (body.action === 'revenueRows') { try { return json({ rows: revenueRows_(body.revenueKey) }); } catch (err) { return json({ error: err.message }); } }
  if (body.action === 'revenue') { try { return json(revenueData_(body.viewKey)); } catch (err) { return json({ error: err.message }); } }
  if (body.action === 'contentPlanDelete' || body.action === 'contentPlanAddMany') { try { return json({ plan: body.action === 'contentPlanDelete' ? contentPlanDelete_(body) : contentPlanAddMany_(body.rows) }); } catch (err) { return json({ error: err.message }); } }
  if (body.action === 'contentPlanSave' || body.action === 'contentPlanAdd') {
    try { return json({ plan: contentPlanWrite(body) }); } catch (err) { return json({ error: err.message }); }
  }
  if (body.action === 'directorSave' || body.action === 'directorDelete') { try { return json({ tasks: directorEdit_(body, memberFor_(body.code)) }); } catch (err) { return json({ error: err.message }); } }
  if (body.action === 'trashRestore') { var lk = LockService.getScriptLock(); lk.waitLock(10000); try { return json({ restored: trashRestore_(body.keys || []) }); } catch (err) { return json({ error: err.message }); } finally { lk.releaseLock(); } }
  if (body.action === 'reelsReject') { try { return json({ ok: reelsShot_(body.row, '기각') }); } catch (err) { return json({ error: err.message }); } }
  if (body.action === 'reelsShot') { try { return json({ ok: reelsShot_(body.row) }); } catch (err) { return json({ error: err.message }); } }
  if (body.action === 'leaveAdd' || body.action === 'leaveDelete') { try { return json({ leaves: leaveEdit_(body, memberFor_(body.code)) }); } catch (err) { return json({ error: err.message }); } }
  if (body.action === 'tagSave') { try { return json({ tags: tagSave_(body) }); } catch (err) { return json({ error: err.message }); } }
  if (body.action === 'nudgeAck') { try { if (memberFor_(body.code) !== DIRECTOR) throw new Error('원장님만 확인할 수 있습니다'); return json({ n: nudgeAck_(body.at) }); } catch (err) { return json({ error: err.message }); } }
  if (body.action === 'nudge') { try { var me = memberFor_(body.code); if (me === DIRECTOR) throw new Error('원장님은 재촉할 수 없습니다'); nudgeSheet_().appendRow([new Date().toISOString(), me]); return json({ ok: true }); } catch (err) { return json({ error: err.message }); } }
  if (body.action === 'generate') { try { return json(generateDay_(body.who, body.date, body.force === true)); } catch (err) { return json({ error: err.message }); } }
  if (body.action === 'holidayAdd' || body.action === 'holidayDelete') { try { return json({ holidays: holidayEdit_(body) }); } catch (err) { return json({ error: err.message }); } }
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
    sh.getRange('A:M').setNumberFormat('@');
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
  return { id: r[0], date: r[1], section: r[2], col: r[3], status: r[4], text: r[5], start: r[6], end: r[7], updated: r[8], created: r[9] || r[1], completed: r[10], origin: r[11] || r[0], order: r[12] || '' };
}

function upsertRow(who, o) {
  if (!o.id || !o.date) return;
  var sh = monthSheet(who, o.date, true);
  var idx = findRow(sh, o.id);
  // 생성일·완료일·원본id 는 서버가 관리: 클라이언트가 안 보내도 기존 값을 유지한다
  var prev = idx ? sh.getRange(idx, 10, 1, 4).getDisplayValues()[0] : ['', '', '', ''];
  var done = o.status === 'done' || o.status === '⭕';
  var vals = [o.id, o.date, o.section || '', o.col || '', o.status || '', o.text || '', o.start || '', o.end || '', new Date().toISOString(),
    o.created || prev[0] || todayKst_(), done ? (prev[1] || todayKst_()) : '', o.origin || prev[2] || o.id, o.order != null && o.order !== '' ? String(o.order) : prev[3]];
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
  if (!idx) return;
  var row = sh.getRange(idx, 1, 1, NCOL).getDisplayValues()[0];
  trashSheet_().appendRow([new Date().toISOString(), who].concat(row)); // 휴지통에 먼저 보관
  sh.deleteRow(idx);
}

/* ---------- 휴지통: 지운 행을 14일 보관, 복원 가능 ---------- */
var TRASH_DAYS = 14;
function trashSheet_() {
  var ss = SpreadsheetApp.openById(sheetIdFor('공통'));
  var sh = ss.getSheetByName('trash');
  if (!sh) { sh = ss.insertSheet('trash'); sh.getRange('A:O').setNumberFormat('@'); sh.appendRow(['삭제시각', '시트'].concat(HEADER)); sh.setFrozenRows(1); }
  return sh;
}
function trashList_(who) {
  var sh = trashSheet_(), last = sh.getLastRow();
  if (last < 2) return [];
  var vals = sh.getRange(2, 1, last - 1, NCOL + 2).getDisplayValues();
  var cutoff = new Date(Date.now() - TRASH_DAYS * 864e5).toISOString();
  for (var i = vals.length - 1; i >= 0; i--) if (vals[i][0] && vals[i][0] < cutoff) sh.deleteRow(i + 2); // 오래된 것 정리
  return vals.filter(function (r) { return r[0] >= cutoff && (!who || r[1] === who || (r[1] === '공통' && who !== PLAN_TRASH)); })
    .map(function (r) { var o = toObj(r.slice(2)); o.deletedAt = r[0]; o.who = r[1]; return o; });
}
function trashRestore_(keys) { // keys: ['삭제시각|id', ...]
  var sh = trashSheet_(), last = sh.getLastRow();
  if (last < 2) return 0;
  var vals = sh.getRange(2, 1, last - 1, NCOL + 2).getDisplayValues(), n = 0;
  for (var i = vals.length - 1; i >= 0; i--) {
    if (keys.indexOf(vals[i][0] + '|' + vals[i][2]) < 0) continue;
    var o = toObj(vals[i].slice(2));
    if (vals[i][1] === PLAN_TRASH) { contentPlanAddMany_([JSON.parse(o.end)], true); sh.deleteRow(i + 2); n++; continue; } // 영상 기획은 빈 행에 되돌림
    upsertRow(vals[i][1], { id: o.id, date: o.date, section: o.section, col: o.col, status: o.status, text: o.text, start: o.start, end: o.end, created: o.created, origin: o.origin, order: o.order });
    sh.deleteRow(i + 2); n++;
  }
  return n;
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
function revenueKeyCheck_(provided) {
  var expected = PropertiesService.getScriptProperties().getProperty('REVENUE_VIEW_KEY');
  if (!expected) throw new Error('매출표 비밀번호가 아직 설정되지 않았습니다.');
  if (String(provided || '') !== expected) throw new Error('매출 비밀번호가 맞지 않습니다.');
}
// 달별 분석 보관: 원본 매출 시트(소유자만 접근)의 '_분석보관' 탭 [월 | 분석 JSON | 저장시각 | 저장자]
function revenueArchive_(b, me) {
  revenueKeyCheck_(b.revenueKey);
  var ss = SpreadsheetApp.openById(REVENUE_SS_ID), sh = ss.getSheetByName('_분석보관');
  if (!sh) { sh = ss.insertSheet('_분석보관'); sh.getRange('A:D').setNumberFormat('@'); sh.appendRow(['월', '분석', '저장시각', '저장자']); sh.hideSheet(); }
  var last = sh.getLastRow(), rows = last > 1 ? sh.getRange(2, 1, last - 1, 2).getValues() : [];
  if (b.op === 'list') return { months: rows.map(function (r) { return String(r[0]); }).filter(String).sort().reverse() };
  var month = String(b.month || ''); if (!/^\d{4}-\d{2}$/.test(month)) throw new Error('월 형식이 올바르지 않습니다');
  var idx = -1; for (var i = 0; i < rows.length; i++) if (String(rows[i][0]) === month) { idx = i + 2; break; }
  if (b.op === 'get') { if (idx < 0) throw new Error('보관된 분석이 없습니다'); return { data: JSON.parse(sh.getRange(idx, 2).getValue()) }; }
  if (b.op !== 'save') throw new Error('unknown op');
  // 올리기는 업로드 토큰(스크립트 속성 REVENUE_ADMIN_KEYS, 쉼표로 여러 개)이 있어야 한다
  var admins = String(PropertiesService.getScriptProperties().getProperty('REVENUE_ADMIN_KEYS') || '').split(',').map(function (x) { return x.trim(); }).filter(String);
  if (!admins.length) throw new Error('업로드 토큰이 아직 설정되지 않았습니다 (스크립트 속성 REVENUE_ADMIN_KEYS)');
  if (admins.indexOf(String(b.adminKey || '')) < 0) throw new Error('업로드 토큰이 맞지 않습니다');
  var text = JSON.stringify(b.data || {}); if (text.length > 45000) throw new Error('분석 결과가 너무 큽니다');
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try { var row = [month, text, new Date().toISOString(), me]; if (idx > 0) sh.getRange(idx, 1, 1, 4).setValues([row]); else sh.appendRow(row); } finally { lock.releaseLock(); }
  return { ok: true };
}
function revenueRows_(provided) {
  revenueKeyCheck_(provided);
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

/* ---------- 공휴일: '대한민국의 휴일' 캘린더를 공통 시트 holidays 탭에 캐시 ---------- */
var HOLIDAY_CAL = 'ko.south_korea#holiday@group.v.calendar.google.com';
var HOLIDAY_HEADER = ['날짜', '이름', '출처']; // 출처: auto(캘린더) | manual(직접 추가)

function holidaySheet_() {
  var ss = SpreadsheetApp.openById(sheetIdFor('공통'));
  var sh = ss.getSheetByName('holidays');
  if (!sh) { sh = ss.insertSheet('holidays'); sh.getRange('A:C').setNumberFormat('@'); sh.appendRow(HOLIDAY_HEADER); sh.setFrozenRows(1); }
  return sh;
}
function holidayRows_(sh) { return sh.getLastRow() < 2 ? [] : sh.getRange(2, 1, sh.getLastRow() - 1, 3).getDisplayValues().filter(function (r) { return r[0]; }); }
function holidayWrite_(sh, rows) {
  rows.sort(function (a, b) { return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0; });
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 3).clearContent();
  if (rows.length) sh.getRange(2, 1, rows.length, 3).setValues(rows);
}
function holidayFetch_(year) {
  var cal = CalendarApp.getCalendarById(HOLIDAY_CAL) || CalendarApp.subscribeToCalendar(HOLIDAY_CAL);
  var out = [];
  cal.getEvents(new Date(year, 0, 1), new Date(year + 1, 0, 1)).forEach(function (ev) {
    if (!ev.isAllDayEvent() || /기념일/.test(ev.getDescription()) || /노동절|근로자/.test(ev.getTitle())) return; // 기념일·노동절(병원 근무일)은 휴일 아님
    for (var d = new Date(ev.getAllDayStartDate()); d < ev.getAllDayEndDate(); d.setDate(d.getDate() + 1))
      out.push([Utilities.formatDate(d, 'Asia/Seoul', 'yyyy-MM-dd'), ev.getTitle(), 'auto']);
  });
  return out;
}
// 올해·내년 auto 행이 없거나 fresh 요청이면 캘린더에서 다시 받아 그 해의 auto 행만 교체 (manual 행은 유지)
function holidays_(fresh) {
  var sh = holidaySheet_(), rows = holidayRows_(sh), y = Number(todayKst_().slice(0, 4)), changed = false;
  [y, y + 1].forEach(function (yr) {
    var has = rows.some(function (r) { return r[2] === 'auto' && r[0].slice(0, 4) === String(yr); });
    if (has && !fresh) return;
    var got = holidayFetch_(yr);
    if (!got.length) return; // 캘린더 응답이 비면 기존 캐시 유지
    rows = rows.filter(function (r) { return !(r[2] === 'auto' && r[0].slice(0, 4) === String(yr)); }).concat(got);
    changed = true;
  });
  if (changed) { var lock = LockService.getScriptLock(); lock.waitLock(10000); try { holidayWrite_(sh, rows); } finally { lock.releaseLock(); } }
  return rows.filter(function (r) { return !(r[2] === 'auto' && /노동절|근로자/.test(r[1])); }).map(function (r) { return { date: r[0], name: r[1], source: r[2] }; });
}
function holidayEdit_(body) {
  var date = String(body.date || ''), name = String(body.name || '').trim().slice(0, 40);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('날짜 형식이 올바르지 않습니다');
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    var sh = holidaySheet_();
    var rows = holidayRows_(sh).filter(function (r) { return !(r[2] === 'manual' && r[0] === date); }); // 직접 추가한 휴일만 지울 수 있음
    if (body.action === 'holidayAdd') rows.push([date, name || '휴무', 'manual']);
    holidayWrite_(sh, rows);
    return rows.map(function (r) { return { date: r[0], name: r[1], source: r[2] }; });
  } finally { lock.releaseLock(); }
}

/* ---------- 날짜 보고서 자동 생성: 직전 근무일의 이어갈 업무를 그날로 복사 ---------- */
var TASK_KEYS_ = ['주간고정', '데일리고정', '배치예정', '팔로업', '변동업무', '릴스업무'];
var FLOW_ = ['배치예정', '변동업무', '팔로업'];
var NO_CARRY_ = ['타임라인', '마케팅공통', '회의', '회의일정', '프로젝트', '하위업무', '원장님완료', '원장님리스트', '원장님숙제']; // 원장님 섹션은 원장님 숙제 페이지로 대체
function isoWeek_(d) { // 'YYYY-Www' (월요일 시작, ISO 8601)
  var t = new Date(d + 'T00:00:00Z'), wd = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - wd);
  var y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return t.getUTCFullYear() + '-W' + ('0' + Math.ceil(((t - y0) / 864e5 + 1) / 7)).slice(-2);
}
function shiftKst_(d, n) { var t = new Date(d + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); }
function newId_(d, i) { return d.replace(/-/g, '') + '-' + Date.now().toString(36) + ('00' + i.toString(36)).slice(-3); }
function isWorkday_(d, who) { // 마케터 월~금, 원장님 월~토 (공휴일 제외)
  var wd = new Date(d + 'T00:00:00Z').getUTCDay();
  return wd !== 0 && (wd !== 6 || who === DIRECTOR) && !holidays_(false).some(function (h) { return h.date === d; });
}
// 멱등: 같은 사람·날짜는 한 번만 자동 생성 (사용자가 그날 행을 지워도 다시 만들지 않음). force 는 '전일 가져오기' 버튼.
// shortcut: 생성 기록을 스크립트 속성에 쌓음, 수천 건이 되면 오래된 키 정리 필요
function generateDay_(who, d, force) {
  if (!sheetIdFor(who) || who === '공통') throw new Error('no sheet for ' + who);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(d))) throw new Error('날짜 형식이 올바르지 않습니다');
  var props = PropertiesService.getScriptProperties(), mark = 'GEN_' + who + '_' + d;
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    if (!force && (props.getProperty(mark) || listRows(who, d, d).length)) return { rows: [], skipped: true };
    var prev = listRows(who, shiftKst_(d, -30), shiftKst_(d, -1));
    var src = prev.map(function (r) { return r.date; }).sort().pop();
    if (!src) { props.setProperty(mark, '1'); return { rows: [], src: '' }; }
    var srcRows = prev.filter(function (r) { return r.date === src; });
    var isDone = function (r) { return r.status === 'done' || r.status === '⭕'; };
    // 이월 규칙: 데일리=매일 시작 전으로 / 주간=같은 주엔 상태 유지, 새 주엔 시작 전으로 / 그 외 업무=완료되면 끝
    var newWeek = isoWeek_(d) !== isoWeek_(src);
    var parents = srcRows.filter(function (r) {
      if (who === DIRECTOR) return ['타임라인', '원장님일정', '원장님완료'].indexOf(r.section) < 0 && !((r.section === '원장님리스트' || r.section === '원장님숙제') && isDone(r)); // 원장님: 끝난 리스트·숙제·일정은 넘기지 않음
      if (NO_CARRY_.indexOf(r.section) >= 0) return false;
      if (r.section === '데일리고정' || r.section === '주간고정') return true;
      return !(TASK_KEYS_.indexOf(r.section) >= 0 && isDone(r));
    });
    var ids = {}, n = 0, copies = [];
    parents.forEach(function (r) {
      ids[r.id] = newId_(d, n++);
      var st = r.section === '데일리고정' || (r.section === '주간고정' && newWeek) ? 'todo' : r.status;
      var c = copyOf_(r, ids[r.id], d, st, r.col);
      if (FLOW_.indexOf(r.section) >= 0) // 자동 배치: 하위 업무 있으면 팔로업, 시작 전이면 배치예정, 진행 중이면 변동업무
        c.section = srcRows.some(function (x) { return x.section === '하위업무' && x.col === r.id; }) ? '팔로업' : (st === 'todo' || !st) ? '배치예정' : '변동업무';
      if (st === r.status && isDone(r)) c.completed = r.completed; // 같은 주 주간업무는 완료일도 유지
      copies.push(c);
    });
    srcRows.forEach(function (r) {
      if ((r.section === '프로젝트' || r.section === '하위업무') && ids[r.col]) copies.push(copyOf_(r, newId_(d, n++), d, r.status, ids[r.col]));
    });
    if (copies.length) {
      var sh = monthSheet(who, d, true), now = new Date().toISOString();
      sh.getRange(sh.getLastRow() + 1, 1, copies.length, NCOL).setValues(copies.map(function (o) {
        return [o.id, o.date, o.section, o.col, o.status, o.text, o.start, o.end, now, o.created, o.completed || '', o.origin, o.order || ''];
      }));
    }
    props.setProperty(mark, '1');
    return { rows: copies, src: src };
  } finally { lock.releaseLock(); }
}
function copyOf_(r, id, d, status, col) {
  return { id: id, date: d, section: r.section, col: col || '', status: status || '', text: r.text, start: r.start, end: r.end, created: r.created || r.date, completed: '', origin: r.origin || r.id, order: r.order || '' };
}
// 트리거 진입점: 평일(공휴일 제외) 00:05 KST 에 모든 사람의 그날 보고서 생성
function dailyGenerate() {
  var d = todayKst_();
  Object.keys(REPORT_SHEETS).forEach(function (who) { if (who !== '공통' && isWorkday_(d, who)) try { generateDay_(who, d, false); } catch (e) { console.error(who, e); } });
}
// 편집기에서 한 번만 실행: 기존 트리거를 지우고 매일 00:05(Asia/Seoul) 트리거를 다시 만든다
function setupDailyTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'dailyGenerate') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('dailyGenerate').timeBased().everyDays(1).atHour(0).nearMinute(5).inTimezone('Asia/Seoul').create();
}

/* ---------- 원장님 숙제: 마케터가 원장님께 드리는 숙제. 마케터 모두 읽기·쓰기, 승인·거절은 원장님만 ---------- */
var DIRECTOR = '원장님';
var DIR_HEADER = ['id', '생성일', '작성자', '내용', '상태', '마감', '결정일', '완료일', '메모', '수정시각']; // 상태: pending|approved|rejected|done
var DIR_STATUS = ['pending', 'approved', 'rejected', 'done'];
function directorSheet_() {
  var ss = SpreadsheetApp.openById(sheetIdFor('공통'));
  var sh = ss.getSheetByName('director_tasks');
  if (!sh) { sh = ss.insertSheet('director_tasks'); sh.getRange('A:J').setNumberFormat('@'); sh.appendRow(DIR_HEADER); sh.setFrozenRows(1); }
  return sh;
}
function directorRows_(sh) { return sh.getLastRow() < 2 ? [] : sh.getRange(2, 1, sh.getLastRow() - 1, DIR_HEADER.length).getDisplayValues(); }
function directorList_() {
  return directorRows_(directorSheet_()).filter(function (r) { return r[0]; }).map(function (r) {
    return { id: r[0], created: r[1], author: r[2], text: r[3], status: r[4] || 'pending', due: r[5], decided: r[6], completed: r[7], memo: r[8], updated: r[9] };
  });
}
function directorEdit_(body, me) {
  if (!me) throw new Error('unauthorized');
  var t = body.task || {}, lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    var sh = directorSheet_(), rows = directorRows_(sh), idx = -1;
    for (var i = 0; i < rows.length; i++) if (t.id && rows[i][0] === String(t.id)) { idx = i; break; }
    var old = idx >= 0 ? rows[idx] : null, now = new Date().toISOString(), today = todayKst_();
    if (body.action === 'directorDelete') {
      if (!old) return directorList_();
      if (me !== DIRECTOR && me !== old[2]) throw new Error('작성자나 원장님만 지울 수 있습니다');
      sh.deleteRow(idx + 2);
      return directorList_();
    }
    var text = String(t.text == null ? (old ? old[3] : '') : t.text).trim().slice(0, 500);
    if (!text) throw new Error('내용을 입력하세요');
    var status = DIR_STATUS.indexOf(t.status) >= 0 ? t.status : (old ? old[4] : 'pending');
    var prevStatus = old ? old[4] : 'pending';
    if (status !== prevStatus && me !== DIRECTOR && !(prevStatus === 'approved' && status === 'done')) // 마케터는 승인된 숙제를 완료 처리만 가능
      throw new Error('승인·거절은 원장님만 할 수 있습니다');
    var decided = status === 'approved' || status === 'rejected' ? (status === prevStatus && old ? old[6] : today) : (status === 'done' && old ? old[6] : '');
    var row = [old ? old[0] : 'D' + Date.now().toString(36), old ? old[1] : today, old ? old[2] : me, text, status,
      String(t.due == null ? (old ? old[5] : '') : t.due).slice(0, 10), decided, status === 'done' ? (old && old[7] ? old[7] : today) : '',
      String(t.memo == null ? (old ? old[8] : '') : t.memo).slice(0, 500), now];
    if (old) sh.getRange(idx + 2, 1, 1, row.length).setValues([row]); else sh.appendRow(row);
    return directorList_();
  } finally { lock.releaseLock(); }
}

/* ---------- 릴스업무 ↔ 영상 기획: 아직 촬영 안 한 기획을 가져오고, 촬영하면 기획 시트에 ⭕ 표시 ---------- */
// 기획 시트 열: J 타겟팅, K 방식, L 영상 리스트(제목), M 촬영 여부, N 업로드완료, O 레퍼런스, P 업로드 영상
function reelsPlan_() {
  return contentPlanRead(SpreadsheetApp.openById(CALENDAR_SS_ID)).filter(function (r) {
    var v = r.v.map(function (x) { return String(x).trim(); });
    return /[\p{L}\p{N}]/u.test(v[2]) && v[1] !== '기각' && v[3] !== '기각' && v[3] !== '⭕' && !v[4];
  }).map(function (r) { return { row: r.row, title: String(r.v[2]).trim(), kind: String(r.v[0]).trim(), ref: String(r.v[5]).trim() }; });
}
function reelsShot_(row, mark) { // mark: '⭕'(촬영, 기본) 또는 '기각'
  row = Number(row);
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    var sh = contentPlanSheet(SpreadsheetApp.openById(CALENDAR_SS_ID));
    if (!Number.isInteger(row) || row < 4 || row > sh.getLastRow()) throw new Error('기획 행 번호가 올바르지 않습니다');
    var cell = sh.getRange(row, 13);
    if (String(cell.getDisplayValue()).trim() && mark !== '기각') return false; // 촬영 표시는 비어 있을 때만
    cell.setValue(mark || '⭕'); SpreadsheetApp.flush(); CacheService.getScriptCache().remove('content-v3');
    return true;
  } finally { lock.releaseLock(); }
}

/* ---------- 태그 설정: 공통 시트 tags 탭 (태그 | 표시명 | 색 | 설명). 업무 글의 "태그)" 는 그대로 둔다 ---------- */
var TAG_COLORS_ = ['grey', 'blue', 'green', 'red', 'orange', 'purple', 'pink', 'teal'];
function tagSheet_() {
  var ss = SpreadsheetApp.openById(sheetIdFor('공통')), sh = ss.getSheetByName('tags');
  if (!sh) { sh = ss.insertSheet('tags'); sh.getRange('A:D').setNumberFormat('@'); sh.appendRow(['태그', '표시명', '색', '설명']); sh.setFrozenRows(1); }
  return sh;
}
function tagList_() {
  var sh = tagSheet_(); if (sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, 4).getDisplayValues().filter(function (r) { return r[0]; })
    .map(function (r) { return { tag: r[0], label: r[1], color: r[2], desc: r[3] }; });
}
function tagSave_(b) {
  var tag = String(b.tag || '').trim().slice(0, 20);
  if (!tag) throw new Error('태그 이름이 비어 있습니다');
  var row = [tag, String(b.label || '').slice(0, 20), TAG_COLORS_.indexOf(b.color) >= 0 ? b.color : '', String(b.desc || '').slice(0, 60)];
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    var sh = tagSheet_(), last = sh.getLastRow(), keys = last > 1 ? sh.getRange(2, 1, last - 1, 1).getDisplayValues() : [], idx = -1;
    for (var i = 0; i < keys.length; i++) if (keys[i][0] === tag) { idx = i + 2; break; }
    if (idx > 0) sh.getRange(idx, 1, 1, 4).setValues([row]); else sh.appendRow(row);
  } finally { lock.releaseLock(); }
  return tagList_();
}

/* ---------- 원장님 재촉: 마케터가 누르면 기록, 원장님 접속 코드로 연 창만 받아 간다 ---------- */
function nudgeSheet_() {
  var ss = SpreadsheetApp.openById(sheetIdFor('공통')), sh = ss.getSheetByName('nudges');
  if (!sh) { sh = ss.insertSheet('nudges'); sh.getRange('A:B').setNumberFormat('@'); sh.appendRow(['시각', '보낸 사람', '확인 시각']); sh.setFrozenRows(1); }
  return sh;
}
// 원장님이 확인한 재촉(at 이전, 아직 미확인)에 확인 시각을 적는다
function nudgeAck_(at) {
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    var sh = nudgeSheet_(), last = sh.getLastRow(); if (last < 2) return 0;
    var from = Math.max(2, last - 49), vals = sh.getRange(from, 1, last - from + 1, 3).getDisplayValues(), now = new Date().toISOString(), n = 0;
    vals.forEach(function (r, i) { if (r[0] && r[0] <= String(at) && !r[2]) { sh.getRange(from + i, 3).setValue(now); n++; } });
    return n;
  } finally { lock.releaseLock(); }
}
function nudgeAcks_(me, since) { // 내가 보낸 재촉 중 since 이후에 확인된 것
  var sh = nudgeSheet_(), last = sh.getLastRow(); if (last < 2 || !me) return [];
  var from = Math.max(2, last - 49);
  return sh.getRange(from, 1, last - from + 1, 3).getDisplayValues().filter(function (r) { return r[1] === me && r[2] && (!since || r[2] > since); })
    .map(function (r) { return { at: r[0], ack: r[2] }; });
}
function nudgeList_(since) {
  var sh = nudgeSheet_(), last = sh.getLastRow(); if (last < 2) return [];
  var from = Math.max(2, last - 49); // 최근 50건만 본다
  return sh.getRange(from, 1, last - from + 1, 2).getDisplayValues().filter(function (r) { return r[0] && (!since || r[0] > since); })
    .map(function (r) { return { at: r[0], from: r[1] }; });
}

/* ---------- 영상 기획: 삭제(휴지통 보관 후 행 비우기), 여러 개 한 번에 추가 ---------- */
var PLAN_TRASH = '영상기획';
function contentPlanDelete_(body) {
  var row = Number(body.row), before = contentClean(body.before);
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    var ss = SpreadsheetApp.openById(CALENDAR_SS_ID), sh = contentPlanSheet(ss);
    if (!Number.isInteger(row) || row < 4 || row > sh.getLastRow()) throw new Error('행 번호가 올바르지 않습니다.');
    var now = sh.getRange(row, 10, 1, 7).getDisplayValues()[0];
    if (!now.every(function (x, i) { return String(x).trim() === before[i].trim(); })) throw new Error('다른 사람이 먼저 수정했어요. 새로고침 후 다시 시도해 주세요.');
    // 휴지통 행: id=plan-행, 날짜=오늘, 구분=영상기획, 내용=제목, 종료=전체 값(JSON)
    trashSheet_().appendRow([new Date().toISOString(), PLAN_TRASH, 'plan-' + row, todayKst_(), PLAN_TRASH, String(row), '', now[2], '', JSON.stringify(now), '', '', '', '', '']);
    sh.getRange(row, 10, 1, 7).clearContent(); // 행 번호가 바뀌지 않게 지우지 않고 비운다
    SpreadsheetApp.flush(); CacheService.getScriptCache().remove('content-v3');
    return contentPlanRead(ss);
  } finally { lock.releaseLock(); }
}
function contentPlanAddMany_(rows, locked) { // locked: 이미 잠금을 잡은 호출(휴지통 복원)
  if (!Array.isArray(rows) || !rows.length || rows.length > 200) throw new Error('추가할 내용을 확인해 주세요 (최대 200개).');
  rows = rows.map(contentClean).filter(function (v) { return v.some(function (x) { return x.trim(); }); });
  var lock = locked ? null : LockService.getScriptLock(); if (lock) lock.waitLock(10000);
  try {
    var ss = SpreadsheetApp.openById(CALENDAR_SS_ID), sh = contentPlanSheet(ss);
    var last = Math.max(4, sh.getLastRow()), vals = sh.getRange(4, 10, last - 3, 7).getDisplayValues(), empty = [];
    for (var i = 0; i < vals.length; i++) if (vals[i].every(function (x) { return !String(x).trim(); })) empty.push(i + 4);
    var next = last + 1;
    rows.forEach(function (v) {
      var r = empty.length ? empty.shift() : next++;
      if (r > sh.getMaxRows()) sh.insertRowsAfter(sh.getMaxRows(), 1);
      sh.getRange(r, 10, 1, 7).setValues([v.map(function (x) { return /^=/.test(x) ? "'" + x : x; })]);
    });
    SpreadsheetApp.flush(); CacheService.getScriptCache().remove('content-v3');
    return contentPlanRead(ss);
  } finally { if (lock) lock.releaseLock(); }
}

/* ---------- 연월차: 공통 시트 leaves 탭 [id | 날짜 | 이름 | 종류 | 메모 | 등록자 | 등록시각]. 종류: 연차(1일) / 오전 반차·오후 반차(0.5일) ---------- */
var LEAVE_KINDS = ['연차', '오전 반차', '오후 반차'];
function leaveSheet_() {
  var ss = SpreadsheetApp.openById(sheetIdFor('공통')), sh = ss.getSheetByName('leaves');
  if (!sh) { sh = ss.insertSheet('leaves'); sh.getRange('A:G').setNumberFormat('@'); sh.appendRow(['id', '날짜', '이름', '종류', '메모', '등록자', '등록시각']); sh.setFrozenRows(1); }
  return sh;
}
function leaveList_() {
  var sh = leaveSheet_(); if (sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, 7).getDisplayValues().filter(function (r) { return r[0]; })
    .map(function (r) { return { id: r[0], date: r[1], who: r[2], kind: r[3], memo: r[4], by: r[5] }; });
}
function leaveEdit_(b, me) {
  if (!me) throw new Error('unauthorized');
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    var sh = leaveSheet_();
    if (b.action === 'leaveDelete') {
      var last = sh.getLastRow(), ids = last > 1 ? sh.getRange(2, 1, last - 1, 1).getDisplayValues() : [];
      for (var i = ids.length - 1; i >= 0; i--) if (ids[i][0] === String(b.id)) sh.deleteRow(i + 2);
    } else {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(b.date))) throw new Error('날짜 형식이 올바르지 않습니다');
      if (LEAVE_KINDS.indexOf(b.kind) < 0) throw new Error('종류를 확인해 주세요');
      var who = String(b.who || me).slice(0, 20);
      sh.appendRow(['L' + Date.now().toString(36), b.date, who, b.kind, String(b.memo || '').slice(0, 60), me, new Date().toISOString()]);
    }
  } finally { lock.releaseLock(); }
  return leaveList_();
}
