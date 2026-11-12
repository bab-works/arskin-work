/**
 * 아르스킨 일일보고 웹앱 백엔드 (Google Apps Script)
 * - 이 스크립트를 "아르스킨 일일보고 시트"에 바인딩(확장 프로그램 > Apps Script)해서 붙여넣고
 *   배포 > 새 배포 > 웹 앱 / 실행: 나 / 액세스: 모든 사용자 로 배포한 뒤 URL을 config.js 에 넣는다.
 * - 데이터는 월별 탭("2026-11")에 한 행 = 한 항목으로 저장된다.
 *   id | 날짜 | 구분 | 열 | 상태 | 내용 | 시작 | 종료 | 수정시각
 */
// 사람별 일일보고 시트(허용 목록). 웹앱은 이름(who)만 보내고, 여기 없는 이름은 거부한다.
var REPORT_SHEETS = {
  '박선희': '',
  '전성환': '1wx4ttcTh2Wro7xjFLIss6wcEqkAWouM1FYYnuiGIltw',
  '양욱정': '',
};
var CALENDAR_SS_ID = '1onONNURdaBteNOeEP4VGANBYLQHlipe451M4rnKqBLo';
var CALENDAR_TAB = '컨텐츠 캘린더';
var API_KEY = 'arskin'; // config.js 의 API_KEY 와 같아야 한다. 바꿔서 쓸 것.
var HEADER = ['id', '날짜', '구분', '열', '상태', '내용', '시작', '종료', '수정시각'];

function doGet(e) {
  var p = e.parameter || {};
  if (p.key !== API_KEY) return json({ error: 'unauthorized' });
  if (p.action === 'calendar') return json({ grid: calendarGrid() });
  if (!sheetIdFor(p.who)) return json({ error: 'no sheet for ' + p.who });
  return json({ rows: listRows(p.who, p.from, p.to) });
}

function doPost(e) {
  var body = JSON.parse(e.postData.contents || '{}');
  if (body.key !== API_KEY) return json({ error: 'unauthorized' });
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
    sh.getRange('A:I').setNumberFormat('@');
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
    sh.getRange(2, 1, sh.getLastRow() - 1, 9).getDisplayValues().forEach(function (r) {
      if (r[1] >= from && r[1] <= to) out.push(toObj(r));
    });
  });
  return out;
}

function toObj(r) {
  return { id: r[0], date: r[1], section: r[2], col: r[3], status: r[4], text: r[5], start: r[6], end: r[7], updated: r[8] };
}

function upsertRow(who, o) {
  if (!o.id || !o.date) return;
  var sh = monthSheet(who, o.date, true);
  var vals = [o.id, o.date, o.section || '', o.col || '', o.status || '', o.text || '', o.start || '', o.end || '', new Date().toISOString()];
  var idx = findRow(sh, o.id);
  if (idx) sh.getRange(idx, 1, 1, 9).setValues([vals]);
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
