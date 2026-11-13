(() => {
  const sourceURL = 'https://docs.google.com/spreadsheets/d/1XoxsdvRVo8-L_zSuZp6kWzLdlHLqikXRVhYgnIZmQpw/edit#gid=1411519381';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => n == null ? '—' : Math.round(n).toLocaleString('ko-KR');
  const won = n => n == null ? '—' : fmt(n) + '원';
  const pct = n => n == null ? '—' : (n * 100).toFixed(1) + '%';
  const colors = ['#3182f6', '#55a5ff', '#7acac1', '#97a7e7', '#d4dbe9', '#b7c4d8'];
  let generation = 0;
  let host, data, sourceMode = '', busy = false, chartMode = 'daily', selectedDay;
  const $ = id => document.getElementById(id);
  const header = () => `<div class="rv-heading"><div><span class="rv-eyebrow">ARSKIN BUSINESS</span><h1>월간 매출표</h1><p>한 달의 흐름을, 숫자로 선명하게</p></div><div class="rv-actions"><a href="${sourceURL}" target="_blank" rel="noopener">원본 요약 ↗</a>${data ? `<select id="rvMonth" aria-label="볼 달 선택"><option value="">이번 달 (실시간)</option>${months.map(m => `<option value="${m}"${m === shownMonth ? ' selected' : ''}>${+m.slice(0, 4)}년 ${+m.slice(5)}월 (보관)</option>`).join('')}</select><label class="rv-upload" title="그 달의 매출 파일(.xlsx 또는 월간요약 CSV)을 올리면 자동 분석해 보관합니다">파일로 달 추가<input type="file" id="rvUpload" accept=".xlsx,.xls,.csv" hidden></label>` + (sourceMode ? '<button id="rvRefresh">새로고침</button>' : '') + '<button id="rvLock">닫기</button>' : ''}</div></div>`;
  let months = [], shownMonth = '';
  // 보관함: 달별 분석 결과를 원본 매출 시트의 '_분석보관' 탭에 저장(매출 비밀번호 필요)
  const archive = async (op, extra = {}) => {
    const res = await (await fetch(window.CONFIG.API_URL, { method: 'POST', body: JSON.stringify({ code: localStorage.accessCode || '', action: 'revenueArchive', op, revenueKey: savedKey(), ...extra }) })).json();
    if (res.error) throw new Error(res.error); return res;
  };
  const loadMonths = () => archive('list').then(r => { months = r.months || []; if (data) render(); }).catch(() => {});
  // 엑셀(.xlsx)은 필요할 때만 SheetJS 를 불러 읽는다
  const loadXLSX = () => window.XLSX ? Promise.resolve(window.XLSX) : new Promise((ok, no) => { const sc = document.createElement('script'); sc.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'; sc.onload = () => ok(window.XLSX); sc.onerror = () => no(new Error('엑셀 읽기 도구를 불러오지 못했습니다')); document.head.append(sc); });
  async function fileRows(file) {
    if (file.size > 15 * 1024 * 1024) throw new Error('파일이 너무 큽니다 (15MB 이하).');
    if (/\.csv$/i.test(file.name)) return window.RevenueModel.csv(await file.text());
    const X = await loadXLSX(), wb = X.read(await file.arrayBuffer(), { type: 'array' });
    const rowsOf = n => X.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: false, defval: '' });
    const name = wb.SheetNames.find(n => n === '월간요약') || wb.SheetNames.find(n => { const r = rowsOf(n); return /\d{4}년\s*\d{1,2}월/.test(r[0]?.[0] || '') && r[5]?.[0] === '날짜'; });
    if (!name) throw new Error("파일에서 '월간요약' 탭을 찾지 못했습니다.");
    return rowsOf(name);
  }
  async function uploadMonth(file) {
    const st = $('rvStatus'); if (st) st.textContent = '파일 분석 중…';
    const rows = await fileRows(file), parsed = window.RevenueModel.parse(rows, rows), month = `${parsed.year}-${String(parsed.month).padStart(2, '0')}`;
    parsed.updated = file.name;
    let adminKey = ''; try { adminKey = localStorage.revenueAdminKey || ''; } catch {}
    if (!adminKey) adminKey = (prompt('매출 파일 업로드 토큰을 입력해 주세요 (관리자에게 받은 값)') || '').trim();
    if (!adminKey) throw new Error('업로드 토큰이 필요합니다');
    try { await archive('save', { month, data: parsed, adminKey }); } catch (e) { if (/토큰/.test(e.message)) try { localStorage.removeItem('revenueAdminKey'); } catch {} throw e; }
    try { localStorage.revenueAdminKey = adminKey; } catch {}
    generation++; sourceMode = ''; data = parsed; shownMonth = month; selectedDay = parsed.daily.at(-1)?.day; await loadMonths(); render();
  }
  window.RevenueHub = { open() { host = $('revenueHub'); if (!host.innerHTML) { renderLocked(); if (savedKey()) load(); } }, refresh() { if (sourceMode) load(); } };
  function renderLocked(message = '') {
    data = null; host.innerHTML = header() + `<section class="rv-unlock"><div class="rv-lock-icon" aria-hidden="true">▤</div><h2>월간 매출 요약</h2><p>연결된 Google 시트의 월간요약을 불러옵니다.</p><form class="rv-pass" id="rvPassForm"><label for="rvPass">매출 비밀번호</label><input type="password" id="rvPass" autocomplete="current-password" required><button class="primary" id="rvConnect">불러오기</button></form><p class="rv-message" id="rvMessage" role="status">${esc(message)}</p><details class="rv-import"><summary>월간요약 CSV 파일로 보기</summary><p>원본 월간요약 탭에서 다운로드한 CSV를 이 기기에서 분석합니다.</p><label for="rvFile">월간요약 CSV 선택</label><input id="rvFile" type="file" accept=".csv,text/csv"></details></section>`;
    $('rvFile').onchange = async e => {
      const file = e.target.files[0]; if (!file) return;
      try {
        if (file.size > 2 * 1024 * 1024) throw new Error('월간요약 탭의 CSV 파일만 선택해 주세요.');
        const rows = window.RevenueModel.csv(await file.text());
        const parsed = window.RevenueModel.parse(rows, rows);
        generation++; sourceMode = ''; data = parsed; data.updated = 'CSV 파일'; selectedDay = null; render();
      } catch (err) { $('rvMessage').textContent = err.message; e.target.value = ''; }
    };
    $('rvPassForm').onsubmit = e => { e.preventDefault(); load($('rvPass').value); };
  }
  const savedKey = () => { try { return localStorage.revenueKey || ''; } catch { return ''; } };
  async function load(entered) {
    if (busy) return; busy = true; const requestGeneration = generation;
    const button = $('rvRefresh') || $('rvConnect'); if (button) { button.disabled = true; button.textContent = '불러오는 중…'; }
    try {
      // 매출은 Apps Script가 비밀번호를 확인한 뒤에만 돌려준다(공개 CSV 사용 안 함).
      const key = entered ?? savedKey(); if (!key) throw new Error('매출 비밀번호를 입력해 주세요.');
      const body = { code: localStorage.accessCode || '', action: 'revenueRows', revenueKey: key };
      const res = await (await fetch(window.CONFIG.API_URL, { method: 'POST', body: JSON.stringify(body), signal: AbortSignal.timeout(30000) })).json();
      if (res.error) { if (/비밀번호/.test(res.error)) localStorage.removeItem('revenueKey'); throw new Error(res.error); }
      localStorage.revenueKey = key;
      const rows = res.rows;
      const result = window.RevenueModel.parse(rows, rows);
      if (requestGeneration !== generation) return;
      sourceMode = 'sheet';
      result.updated = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'short', timeStyle: 'medium' }).format(new Date());
      data = result; shownMonth = ''; selectedDay = selectedDay || result.daily.at(-1)?.day; render(); loadMonths();
    } catch (error) {
      if (requestGeneration !== generation) return;
      if (data) { $('rvStatus').textContent = '새로고침 실패 · 이전 확인 내용을 표시 중: ' + error.message; }
      else { sourceMode = ''; renderLocked(error.message); }
    } finally { busy = false; if (button?.isConnected) { button.disabled = false; button.textContent = data ? '새로고침' : '시트에서 불러오기'; } }
  }
  function card(label, value, note) { return `<article class="rv-kpi"><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`; }
  function barList(items, total, money = true) {
    const valid = items.filter(x => x.value != null); const max = Math.max(1, ...valid.map(x => x.value));
    return items.map((x,i) => `<div class="rv-bar-item"><div><span><i style="background:${colors[i % colors.length]}"></i>${esc(x.name)}</span><b>${money ? won(x.value) : fmt(x.value)}</b></div><div class="rv-bar-track"><i style="width:${Math.max(0,Math.min(100,(x.value || 0)/(total > 0 ? total : max)*100))}%;background:${colors[i % colors.length]}"></i></div><small>${total > 0 && x.value != null ? pct(x.value/total) : '—'}${money ? ' · 총금액 대비' : ' · 전체 보고 건수 대비'}</small></div>`).join('');
  }
  function insights() {
    const m = data.metric, days = data.daily.filter(d => d.total != null), peak = days.slice().sort((a,b) => b.total-a.total)[0];
    const top5 = days.slice().sort((a,b) => b.total-a.total).slice(0,5).reduce((s,d) => s+d.total,0);
    const payment = data.payments.filter(x => x.value != null).sort((a,b) => b.value-a.value)[0];
    return `<div class="rv-insight"><span>${data.month}월 확인할 숫자</span><p>${peak ? `<b>${peak.label.replace('-', '/')}</b>에 가장 많은 매출 <b>${won(peak.total)}</b>이 기록됐어요.` : '일별 기록을 확인해 주세요.'}</p><div class="rv-insight-tags"><span>상위 5일 매출 비중 <b>${m.total ? pct(top5/m.total) : '—'}</b></span><span>최대 결제수단 <b>${esc(payment?.name || '—')}</b></span></div></div>`;
  }
  function render() {
    const m = data.metric;
    const failures = Object.values(data.checks).some(x => x !== 0) || m.checkDifference !== 0;
    host.innerHTML = header() + `<div class="rv-meta"><span class="rv-period">${data.year}년 ${data.month}월</span><span id="rvStatus" role="status">${esc(data.updated || '')} 확인 · ${sourceMode ? '실시간 조회' : '파일 기준'} · 원본 월간요약 기준</span><span class="rv-check ${failures ? 'review' : ''}">${failures ? '집계 확인 필요' : '합계 검증 일치'}</span></div>
      <section class="rv-hero"><div><span>${data.month}월 총금액</span><h2 aria-label="${won(m.total)}"><span id="rvTotal">${fmt(m.total)}</span><small>원</small></h2><p>월간 보고 <b>${fmt(m.count)}건</b> · 보고가 기록된 <b>${m.recordedDays}일</b></p></div>${insights()}</section>
      <section class="rv-kpis">${card('보고 1건당 평균',won(m.averageRecord),'총금액 ÷ 보고 건수')}${card('보고 기록일 평균',won(m.averageRecordedDay),'총금액 ÷ 보고가 있는 날짜 수')}${card('해외 매출 비중',pct(m.overseasShare),'국내 외 국가 총금액 ÷ 총금액')}</section>
      <section class="rv-card"><div class="rv-card-head"><div><h2>하루하루 쌓인 매출</h2><p>전체 날짜를 포함한 일별 기록</p></div><div class="rv-segment" role="group" aria-label="매출 추이 보기"><button data-chart="daily" aria-pressed="${chartMode==='daily'}">일별</button><button data-chart="cumulative" aria-pressed="${chartMode==='cumulative'}">누적</button></div></div><div id="rvChart"></div><div id="rvDayDetail" class="rv-day-detail" aria-live="polite"></div><label class="rv-slider-label" for="rvDaySlider">날짜 선택<input id="rvDaySlider" type="range" min="1" max="${Math.max(1,data.daily.length)}" value="${selectedDay || 1}"></label></section>
      ${weekdayAnalysis()}
      <section class="rv-two"><article class="rv-card"><h2>결제수단별 매출</h2><p class="rv-sub">총금액에 포함된 결제 구성</p><div class="rv-payment-layout">${paymentRing()}<div>${barList(data.payments,m.total)}</div></div></article><article class="rv-card"><h2>국가별 매출</h2><p class="rv-sub">국내와 해외의 매출 구성</p>${barList(data.countries,m.total)}</article></section>
      <section class="rv-two"><article class="rv-card"><h2>담당자별 집계</h2><p class="rv-sub">보고 건수와 금액 · 고객 구성에 따라 달라질 수 있어요</p><div class="rv-table"><table><thead><tr><th>담당자</th><th>보고</th><th>총금액</th><th>건당 평균</th></tr></thead><tbody>${data.staff.map(s=>`<tr><th>${esc(s.name)}</th><td>${fmt(s.count)}건</td><td>${won(s.total)}</td><td>${won(s.count && s.total != null ? s.total/s.count : null)}</td></tr>`).join('')}</tbody></table></div></article><article class="rv-card"><h2>주차별 흐름</h2><p class="rv-sub">월요일 시작 · 첫 주와 마지막 주는 날짜 수가 달라요</p>${data.weeks.map(w=>`<div class="rv-week"><span>${esc(w.name)}<small>${w.days}일 · 보고 ${fmt(w.count)}건</small></span><b>${w.valid ? won(w.total) : '계산 확인 필요'}</b></div>`).join('')}</article></section>
      <section class="rv-card"><h2>많이 포함된 시술</h2><p class="rv-sub">한 보고에 여러 시술이 포함될 수 있어 비중 합계가 100%를 넘을 수 있어요. 매출 비중이 아닌 포함 건수입니다.</p><div class="rv-category-grid">${barList(data.categories.map(c=>({name:c.name,value:c.count})).sort((a,b)=>(b.value || 0)-(a.value || 0)),m.count,false)}</div></section>
      <details class="rv-card rv-detail"><summary>집계 기준과 검증 결과 보기</summary><div class="rv-check-list">${[['일별 금액 합계',data.checks.dailyDifference],['보고 건수 합계',data.checks.countDifference],['결제수단 합계',data.checks.paymentDifference],['국가별 금액 합계',data.checks.countryDifference],['담당자 금액 합계',data.checks.staffDifference],['최종 누적 금액',data.checks.cumulativeDifference],['원본 검증차액',m.checkDifference]].map(([n,v])=>`<div><span>${n}</span><b>${v == null ? '확인 불가' : v===0 ? '일치' : '차이 '+fmt(v)}</b></div>`).join('')}</div><p>보고 건수는 고유 고객 수가 아닙니다. 보고 기록일은 보고 건수가 1건 이상인 날짜로 계산하며, 영업일 여부를 판정하지 않습니다. 전월·목표 데이터가 없어 전월 대비와 목표 달성률은 표시하지 않습니다.</p><p>업셀 집계 ${won(m.upsellBasis)}는 원본의 특정 앱결제 제외 기준 집계이며, 추가 발생 매출을 뜻하지 않습니다. 베가스 금액 ${won(m.vegas)}는 별도 원본 항목으로 총금액에 더하지 않습니다.</p><p>원본의 계산 오류나 빈 값은 0으로 바꾸지 않고 확인 필요로 표시합니다.</p></details>`;
    if ($('rvRefresh')) $('rvRefresh').onclick = load;
    $('rvLock').onclick = () => { generation++; sourceMode = ''; renderLocked(); };
    $('rvMonth').onchange = async e => {
      const m = e.target.value; shownMonth = m;
      if (!m) return load();
      try { const r = await archive('get', { month: m }); generation++; sourceMode = ''; data = r.data; selectedDay = data.daily.at(-1)?.day; render(); } catch (err) { $('rvStatus').textContent = err.message; }
    };
    $('rvUpload').onchange = e => { const f = e.target.files[0]; if (f) uploadMonth(f).catch(err => { $('rvStatus').textContent = '파일 분석 실패: ' + err.message; }); e.target.value = ''; };
    host.querySelectorAll('[data-chart]').forEach(button => button.onclick = () => { chartMode = button.dataset.chart; host.querySelectorAll('[data-chart]').forEach(b => b.setAttribute('aria-pressed',b===button)); renderChart(); });
    $('rvDaySlider').oninput = e => { selectedDay = data.daily[+e.target.value-1]?.day; renderDay(); };
    renderChart(); animateTotal();
  }
  function weekdayAnalysis() {
    const groups = Array.from({length:7}, (_,i) => ({name:'월화수목금토일'[i]+'요일', days:0, total:0, count:0}));
    data.daily.forEach(d => { if (!(d.count > 0) || d.total == null) return; const g=groups[(d.weekday+6)%7]; g.days++; g.total+=d.total; g.count+=d.count; });
    const maximum = Math.max(1,...groups.map(g=>g.days ? g.total/g.days : 0));
    return `<section class="rv-card"><div class="rv-card-head"><div><h2>어떤 요일에 매출이 집중될까요?</h2><p>보고가 있는 날짜만 비교한 일평균 · 요일별 기록 횟수를 함께 확인하세요</p></div></div><div class="rv-weekdays">${groups.map(g=>`<article><span>${g.name}</span><div class="rv-weekday-track"><i style="height:${g.days ? Math.max(2,g.total/g.days/maximum*100):0}%"></i></div><b>${g.days ? fmt(g.total/g.days/10000)+'만' : '—'}</b><small>${g.days}일 · ${fmt(g.count)}건</small></article>`).join('')}</div><p class="rv-chart-caption">단위: 만원 · 기록 0일은 비교에서 제외 · 매출 차이는 고객·시술 구성의 영향을 받습니다.</p></section>`;
  }
  function paymentRing() {
    const entries = data.payments.filter(p=>p.value != null && p.value>0); const sum=entries.reduce((s,p)=>s+p.value,0);
    if (!sum || data.payments.some(p=>p.value==null||p.value<0)) return '';
    let cursor=0;const stops=entries.map((p,i)=>{const from=cursor;cursor+=p.value/sum*100;return `${colors[i%colors.length]} ${from}% ${cursor}%`;}).join(',');
    return `<div class="rv-ring" style="background:conic-gradient(${stops})" role="img" aria-label="결제수단별 금액 비중"><div><small>결제 합계</small><b>${(sum/10000).toLocaleString('ko-KR',{maximumFractionDigits:0})}</b><small>만원</small></div></div>`;
  }
  function renderDay() {
    const d=data.daily.find(x=>x.day===+selectedDay)||data.daily.at(-1);if(!d)return;
    selectedDay=d.day;$('rvDayDetail').innerHTML=`<span>${data.month}월 ${d.day}일 <small>${'일월화수목금토'[d.weekday]}요일 · 보고 ${fmt(d.count)}건</small></span><b>${won(chartMode==='daily'?d.total:d.cumulative)}<small>${chartMode==='daily'?'당일 총금액':'월간 누적'}</small></b>`;
    $('rvDaySlider').value=data.daily.indexOf(d)+1;
    host.querySelectorAll('[data-day]').forEach(el=>el.classList.toggle('selected',+el.dataset.day===d.day));
  }
  function renderChart() {
    const days=data.daily,compact=host.clientWidth<600,W=compact?360:900,H=compact?220:250,L=compact?48:64,R=16,B=30,T=14,step=(W-L-R)/Math.max(1,days.length);
    const value=d=>chartMode==='daily'?d.total:d.cumulative;const max=Math.max(1,...days.map(d=>value(d)||0)), y=n=>H-B-(n/max)*(H-T-B);
    let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${data.month}월 ${chartMode==='daily'?'일별':'누적'} 매출 추이"><title>원본 월간요약 매출 · 단위 만원</title>`;
    for(let i=0;i<=4;i++){const n=max*i/4,gy=y(n);svg+=`<line x1="${L}" x2="${W-R}" y1="${gy}" y2="${gy}" stroke="#e5e8eb"/><text x="${L-9}" y="${gy+4}" text-anchor="end">${(n/10000).toLocaleString('ko-KR',{maximumFractionDigits:0})}</text>`;}
    if(chartMode==='cumulative'){
      const points=days.filter(d=>value(d)!=null).map(d=>`${L+(days.indexOf(d)+.5)*step},${y(value(d))}`);
      svg+=`<polyline points="${points.join(' ')}" fill="none" stroke="#3182f6" stroke-width="3"/>`;
    }
    days.forEach((d,i)=>{const n=value(d),x=L+(i+.5)*step;
      svg+=`<g data-day="${d.day}" tabindex="0" role="button" aria-label="${data.month}월 ${d.day}일 ${won(n)}">${chartMode==='daily'?`<rect class="rv-chart-bar" x="${x-step*.32}" y="${y(Math.max(0,n||0))}" width="${step*.64}" height="${n==null?2:Math.max(0,H-B-y(Math.max(0,n||0)))}" rx="4" fill="${n==null?'#e5e8eb':'#80b6ff'}"/>`:`<circle cx="${x}" cy="${y(n||0)}" r="4" fill="#3182f6"/>`}<rect x="${x-step/2}" y="${T}" width="${step}" height="${H-T-B}" fill="transparent"/><title>${d.label}: ${won(n)}</title></g>`;
      if(i%(compact?7:5)===0||i===days.length-1)svg+=`<text x="${x}" y="${H-8}" text-anchor="middle">${d.day}일</text>`;
    });
    $('rvChart').innerHTML=svg+'</svg><p class="rv-chart-caption">단위: 만원 · 막대나 날짜 선택으로 상세 금액을 확인하세요</p>';
    host.querySelectorAll('[data-day]').forEach(el=>{el.onclick=()=>{selectedDay=+el.dataset.day;renderDay();};el.onkeydown=e=>{if(e.sourceMode==='Enter'||e.sourceMode===' '){e.preventDefault();el.onclick();}};});renderDay();
  }
  let resizeFrame;
  addEventListener('resize', () => { cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(() => { if (data && host && !host.closest('.hidden') && $('rvChart')) renderChart(); }); });
  function animateTotal(){
    const target=$('rvTotal'),total=data.metric.total;if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const started=performance.now();function step(now){if(!target.isConnected)return;const t=Math.min(1,(now-started)/550);target.textContent=fmt(total*(1-Math.pow(1-t,3)));if(t<1)requestAnimationFrame(step);}requestAnimationFrame(step);
  }
})();
