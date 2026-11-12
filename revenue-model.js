// 월간요약 계산: Apps Script의 동일 함수와 실제 원본 데이터로 교차 검증합니다.
(() => {
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

function parseCSV(text) {
  const rows = [], row = []; let cell = '', quoted = false;
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { if (quoted && text[i+1] === '"') { cell += '"'; i++; } else if (quoted || !cell) quoted = !quoted; else cell += c; }
    else if (c === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((c === '\n' || c === '\r') && !quoted) { if (c === '\r' && text[i+1] === '\n') i++; row.push(cell); rows.push(row.splice(0)); cell = ''; }
    else cell += c;
  }
  if (quoted) throw new Error('CSV 따옴표 형식을 확인해 주세요.');
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

window.RevenueModel = { parse: revenueParse_, csv: parseCSV };
})();
