(() => {
  const sourceURL = 'https://docs.google.com/spreadsheets/d/1XoxsdvRVo8-L_zSuZp6kWzLdlHLqikXRVhYgnIZmQpw/edit#gid=1411519381';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => n == null ? '—' : Math.round(n).toLocaleString('ko-KR');
  const won = n => n == null ? '—' : fmt(n) + '원';
  const short = n => n == null ? '—' : Math.abs(n) >= 1e8 ? (n / 1e8).toFixed(2) + '억' : Math.round(n / 1e4).toLocaleString('ko-KR') + '만'; // 타일용 짧은 금액
  const pct = n => n == null ? '—' : (n * 100).toFixed(1) + '%';
  const colors = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#6250d6']; // 검증된 범주 팔레트(고정 순서). 대비 3:1 미만 색은 항상 값 라벨과 함께
  let generation = 0;
  let host, data, sourceMode = '', busy = false, chartMode = 'daily', selectedDay;
  const $ = id => document.getElementById(id);
  // 오른쪽 위: 볼 달 선택만 보이고 나머지는 ☰ 메뉴 안으로 (원본 링크는 메뉴 맨 아래)
  const header = () => `<div class="rv-heading"><div><h1>월간 매출표</h1></div><div class="rv-actions">${data ? `<select id="rvMonth" aria-label="볼 달 선택"><option value="">이번 달 (실시간)</option>${months.map(m => `<option value="${m}"${m === shownMonth ? ' selected' : ''}>${+m.slice(0, 4)}년 ${+m.slice(5)}월 (보관)</option>`).join('')}</select>` : ''}<div class="rv-menu-wrap"><button type="button" class="icon-btn rv-menu-btn" aria-haspopup="menu" aria-expanded="false" aria-label="매출표 메뉴">☰</button><div class="rv-menu" role="menu" hidden>${data ? `<label class="rv-upload" role="menuitem" title="일일마감 엑셀(통합데이터 탭) 또는 월간요약 파일">파일로 달 추가<input type="file" id="rvUpload" accept=".xlsx,.xls,.csv" hidden></label>` + (sourceMode ? '<button id="rvRefresh" role="menuitem">새로고침</button>' : '') + '<button id="rvLock" role="menuitem">닫기 (잠금)</button>' : ''}<a href="${sourceURL}" target="_blank" rel="noopener" role="menuitem" class="tool-quiet">원본 요약 시트 ↗</a></div></div></div></div>`;
  let months = [], shownMonth = '';
  // 보관함: 달별 분석 결과를 원본 매출 시트의 '_분석보관' 탭에 저장(매출 비밀번호 필요)
  const archive = async (op, extra = {}) => {
    const res = await (await fetch(window.CONFIG.API_URL, { method: 'POST', body: JSON.stringify({ code: localStorage.accessCode || '', action: 'revenueArchive', op, revenueKey: savedKey(), ...extra }) })).json();
    if (res.error) throw new Error(res.error); return res;
  };
  const loadMonths = () => archive('list').then(r => { months = r.months || []; if (data) render(); }).catch(() => {});
  // 엑셀(.xlsx)은 필요할 때만 SheetJS 를 불러 읽는다
  const loadXLSX = () => window.XLSX ? Promise.resolve(window.XLSX) : new Promise((ok, no) => { const sc = document.createElement('script'); sc.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'; sc.onload = () => ok(window.XLSX); sc.onerror = () => no(new Error('엑셀 읽기 도구를 불러오지 못했습니다')); document.head.append(sc); });
  // 일일마감 파일(통합데이터 탭) 우선, 없으면 월간요약
  async function fileParse(file) {
    if (/\.csv$/i.test(file.name)) { const rows = window.RevenueModel.csv(await file.text()); return window.RevenueModel.parse(rows, rows); }
    if (file.size > 15 * 1024 * 1024) throw new Error('파일이 너무 큽니다 (15MB 이하).');
    const X = await loadXLSX(), wb = X.read(await file.arrayBuffer(), { type: 'array' });
    if (wb.Sheets['통합데이터']) return window.RevenueModel.integrated(X.utils.sheet_to_json(wb.Sheets['통합데이터'], { header: 1, raw: false, defval: '' }));
    const rows = await fileRows(file, X, wb); return window.RevenueModel.parse(rows, rows);
  }
  async function fileRows(file, X0, wb0) {
    if (file.size > 15 * 1024 * 1024) throw new Error('파일이 너무 큽니다 (15MB 이하).');
    if (/\.csv$/i.test(file.name)) return window.RevenueModel.csv(await file.text());
    const X = X0 || await loadXLSX(), wb = wb0 || X.read(await file.arrayBuffer(), { type: 'array' });
    const rowsOf = n => X.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: false, defval: '' });
    const name = wb.SheetNames.find(n => n === '월간요약') || wb.SheetNames.find(n => { const r = rowsOf(n); return /\d{4}년\s*\d{1,2}월/.test(r[0]?.[0] || '') && r[5]?.[0] === '날짜'; });
    if (!name) throw new Error("파일에서 '월간요약' 탭을 찾지 못했습니다.");
    return rowsOf(name);
  }
  async function uploadMonth(file) {
    const st = $('rvStatus'); if (st) st.textContent = '파일 분석 중…';
    const parsed = await fileParse(file), month = `${parsed.year}-${String(parsed.month).padStart(2, '0')}`;
    parsed.updated = file.name;
    let adminKey = ''; try { adminKey = localStorage.revenueAdminKey || ''; } catch {}
    if (!adminKey) adminKey = (prompt('매출 파일 업로드 토큰을 입력해 주세요 (관리자에게 받은 값)') || '').trim();
    if (!adminKey) throw new Error('업로드 토큰이 필요합니다');
    try { await archive('save', { month, data: parsed, adminKey }); } catch (e) { if (/토큰/.test(e.message)) try { localStorage.removeItem('revenueAdminKey'); } catch {} throw e; }
    try { localStorage.revenueAdminKey = adminKey; } catch {}
    generation++; sourceMode = ''; data = parsed; shownMonth = month; selectedDay = parsed.daily.at(-1)?.day; await loadMonths(); render();
  }
  document.addEventListener('click', e => { // 매출표 ☰ 메뉴 열고 닫기
    const btn = e.target.closest('.rv-menu-btn'), menu = document.querySelector('.rv-menu'); if (!menu) return;
    if (btn) { const open = menu.hidden; menu.hidden = !open; btn.setAttribute('aria-expanded', open); return; }
    if (!e.target.closest('.rv-menu') || e.target.closest('button,a')) { menu.hidden = true; document.querySelector('.rv-menu-btn')?.setAttribute('aria-expanded', 'false'); }
  });
  window.RevenueHub = { open() { host = $('revenueHub'); if (!host.innerHTML) { renderLocked(); if (savedKey()) load(); } }, refresh() { if (sourceMode) load(); } };
  function renderLocked(message = '') {
    data = null; host.innerHTML = header() + `<section class="rv-unlock"><div class="rv-lock-icon" aria-hidden="true">▤</div><h2>월간 매출 요약</h2><p>연결된 Google 시트의 월간요약을 불러옵니다.</p><form class="rv-pass" id="rvPassForm"><label for="rvPass">매출 비밀번호</label><input type="password" id="rvPass" autocomplete="current-password" required><button class="primary" id="rvConnect">불러오기</button></form><p class="rv-message" id="rvMessage" role="status">${esc(message)}</p><details class="rv-import"><summary>월간요약 CSV 파일로 보기</summary><p>원본 월간요약 탭에서 다운로드한 CSV를 이 기기에서 분석합니다.</p><label for="rvFile">월간요약 CSV 선택</label><input id="rvFile" type="file" accept=".xlsx,.xls,.csv"></details></section>`;
    $('rvFile').onchange = async e => {
      const file = e.target.files[0]; if (!file) return;
      try {
        const parsed = await fileParse(file); // .xlsx(일일마감·월간요약)/.csv
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
      result.updated = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'short', timeStyle: 'medium', hourCycle: 'h23' }).format(new Date());
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
    return items.map((x,i) => `<div class="rv-bar-item"><div><span><i style="background:${colors[i % colors.length]}"></i>${esc(x.name)}</span><b>${money ? won(x.value) : fmt(x.value)}</b></div><div class="rv-bar-track"><i style="width:${Math.max(0,Math.min(100,(x.value || 0)/(total > 0 ? total : max)*100))}%;background:${colors[i % colors.length]}"></i></div>${total > 0 && x.value != null ? `<small>${pct(x.value/total)}</small>` : ''}</div>`).join('');
  }
  function insights() {
    const m = data.metric, days = data.daily.filter(d => d.total != null), peak = days.slice().sort((a,b) => b.total-a.total)[0];
    const top5 = days.slice().sort((a,b) => b.total-a.total).slice(0,5).reduce((s,d) => s+d.total,0);
    const payment = data.payments.filter(x => x.value != null).sort((a,b) => b.value-a.value)[0];
    return `<div class="rv-insight"><span>${data.month}월 확인할 숫자</span><p>${peak ? `<b>${peak.label.replace('-', '/')}</b>에 가장 많은 매출 <b>${won(peak.total)}</b>이 기록됐어요.` : '일별 기록을 확인해 주세요.'}</p><div class="rv-insight-tags"><span>상위 5일 매출 비중 <b>${m.total ? pct(top5/m.total) : '—'}</b></span><span>최대 결제수단 <b>${esc(payment?.name || '—')}</b></span></div></div>`;
  }
  const hist = {}; // 달별 보관 데이터 캐시 (통합 분석용)
  const exGet = () => { try { return new Set(JSON.parse(localStorage.rvExclude || '[]')); } catch { return new Set(); } };
  const exSet = set => { try { localStorage.rvExclude = JSON.stringify([...set]); } catch {} };
  function procList(cats) { // 제외하지 않은 시술 TOP 10: 포함 건수 막대 + 포함된 보고의 매출
    const ex = exGet(), list = cats.filter(c => !ex.has(c.name)).slice(0, 10), max = Math.max(1, ...list.map(c => c.count || 0));
    return list.map((c, i) => `<div class="rv-bar-item"><div><span><i style="background:${colors[i % colors.length]}"></i>${esc(c.name)}</span><b>${fmt(c.count)}건</b></div><div class="rv-bar-track"><i style="width:${(c.count || 0) / max * 100}%;background:${colors[i % colors.length]}"></i></div>${c.revenue != null ? `<small>포함 보고 매출 ${short(c.revenue)}원 · 해외 ${fmt(c.overseas || 0)}건</small>` : ''}</div>`).join('') || '<p class="rv-sub">모든 시술을 제외했어요. 필터에서 다시 켜 주세요.</p>';
  }
  function openProcFilter(btn, cats) {
    document.querySelector('.rv-filter-pop')?.remove();
    const ex = exGet(), pop = document.createElement('div'); pop.className = 'rv-filter-pop'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', '시술 필터');
    pop.innerHTML = `<div class="rv-fp-head"><b>대시보드에서 뺄 시술</b><button type="button" data-fp="reset">모두 보기</button></div><div class="rv-fp-list">${cats.map(c => `<label><input type="checkbox" value="${esc(c.name)}"${ex.has(c.name) ? ' checked' : ''}><span>${esc(c.name)}</span><small>${fmt(c.count)}</small></label>`).join('')}</div><button type="button" class="primary" data-fp="close">완료</button>`;
    btn.after(pop);
    const apply = () => { const set = new Set([...pop.querySelectorAll('input:checked')].map(i => i.value)); exSet(set); $('rvProcs').innerHTML = procList(cats); btn.querySelector('b').textContent = set.size ? set.size + '개 제외' : '전체'; $('rvInsights').innerHTML = insightList(...insightArgs()); };
    pop.onchange = apply;
    pop.onclick = e => { const k = e.target.dataset.fp; if (k === 'reset') { pop.querySelectorAll('input').forEach(i => i.checked = false); apply(); } if (k === 'close') pop.remove(); };
    setTimeout(() => addEventListener('pointerdown', function off(e) { if (!pop.contains(e.target) && e.target !== btn) { pop.remove(); removeEventListener('pointerdown', off); } }), 0);
    pop.querySelector('input')?.focus();
  }
  let insightArgs = () => [];
  const spark = (vals, color = colors[0]) => { const v = vals.filter(x => x != null); if (v.length < 2) return ''; const mx = Math.max(...v), mn = Math.min(...v), W = 120, H = 28;
    const pts = vals.map((x, i) => x == null ? null : `${(i / (vals.length - 1) * W).toFixed(1)},${(H - 2 - (x - mn) / ((mx - mn) || 1) * (H - 4)).toFixed(1)}`).filter(Boolean).join(' ');
    return `<svg class="rv-spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><polyline class="rv-draw" pathLength="1" points="${pts}" fill="none" stroke="${color}" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>`; };
  const delta = (cur, prev) => cur == null || !prev ? '' : `<em class="rv-delta ${cur >= prev ? 'up' : 'down'}">${cur >= prev ? '▲' : '▼'} ${Math.abs((cur / prev - 1) * 100).toFixed(1)}%</em>`;
  const prevMonth = () => { const d = new Date(Date.UTC(data.year, data.month - 2, 1)); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`; };
  function kpi(label, value, note, sp, dl = '') { return `<article class="rv-tile"><div class="rv-tile-top"><span>${label}</span>${dl}</div><strong>${value}</strong>${sp || ''}<small>${note}</small></article>`; }
  // 진행 중인 달(마지막 기록일이 말일보다 3일 이상 앞): 합계 대신 기록일 평균으로 전월과 비교
  const partial = () => { const last = Math.max(0, ...data.daily.filter(d => d.count > 0).map(d => d.day)); return last && last < data.daily.length - 2; };
  function tilesHTML(top, top5, abroad) {
    const m = data.metric, P = hist[prevMonth()]?.metric, days = data.daily, part = partial();
    const cum = days.map(d => d.cumulative), dayTot = days.map(d => d.total), dayCnt = days.map(d => d.count), avgPer = days.map(d => d.count ? d.total / d.count : null);
    const dTot = part ? delta(m.averageRecordedDay, P?.averageRecordedDay) : delta(m.total, P?.total), dCnt = part ? delta(m.count / (m.recordedDays || 1), P && P.count / (P.recordedDays || 1)) : delta(m.count, P?.count);
    return `<section class="rv-tiles">
        ${kpi('총매출', short(m.total) + '원', `보고 ${fmt(m.count)}건 · ${m.recordedDays}일 기록${part ? ' · 진행 중(일평균 비교)' : ''}`, spark(cum), dTot)}
        ${kpi('보고 건수', fmt(m.count) + '건', '월간 누적', spark(dayCnt, colors[2]), dCnt)}
        ${kpi('객단가', short(m.averageRecord) + '원', '총매출 ÷ 보고 건수', spark(avgPer, colors[5]), delta(m.averageRecord, P?.averageRecord))}
        ${kpi('기록일 평균', short(m.averageRecordedDay) + '원', '총매출 ÷ 기록일', spark(dayTot, colors[1]), delta(m.averageRecordedDay, P?.averageRecordedDay))}
        ${kpi('해외 매출 비중', pct(m.overseasShare), abroad.length ? `해외 ${abroad.length}개국` : '국가별 합계 기준', '', P?.overseasShare != null && m.overseasShare != null ? `<em class="rv-delta ${m.overseasShare >= P.overseasShare ? 'up' : 'down'}">${((m.overseasShare - P.overseasShare) * 100).toFixed(1)}%p</em>` : '')}
        ${kpi('상위 5일 집중도', pct(m.total ? top5 / m.total : null), top[0] ? `최고 ${top[0].label.replace('-', '/')} ${won(top[0].total)}` : '', '')}
      </section>`;
  }
  function render() {
    const m = data.metric, P = hist[prevMonth()]?.metric, days = data.daily;
    const failures = Object.values(data.checks).some(x => x !== 0) || m.checkDifference !== 0;
    /* 스파크라인 데이터는 tilesHTML 에서 */
    const top = days.filter(d => d.total != null).sort((a, b) => b.total - a.total), top5 = top.slice(0, 5).reduce((s, d) => s + d.total, 0);
    const cats = data.categories.slice().sort((a, b) => (b.count || 0) - (a.count || 0)), totalCases = cats.reduce((s, c) => s + (c.count || 0), 0), exN = exGet().size;
    const pay = data.payments.filter(x => x.value != null).sort((a, b) => b.value - a.value);
    const dom = data.countries.find(c => c.name === '국내')?.value, abroad = data.countries.filter(c => c.name !== '국내' && c.value);
    host.innerHTML = header() + `<div class="rv-meta"><span class="rv-period">${data.year}년 ${data.month}월</span><span id="rvStatus" role="status">${esc(data.updated || '')} · ${sourceMode ? '실시간 조회' : '파일 기준'}</span><span class="rv-check ${failures ? 'review' : ''}">${failures ? '집계 확인 필요' : '합계 검증 일치'}</span></div>
      ${tilesHTML(top, top5, abroad)}
      <section class="rv-grid">
        <article class="rv-card rv-span8"><div class="rv-card-head"><div><h2>일별 매출</h2><p>막대를 누르면 그날 금액</p></div><div class="rv-segment" role="group" aria-label="매출 추이 보기"><button data-chart="daily" aria-pressed="${chartMode === 'daily'}">일별</button><button data-chart="cumulative" aria-pressed="${chartMode === 'cumulative'}">누적</button></div></div><div id="rvChart"></div><div id="rvDayDetail" class="rv-day-detail" aria-live="polite"></div><label class="rv-slider-label" for="rvDaySlider">날짜 선택<input id="rvDaySlider" type="range" min="1" max="${Math.max(1, days.length)}" value="${selectedDay || 1}"></label></article>
        <article class="rv-card rv-span4"><h2>결제수단 구성</h2><div class="rv-payment-layout">${paymentRing()}<div>${barList(data.payments, m.total)}</div></div></article>
        ${weekdayAnalysis()}
        <article class="rv-card rv-span4"><h2>주차별 매출</h2><div>${barList(data.weeks.map(w => ({ name: `${w.name} (${w.days}일)`, value: w.valid ? w.total : null })), 0)}</div></article>
        <article class="rv-card rv-span4"><h2>국가별 매출</h2><div>${barList(data.countries, m.total)}</div></article>
        <article class="rv-card rv-span6"><div class="rv-card-head"><div><h2>시술 TOP 10</h2><p>포함 건수 기준 · 의미 없는 시술은 필터로 빼세요</p></div><div class="rv-filter-wrap"><button type="button" class="rv-filter-btn" id="rvProcFilter" aria-haspopup="dialog">필터 <b>${exN ? exN + '개 제외' : '전체'}</b></button></div></div><div class="rv-cols2" id="rvProcs">${procList(cats)}</div></article>
        <article class="rv-card rv-span6"><h2>담당자별</h2><div class="rv-table"><table><thead><tr><th>담당자</th><th>보고</th><th>총금액</th><th>건당</th><th>비중</th></tr></thead><tbody>${data.staff.map(s => `<tr><td>${esc(s.name)}</td><td>${fmt(s.count)}</td><td>${won(s.total)}</td><td>${won(s.count ? s.total / s.count : null)}</td><td>${pct(m.total && s.total != null ? s.total / m.total : null)}</td></tr>`).join('')}</tbody></table></div></article>
        ${data.channels ? `<article class="rv-card rv-span6"><h2>유입 경로별 매출</h2><p class="rv-sub">경로별 매출 · 건수 · 객단가</p><div class="rv-table"><table><thead><tr><th>경로</th><th>건수</th><th>매출</th><th>객단가</th><th>비중</th></tr></thead><tbody>${data.channels.slice(0, 10).map(c => `<tr><td>${esc(c.name)}</td><td>${fmt(c.count)}</td><td>${short(c.total)}원</td><td>${short(c.count ? c.total / c.count : null)}원</td><td>${pct(m.total ? c.total / m.total : null)}</td></tr>`).join('')}</tbody></table></div></article>
        <article class="rv-card rv-span6"><h2>초진 · 재진</h2><p class="rv-sub">신규 유입과 재방문의 매출 구조</p><div class="rv-visits">${data.visits.map((v, i) => `<div><span><i style="background:${colors[i]}"></i>${esc(v.name)}</span><strong>${pct(m.count ? v.count / m.count : null)}</strong><small>${fmt(v.count)}건 · 매출 ${short(v.total)}원 · 객단가 ${short(v.count ? v.total / v.count : null)}원</small></div>`).join('')}</div><div class="rv-stack" role="img" aria-label="초진 재진 매출 비중">${data.visits.map((v, i) => `<i style="flex:${v.total};background:${colors[i]}"></i>`).join('')}</div></article>` : ''}
        <article class="rv-card rv-span12" id="rvTrend"><h2>월별 통합 추이</h2><p class="rv-sub">보관된 달을 모아 비교합니다 · 불러오는 중…</p></article>
        <article class="rv-card rv-span12 rv-insights"><h2>운영 · 마케팅 인사이트</h2><ul id="rvInsights">${insightList(...(insightArgs = () => [top, top5, cats.filter(c => !exGet().has(c.name)), totalCases, pay, dom])())}</ul></article>
        <details class="rv-card rv-span12 rv-detail"><summary>집계 기준과 검증 결과 보기</summary><div class="rv-check-list">${[['일별 금액 합계', data.checks.dailyDifference], ['보고 건수 합계', data.checks.countDifference], ['결제수단 합계', data.checks.paymentDifference], ['국가별 금액 합계', data.checks.countryDifference], ['담당자 합계', data.checks.staffDifference], ['누적 금액', data.checks.cumulativeDifference]].map(([k, v]) => `<div><span>${k}</span><b class="${v === 0 ? 'ok' : 'review'}">${v === 0 ? '일치' : v == null ? '확인 불가' : '차이 ' + won(v)}</b></div>`).join('')}</div></details>
      </section>`;
    if ($('rvRefresh')) $('rvRefresh').onclick = load;
    $('rvLock').onclick = () => { generation++; sourceMode = ''; renderLocked(); };
    $('rvMonth').onchange = async e => {
      const mo = e.target.value; shownMonth = mo;
      if (!mo) return load();
      try { const r = hist[mo] || (await archive('get', { month: mo })).data; hist[mo] = r; generation++; sourceMode = ''; data = r; selectedDay = data.daily.at(-1)?.day; render(); } catch (err) { $('rvStatus').textContent = err.message; }
    };
    $('rvUpload').onchange = e => { const f = e.target.files[0]; if (f) uploadMonth(f).catch(err => { $('rvStatus').textContent = '파일 분석 실패: ' + err.message; }); e.target.value = ''; };
    host.querySelectorAll('[data-chart]').forEach(button => button.onclick = () => { chartMode = button.dataset.chart; host.querySelectorAll('[data-chart]').forEach(b => b.setAttribute('aria-pressed', b === button)); renderChart(); });
    $('rvDaySlider').oninput = e => { selectedDay = data.daily[+e.target.value - 1]?.day; renderDay(); };
    $('rvProcFilter').onclick = e => openProcFilter(e.currentTarget, cats);
    renderChart(); loadTrend();
  }
  function insightList(top, top5, cats, totalCases, pay, dom) {
    const m = data.metric, out = [], P = hist[prevMonth()]?.metric;
    const wd = Array.from({ length: 7 }, () => ({ t: 0, n: 0 })); data.daily.forEach(d => { if (d.count > 0 && d.total != null) { wd[d.weekday].t += d.total; wd[d.weekday].n++; } });
    const avgs = wd.map((w, i) => ({ i, a: w.n ? w.t / w.n : 0 })).filter(x => x.a), best = avgs.slice().sort((a, b) => b.a - a.a)[0], worst = avgs.slice().sort((a, b) => a.a - b.a)[0];
    if (P?.total && partial()) out.push(`진행 중인 달이라 <b>기록일 평균</b>으로 비교하면 전월 대비 <b>${m.averageRecordedDay >= P.averageRecordedDay ? '+' : ''}${((m.averageRecordedDay / P.averageRecordedDay - 1) * 100).toFixed(1)}%</b>, 객단가 <b>${m.averageRecord >= P.averageRecord ? '+' : ''}${((m.averageRecord / P.averageRecord - 1) * 100).toFixed(1)}%</b>예요.`);
    else if (P?.total) out.push(`전월 대비 총매출 <b>${m.total >= P.total ? '+' : ''}${((m.total / P.total - 1) * 100).toFixed(1)}%</b>, 객단가 <b>${m.averageRecord >= P.averageRecord ? '+' : ''}${((m.averageRecord / P.averageRecord - 1) * 100).toFixed(1)}%</b> — ${m.count >= P.count ? '방문(보고) 건수' : '객단가'} 쪽이 성장을 이끌었어요.`);
    if (best && worst && best.i !== worst.i) out.push(`<b>${'일월화수목금토'[best.i]}요일</b> 일평균 매출이 가장 높고(${won(best.a)}), <b>${'일월화수목금토'[worst.i]}요일</b>이 가장 낮아요(${won(worst.a)}). 약한 요일에 이벤트·리마인드 발송을 배치해 보세요.`);
    if (m.total) out.push(`상위 5일이 매출의 <b>${pct(top5 / m.total)}</b>를 차지해요. ${top5 / m.total > .4 ? '특정 날 쏠림이 커서 예약 분산이 필요해요.' : '매출이 고르게 분포돼 있어요.'}`);
    if (cats[0]) out.push(`가장 많이 포함된 시술은 <b>${esc(cats[0].name)}</b>(${fmt(cats[0].count)}건${totalCases ? `, 시술 언급의 ${pct(cats[0].count / totalCases)}` : ''})${cats[1] ? `, 다음은 <b>${esc(cats[1].name)}</b>` : ''}. 콘텐츠 주제 우선순위에 반영하세요.`);
    const ov = cats.filter(c => c.overseas > 0).sort((a, b) => b.overseas - a.overseas)[0];
    if (ov) out.push(`해외 고객이 가장 많이 받은 시술은 <b>${esc(ov.name)}</b>(${fmt(ov.overseas)}건) — 글로벌 계정 콘텐츠 소재로 활용할 만해요.`);
    if (pay[0] && m.total) out.push(`결제는 <b>${esc(pay[0].name)}</b> 비중이 ${pct(pay[0].value / m.total)}로 가장 커요.${data.payments.find(p => /강남언니|바비톡/.test(p.name))?.value ? ` 플랫폼(강남언니/바비톡) 경유 매출은 ${pct(data.payments.find(p => /강남언니|바비톡/.test(p.name)).value / m.total)}예요.` : ''}`);
    if (data.channels?.length) { const ch = data.channels.filter(c => c.name !== '재진' && c.name !== '미상'), best = ch.slice().sort((a, b) => b.total / b.count - a.total / a.count)[0]; if (ch[0]) out.push(`신규 유입 경로 1위는 <b>${esc(ch[0].name)}</b>(${fmt(ch[0].count)}건, ${short(ch[0].total)}원)${best && best !== ch[0] ? `, 객단가는 <b>${esc(best.name)}</b>가 ${short(best.total / best.count)}원으로 가장 높아요. 광고비 배분 때 함께 보세요.` : '.'}`); }
    if (data.visits?.length) { const f = data.visits.find(v => v.name === '초진'), r = data.visits.find(v => v.name === '재진'); if (f && r) out.push(`초진 객단가 <b>${short(f.total / f.count)}원</b> vs 재진 <b>${short(r.total / r.count)}원</b>. 재진 매출 비중 ${pct(r.total / m.total)} — ${r.total > f.total ? '재방문 관리(리마인드·패키지)가 매출의 중심이에요.' : '신규 유입 의존도가 높아 재방문 전환 장치가 필요해요.'}`); }
    if (m.vegas) out.push(`VEGAS 매출 <b>${won(m.vegas)}</b> (총매출의 ${pct(m.vegas / m.total)}).`);
    return out.map(t => `<li>${t}</li>`).join('') || '<li>분석할 데이터가 부족합니다.</li>';
  }
  async function loadTrend() {
    const box = $('rvTrend'), gen = generation; if (!box) return;
    const cur = `${data.year}-${String(data.month).padStart(2, '0')}`; hist[cur] = hist[cur] || data;
    for (const mo of months.slice(-12)) if (!hist[mo]) { try { hist[mo] = (await archive('get', { month: mo })).data; } catch {} if (gen !== generation) return; }
    const list = Object.keys(hist).sort().slice(-12).map(k => ({ k, m: hist[k].metric }));
    if (!$('rvTrend')) return;
    if (list.length < 2) { $('rvTrend').innerHTML = '<h2>월별 통합 추이</h2><p class="rv-sub">비교하려면 지난달 파일을 "파일로 달 추가"로 올려 주세요. 두 달 이상 쌓이면 추이가 나타납니다.</p>'; return; }
    const W = 900, H = 200, L = 56, B = 26, T = 26, step = (W - L - 12) / list.length, max = Math.max(...list.map(x => x.m.total || 0)), y = n => H - B - n / max * (H - T - B);
    let svg = `<svg class="rv-trend-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="월별 총매출 추이">`;
    for (let i = 0; i <= 3; i++) { const n = max * i / 3; svg += `<line x1="${L}" x2="${W - 12}" y1="${y(n)}" y2="${y(n)}" stroke="#e5e8eb"/><text x="${L - 8}" y="${y(n) + 4}" text-anchor="end">${Math.round(n / 1e6)}백만</text>`; }
    list.forEach((x, i) => { const cx = L + (i + .5) * step, bw = Math.min(44, step * .5), v = x.m.total || 0;
      svg += `<g><title>${x.k} 총매출 ${won(v)} · ${fmt(x.m.count)}건 · 객단가 ${won(x.m.averageRecord)}</title><rect class="rv-grow-bar" x="${cx - bw / 2}" y="${y(v)}" width="${bw}" height="${H - B - y(v)}" rx="4" fill="${x.k === cur ? colors[0] : '#a9c8f0'}"/><text x="${cx}" y="${y(v) - 6}" text-anchor="middle" class="rv-val">${Math.round(v / 1e6)}</text><text x="${cx}" y="${H - 8}" text-anchor="middle">${+x.k.slice(5)}월</text></g>`; });
    svg += '</svg>';
    const tbl = `<div class="rv-table"><table><thead><tr><th>월</th><th>총매출</th><th>전월비</th><th>건수</th><th>객단가</th><th>해외 비중</th></tr></thead><tbody>${list.map((x, i) => `<tr${x.k === cur ? ' class="cur"' : ''}><td>${+x.k.slice(0, 4)}.${x.k.slice(5)}</td><td>${won(x.m.total)}</td><td>${i ? delta(x.m.total, list[i - 1].m.total) || '—' : '—'}</td><td>${fmt(x.m.count)}</td><td>${won(x.m.averageRecord)}</td><td>${pct(x.m.overseasShare)}</td></tr>`).join('')}</tbody></table></div>`;
    $('rvTrend').innerHTML = `<h2>월별 통합 추이</h2><p class="rv-sub">보관된 ${list.length}개월 · 막대 위 숫자는 백만원 · 진한 막대가 보고 있는 달</p><div class="rv-trend">${svg}${tbl}</div>`;
    if (hist[prevMonth()] && host.querySelector('.rv-tiles')) { const a = insightArgs(); host.querySelector('.rv-tiles').outerHTML = tilesHTML(a[0], a[1], data.countries.filter(c => c.name !== '국내' && c.value)); $('rvInsights').innerHTML = insightList(...a); } // 전월이 늦게 오면 타일·인사이트만 갱신(애니메이션 재시작 방지)
  }
  function weekdayAnalysis() {
    const groups = Array.from({length:7}, (_,i) => ({name:'월화수목금토일'[i]+'요일', days:0, total:0, count:0}));
    data.daily.forEach(d => { if (!(d.count > 0) || d.total == null) return; const g=groups[(d.weekday+6)%7]; g.days++; g.total+=d.total; g.count+=d.count; });
    const maximum = Math.max(1,...groups.map(g=>g.days ? g.total/g.days : 0));
    return `<section class="rv-card rv-span4"><div class="rv-card-head"><div><h2>요일별 일평균</h2><p>보고가 있는 날만 비교</p></div></div><div class="rv-weekdays">${groups.map(g=>`<article><span>${g.name}</span><div class="rv-weekday-track"><i style="height:${g.days ? Math.max(2,g.total/g.days/maximum*100):0}%"></i></div><b>${g.days ? fmt(g.total/g.days/10000)+'만' : '—'}</b><small>${g.days}일 · ${fmt(g.count)}건</small></article>`).join('')}</div><p class="rv-chart-caption">단위: 만원 · 기록 0일은 비교에서 제외 · 매출 차이는 고객·시술 구성의 영향을 받습니다.</p></section>`;
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
    const days=data.daily,compact=host.clientWidth<600,W=compact?360:900,H=compact?190:200,L=compact?48:64,R=16,B=30,T=14,step=(W-L-R)/Math.max(1,days.length);
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
