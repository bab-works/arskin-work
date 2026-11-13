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

// 일일마감 파일의 '통합데이터' 탭(고객 1명 = 1행)에서 직접 집계. 고객 이름은 읽지 않는다(집계만 보관).
function integratedParse_(rows) {
  var head = (rows[0] || []).map(function (h) { return String(h).trim(); });
  var title = head[0], match = String(title).match(/(\d{4})년\s*(\d{1,2})월/);
  if (!match) throw new Error("통합데이터 1행 A열에서 'YYYY년 M월'을 찾지 못했습니다.");
  var year = Number(match[1]), month = Number(match[2]);
  var col = function (name) { var i = head.indexOf(name); if (i < 0) throw new Error("통합데이터에 '" + name + "' 열이 없습니다."); return i; };
  var C = { staff: col('담당자'), visit: col('초/재진'), nation: col('국적'), route: col('경로'), total: col('총금액'), vegas: col('베가스 금액'), upsell: col('업셀 집계'), diff: col('검증차액') };
  var payCols = [['강남언니/바비톡', '강남언니/바비톡'], ['카드', '카드'], ['현금', '현금'], ['큐릭', '큐릭'], ['기타/계좌', '기타/계좌']].map(function (x) { return { name: x[1], i: col(x[0]) }; });
  var procCols = head.map(function (h, i) { return /^시술:/.test(h) ? { name: h.slice(3), i: i } : null; }).filter(Boolean);
  var num = function (v) { var t = String(v == null ? '' : v).replace(/[₩원,\s]/g, ''); if (!t || t === '-') return 0; var n = Number(t); return isFinite(n) ? n : 0; };
  var last = new Date(Date.UTC(year, month, 0)).getUTCDate(), dayMap = {}, staff = {}, pays = payCols.map(function () { return 0; }), nations = {}, routes = {}, visits = {}, procs = procCols.map(function () { return { count: 0, revenue: 0, domestic: 0, overseas: 0 }; });
  var total = 0, count = 0, vegas = 0, upsell = 0, diff = 0;
  for (var d = 1; d <= last; d++) dayMap[d] = { count: 0, total: 0 };
  rows.slice(1).forEach(function (r) {
    var dm = String(r[0] || '').trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); if (!dm || Number(dm[2]) !== month) return;
    var amt = num(r[C.total]), day = Number(dm[3]), nat = String(r[C.nation] || '').trim() || '미상', dom = nat === '한국';
    total += amt; count++; vegas += num(r[C.vegas]); upsell += num(r[C.upsell]); diff += num(r[C.diff]);
    dayMap[day].count++; dayMap[day].total += amt;
    var sn = String(r[C.staff] || '').trim() || '미상'; staff[sn] = staff[sn] || { count: 0, total: 0 }; staff[sn].count++; staff[sn].total += amt;
    payCols.forEach(function (p, k) { pays[k] += num(r[p.i]); });
    var nk = dom ? '국내' : nat; nations[nk] = (nations[nk] || 0) + amt;
    var rt = String(r[C.route] || '').trim() || '미상'; routes[rt] = routes[rt] || { count: 0, total: 0 }; routes[rt].count++; routes[rt].total += amt;
    var vt = String(r[C.visit] || '').trim() === '초' ? '초진' : '재진'; visits[vt] = visits[vt] || { count: 0, total: 0 }; visits[vt].count++; visits[vt].total += amt;
    procCols.forEach(function (p, k) { if (num(r[p.i]) > 0) { procs[k].count++; procs[k].revenue += amt; if (dom) procs[k].domestic++; else procs[k].overseas++; } });
  });
  var cum = 0, daily = [];
  for (var d2 = 1; d2 <= last; d2++) { cum += dayMap[d2].total; daily.push({ day: d2, label: month + '-' + d2, weekday: new Date(Date.UTC(year, month - 1, d2)).getUTCDay(), count: dayMap[d2].count, total: dayMap[d2].total, cumulative: cum }); }
  var active = daily.filter(function (x) { return x.count > 0; });
  var countries = Object.keys(nations).map(function (k) { return { name: k, value: nations[k] }; }).sort(function (a, b) { return (b.name === '국내') - (a.name === '국내') || b.value - a.value; });
  var abroad = countries.filter(function (x) { return x.name !== '국내'; }).reduce(function (s2, x) { return s2 + x.value; }, 0);
  var weeks = [], firstOffset = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  daily.forEach(function (x) { var i = Math.floor((x.day - 1 + firstOffset) / 7); if (!weeks[i]) weeks[i] = { name: (i + 1) + '주차', total: 0, count: 0, days: 0, valid: true }; weeks[i].days++; weeks[i].total += x.total; weeks[i].count += x.count; });
  var obj = function (m) { return Object.keys(m).map(function (k) { return { name: k, count: m[k].count, total: m[k].total }; }).sort(function (a, b) { return b.total - a.total; }); };
  return { schema: 2, source: 'integrated', title: title, year: year, month: month,
    metric: { total: total, count: count, vegas: vegas, upsellBasis: upsell, checkDifference: diff, recordedDays: active.length, averageRecord: count ? total / count : null, averageRecordedDay: active.length ? total / active.length : null, overseasShare: total ? abroad / total : null },
    daily: daily, staff: obj(staff).map(function (x) { return { name: x.name, count: x.count, total: x.total, checkDifference: 0 }; }),
    payments: payCols.map(function (p, k) { return { name: p.name, value: pays[k] }; }), countries: countries,
    categories: procCols.map(function (p, k) { return { name: p.name, count: procs[k].count, ratio: count ? procs[k].count / count : null, domestic: procs[k].domestic, overseas: procs[k].overseas, revenue: procs[k].revenue }; }).filter(function (c) { return c.count > 0; }),
    channels: obj(routes), visits: obj(visits), weeks: weeks.filter(Boolean),
    checks: { dailyDifference: 0, countDifference: 0, paymentDifference: Math.round(total - pays.reduce(function (a, b) { return a + b; }, 0)), countryDifference: 0, staffDifference: 0, cumulativeDifference: 0 } };
}
window.RevenueModel = { parse: revenueParse_, csv: parseCSV, integrated: integratedParse_ };
})();
