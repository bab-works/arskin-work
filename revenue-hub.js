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
  const header = () => `<div class="rv-heading"><div><h1>월간 매출표</h1></div><div class="rv-actions">${data ? `<select id="rvMonth" aria-label="볼 달 선택">${months.slice().sort().reverse().map(m => `<option value="${m}"${m === shownMonth ? ' selected' : ''}>${+m.slice(0, 4)}년 ${+m.slice(5)}월</option>`).join('')}<option value=""${!shownMonth ? ' selected' : ''}>구글 시트 연동 (원본)</option></select>` : ''}<div class="rv-menu-wrap"><button type="button" class="icon-btn rv-menu-btn" aria-haspopup="menu" aria-expanded="false" aria-label="매출표 메뉴">☰</button><div class="rv-menu" role="menu" hidden>${data ? `<label class="rv-upload" role="menuitem" title="일일마감 엑셀(통합데이터 탭) 또는 월간요약 파일">파일로 달 추가<input type="file" id="rvUpload" accept=".xlsx,.xls,.csv" hidden></label>` + (sourceMode ? '<button id="rvRefresh" role="menuitem">새로고침</button>' : '') + (files[shownMonth || curKey()] ? `<button id="rvOrig" role="menuitem" title="${esc(files[shownMonth || curKey()])}">⤓ 원본 다운로드 (${+String(shownMonth || curKey()).slice(5)}월)</button>` : '') + '<button id="rvLock" role="menuitem">닫기 (잠금)</button>' : ''}<a href="${sourceURL}" target="_blank" rel="noopener" role="menuitem" class="tool-quiet">원본 요약 시트 ↗</a></div></div></div></div>`;
  let months = [], shownMonth = '';
  const curKey = () => data ? `${data.year}-${String(data.month).padStart(2, '0')}` : '';
  // 보관함: 달별 분석 결과를 원본 매출 시트의 '_분석보관' 탭에 저장(매출 비밀번호 필요)
  const archive = async (op, extra = {}) => {
    const res = await (await fetch(window.CONFIG.API_URL, { method: 'POST', body: JSON.stringify({ code: localStorage.accessCode || '', action: 'revenueArchive', op, revenueKey: savedKey(), ...extra }) })).json();
    if (res.error) throw new Error(res.error); return res;
  };
  let files = {}, savedAt = {}; // 보관된 달의 원본 파일 이름·저장 시각
  const loadMonths = () => archive('list').then(r => { months = r.months || []; files = r.files || {}; savedAt = r.saved || {}; if (data) render(); }).catch(() => {});
  // 엑셀(.xlsx)은 필요할 때만 SheetJS 를 불러 읽는다
  const loadXLSX = () => window.XLSX ? Promise.resolve(window.XLSX) : new Promise((ok, no) => { const sc = document.createElement('script'); sc.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'; sc.onload = () => ok(window.XLSX); sc.onerror = () => no(new Error('엑셀 읽기 도구를 불러오지 못했습니다')); document.head.append(sc); });
  // 일일마감 파일(통합데이터 탭) 우선, 없으면 월간요약
  async function fileParse(file) {
    if (/\.csv$/i.test(file.name)) { const rows = window.RevenueModel.csv(await file.text()); return window.RevenueModel.parse(rows, rows); }
    if (file.size > 15 * 1024 * 1024) throw new Error('파일이 너무 큽니다 (15MB 이하).');
    const X = await loadXLSX(), wb = X.read(await file.arrayBuffer(), { type: 'array' });
    if (wb.Sheets['통합데이터']) return window.RevenueModel.integrated(X.utils.sheet_to_json(wb.Sheets['통합데이터'], { header: 1, raw: false, defval: '' }));
    // 담당자 일일마감 파일: 첫 탭만 본다. 연·월은 파일명(260530_…) → 탭 이름(5월) → 날짜 칸 순서로 찾는다
    const first = X.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: false, defval: '' });
    if (window.RevenueModel.isDaily(first)) {
      const fm = file.name.match(/^(\d{2})(\d{2})(\d{2})/), tm = wb.SheetNames[0].match(/(\d{1,2})\s*월/), dm = first.map(r => String(r[0]).match(/(\d{1,2})\s*월\s*\d{1,2}\s*일/)).find(Boolean);
      const month = fm ? +fm[2] : tm ? +tm[1] : dm ? +dm[1] : 0, year = fm ? 2000 + +fm[1] : new Date().getFullYear();
      if (!month) throw new Error('파일에서 몇 월 마감인지 찾지 못했어요. 파일 이름을 "260530_5월 일일마감"처럼 날짜로 시작하게 해 주세요.');
      return { staffDaily: true, year, month, part: window.RevenueModel.dailyRows(first, month) };
    }
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
  function rvAlert(title, msg) { // 놓치지 않게 화면 가운데 알림
    const d = document.createElement('dialog'); d.className = 'code-dlg'; d.innerHTML = `<h2>${esc(title)}</h2><p style="white-space:pre-line">${esc(msg)}</p><div class="tr-acts"><button type="button" class="primary">확인</button></div>`;
    d.querySelector('button').onclick = () => d.close(); d.onclose = () => d.remove(); document.body.append(d); d.showModal();
  }
  // 업로드 실패 원인 코드: 화면 가운데 알림으로 원인과 고치는 법을 함께 보여 준다
  const RV_CODES = [
    [/RV-06|너무 큽니다/, 'RV-06', '파일이 15MB를 넘어요.', '사진·불필요한 탭을 지우고 다시 저장하거나, 통합데이터 탭만 남긴 사본을 올려 주세요.'],
    [/RV-05|엑셀 읽기|불러오지 못/, 'RV-05', '엑셀을 읽는 도구를 불러오지 못했어요.', '인터넷 연결을 확인하고 새로고침(Ctrl+Shift+R) 뒤 다시 올려 주세요.'],
    [/RV-03|날짜/, 'RV-03', '통합데이터 A열 날짜를 읽지 못했어요.', 'A열이 날짜 형식(예: 2026-11-02, 11/2/26)인지, 다른 달 날짜만 들어 있지 않은지 확인해 주세요.'],
    [/RV-02|YYYY년|열이 없습니다|머리글/, 'RV-02', '통합데이터 탭의 머리글(열 이름)이 예상과 달라요.', "1~5행 안에 '날짜·담당자·초/재진·국적·경로·총금액·베가스 금액·업셀 집계·검증차액·결제수단' 열 이름이 그대로 있어야 해요. 열 이름을 바꿨다면 원래대로 돌려 주세요."],
    [/토큰|권한|unauthorized/i, 'RV-04', '보관(저장) 권한이 없어요.', '관리자에게 받은 업로드 토큰을 다시 입력해 주세요. 화면에는 분석 결과가 보이지만 저장은 안 됐어요.'],
    [/csv|형식|Unsupported|zip|corrupt|End of data|탭을 찾지/i, 'RV-01', '매출 파일로 알아볼 수 없어요.', "「통합데이터」(또는 「월간요약」) 탭이 있는 엑셀인지 확인해 주세요. 탭 이름을 바꿨다면 원래대로 돌리고, 「다른 이름으로 저장 → Excel 통합 문서(.xlsx)」로 저장한 뒤 다시 올려 주세요. 암호가 걸린 파일은 읽을 수 없어요."],
  ];
  function rvFail(title, err) {
    const m = String(err?.message || err || ''), hit = RV_CODES.find(([re]) => re.test(m)) || [null, 'RV-00', '알 수 없는 오류예요.', '파일 이름·탭 이름을 바꾸지 말고 다시 올려 보고, 계속되면 이 화면을 캡처해 「건의 · 제보」로 보내 주세요.'];
    const st = $('rvStatus'); if (st) st.textContent = '';
    rvAlert(`${title} · ${hit[1]}`, `${hit[2]}\n\n해결 방법: ${hit[3]}\n\n자세한 내용: ${m.replace(/^\[RV-\d+\]\s*/, '')}`);
  }
  // 성별 × 유입경로: 통합데이터에 '성별'(남/여) 열이 있을 때 경로마다 남녀 건수·비율·객단가
  function genderCard(d, m) {
    const g = d.gender, avg = x => x.count ? x.total / x.count : null;
    if (!g.has) return `<article class="rv-card rv-span12"><h2>성별 × 유입 경로</h2><p class="rv-sub">이 파일에는 성별 정보가 없어요</p><p class="rv-gender-empty">통합데이터 탭에 <b>성별</b> 열(값: 남 / 여)을 추가하면 경로별 남녀 비율·객단가가 여기에 나타나요. 담당자 원본 시트에 성별 칸을 만들어 통합데이터로 함께 넘기는 방법을 추천해요.</p></article>`;
    const sx = n => g.sexes.find(x => x.name === n) || { count: 0, total: 0 }, M = sx('남'), F = sx('여'), U = sx('미상');
    const rows = g.routes.filter(r => r.male.count + r.female.count).slice(0, 12);
    return `<article class="rv-card rv-span12"><h2>성별 × 유입 경로</h2><p class="rv-sub">남 ${fmt(M.count)}건 · 여 ${fmt(F.count)}건${U.count ? ` · 미상 ${fmt(U.count)}건` : ''} · 여성 비율 ${pct(M.count + F.count ? F.count / (M.count + F.count) : null)}</p>
      <div class="rv-table"><table><thead><tr><th>경로</th><th>남</th><th>여</th><th style="min-width:160px">남 : 여</th><th>남 객단가</th><th>여 객단가</th></tr></thead><tbody>${rows.map(r => { const t = r.male.count + r.female.count;
        return `<tr><td>${esc(r.name)}</td><td>${fmt(r.male.count)}</td><td>${fmt(r.female.count)}</td><td><div class="rv-sexbar" role="img" aria-label="남 ${pct(r.male.count / t)} 여 ${pct(r.female.count / t)}"><i style="flex:${r.male.count};background:${colors[0]}"></i><i style="flex:${r.female.count};background:#e87ba4"></i></div><small>여 ${pct(r.female.count / t)}</small></td><td>${short(avg(r.male))}원</td><td>${short(avg(r.female))}원</td></tr>`; }).join('')}</tbody></table></div></article>`;
  }
  function pickStaff() { // 누구의 일일마감인지 (기기에 마지막 선택 기억)
    return new Promise(res => {
      const last = localStorage.rvStaff || '', opts = ['상담실장', '코디팀장', '데스크'];
      const d = document.createElement('dialog'); d.className = 'ask-dlg';
      d.innerHTML = `<h2>누구의 일일마감인가요?</h2><p>담당자별로 따로 보관하고, 그 달 매출표는 모두를 합쳐서 만들어요.</p><div class="rv-staff-pick">${opts.map(o => `<button type="button" data-s="${o}" class="${o === last ? 'primary' : ''}">${o}</button>`).join('')}</div><input class="rv-staff-other" placeholder="다른 담당자 이름" maxlength="20" value="${opts.includes(last) ? '' : esc(last)}"><div class="ask-acts"><button type="button" data-v="0">취소</button><button type="button" data-v="1" class="primary">확인</button></div>`;
      let v = ''; d.onclick = e => { const b = e.target.closest('[data-s]'); if (b) { v = b.dataset.s; d.close(); return; } const a = e.target.closest('[data-v]'); if (a) { v = a.dataset.v === '1' ? (d.querySelector('.rv-staff-other').value.trim() || last) : ''; d.close(); } };
      d.onclose = () => { d.remove(); if (v) try { localStorage.rvStaff = v; } catch {} res(v); };
      document.body.append(d); d.showModal();
    });
  }
  async function getAdminKey(label) {
    let k = ''; try { k = localStorage.revenueAdminKey || ''; } catch {}
    return k || (prompt(`${label} 보관하려면 업로드 토큰을 입력하세요 (관리자에게 받은 값)`) || '').trim();
  }
  // 원본 엑셀도 함께 보관(모두가 '원본 다운로드'로 받을 수 있게)
  const toB64 = f => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.onerror = no; r.readAsDataURL(f); });
  async function saveOriginal(key, file, adminKey) {
    try { await archive('saveFile', { month: key, name: file.name, mime: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', data: await toB64(file), adminKey }); }
    catch (e) { if ($('rvStatus')) $('rvStatus').textContent = ''; rvAlert('분석은 보관했지만 원본 파일은 보관하지 못했어요', e.message + '\n\n같은 파일을 한 번 더 올리면 원본도 함께 보관돼요.'); }
  }
  async function downloadOriginal(month) {
    const st = $('rvStatus'); if (st) st.textContent = '원본 파일 받는 중…';
    try { const r = await archive('file', { month }), bin = Uint8Array.from(atob(r.data), c => c.charCodeAt(0)), url = URL.createObjectURL(new Blob([bin], { type: r.mime }));
      const a = document.createElement('a'); a.href = url; a.download = r.name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000); if (st) st.textContent = `${r.name} 받았어요`; }
    catch (e) { if (st) st.textContent = ''; rvAlert('원본 파일을 받지 못했어요', e.message); }
  }
  async function uploadMonth(file) {
    const st = $('rvStatus'); if (st) st.textContent = '파일 분석 중…';
    let parsed = await fileParse(file);
    if (parsed.staffDaily) { // 담당자 일일마감 → 담당자별로 보관하고 그 달 전체를 다시 합친다
      const ym = `${parsed.year}-${String(parsed.month).padStart(2, '0')}`, who = await pickStaff(); if (!who) return;
      const adminKey = await getAdminKey(`${parsed.month}월 ${who} 마감을`); if (!adminKey) return rvAlert('업로드 토큰이 필요해요', '토큰은 스크립트 속성 REVENUE_ADMIN_KEYS 에 넣은 값이에요.');
      try { await archive('save', { month: `${ym}#${who}`, data: { rows: parsed.part, file: file.name, at: new Date().toISOString() }, adminKey }); try { localStorage.revenueAdminKey = adminKey; } catch {} saveOriginal(`${ym}#${who}`, file, adminKey); }
      catch (e) { if (/토큰/.test(e.message)) try { localStorage.removeItem('revenueAdminKey'); } catch {} return rvAlert(`${who} 마감 보관에 실패했어요`, e.message); }
      const parts = { [who]: parsed.part };
      try { const l = await archive('list'); for (const k of (l.parts || []).filter(k => k.startsWith(ym + '#') && k !== `${ym}#${who}`)) parts[k.split('#')[1]] = (await archive('get', { month: k })).data.rows || []; } catch {}
      parsed = window.RevenueModel.fromParts(parts, parsed.year, parsed.month); parsed.updated = `${Object.keys(parts).join('·')} 일일마감 합산`;
    }
    const month = `${parsed.year}-${String(parsed.month).padStart(2, '0')}`;
    if (!parsed.updated) parsed.updated = file.name;
    // 먼저 화면에 보여주고(저장 실패해도 볼 수 있게), 그다음 보관 저장
    generation++; sourceMode = ''; data = parsed; shownMonth = month; selectedDay = parsed.daily.at(-1)?.day; hist[month] = parsed; render(); try { localStorage.rvLast = JSON.stringify({ m: month, d: parsed }); } catch {}
    let adminKey = ''; try { adminKey = localStorage.revenueAdminKey || ''; } catch {}
    if (!adminKey) adminKey = (prompt(`${parsed.month}월 매출을 보관하려면 업로드 토큰을 입력하세요 (관리자에게 받은 값)\n취소하면 지금 화면에서만 보입니다.`) || '').trim();
    if (!adminKey) return rvAlert(`${parsed.month}월 매출을 화면에만 띄웠어요`, '업로드 토큰을 넣지 않아 보관하지 않았어요. 새로고침하면 사라집니다. 토큰은 스크립트 속성 REVENUE_ADMIN_KEYS 에 넣은 값이에요.');
    try { await archive('save', { month, data: parsed, adminKey }); try { localStorage.revenueAdminKey = adminKey; } catch {} }
    catch (e) { if (/토큰/.test(e.message)) try { localStorage.removeItem('revenueAdminKey'); } catch {} return rvAlert(`${parsed.month}월 매출 보관에 실패했어요`, e.message + ' · 화면에는 보이지만 새로고침하면 사라집니다.'); }
    await saveOriginal(month, file, adminKey);
    await loadMonths(); if ($('rvStatus')) $('rvStatus').textContent = `${file.name} · ${parsed.month}월 보관 완료`;
  }
  document.addEventListener('click', e => { // 매출표 ☰ 메뉴 열고 닫기
    const btn = e.target.closest('.rv-menu-btn'), menu = document.querySelector('.rv-menu'); if (!menu) return;
    if (btn) { const open = menu.hidden; menu.hidden = !open; btn.setAttribute('aria-expanded', open); return; }
    if (!e.target.closest('.rv-menu') || e.target.closest('button,a')) { menu.hidden = true; document.querySelector('.rv-menu-btn')?.setAttribute('aria-expanded', 'false'); }
  });
  // 가장 최신 보관 달을 바로 보여준다(이 기기에 마지막으로 본 달은 즉시, 서버 목록은 뒤에서 확인)
  async function openNewest() {
    try {
      const l = await archive('list'); months = l.months || []; files = l.files || {}; savedAt = l.saved || {}; const newest = months.slice().sort().pop(); if (!newest) return;
      const cur = data ? `${data.year}-${String(data.month).padStart(2, '0')}` : '';
      if (cur && newest < cur) return;
      // 보관된 달은 모두가 같은 결과를 본다: 기기에 남은 예전 결과가 아니라, 마지막으로 올린 분석을 다시 받아 온다
      if (hist[newest] && hist[newest]._saved === savedAt[newest] && shownMonth === newest) { render(); return; }
      const g = await archive('get', { month: newest }), r = g.data; r._saved = g.saved || savedAt[newest] || ''; hist[newest] = r;
      generation++; sourceMode = ''; data = r; shownMonth = newest; selectedDay = r.daily.at(-1)?.day; render();
      try { localStorage.rvLast = JSON.stringify({ m: newest, d: r }); } catch {}
    } catch {}
  }
  window.RevenueHub = { open() { host = $('revenueHub'); if (!host.innerHTML) { renderLocked(); if (savedKey()) {
    try { const c = JSON.parse(localStorage.rvLast || 'null'); if (c?.d) { data = c.d; shownMonth = c.m; hist[c.m] = c.d; selectedDay = data.daily.at(-1)?.day; render(); } } catch {}
    load(); openNewest(); } } }, refresh() { if (sourceMode) load(); } };
  function renderLocked(message = '') {
    data = null; host.innerHTML = header() + `<section class="rv-unlock"><div class="rv-lock-icon" aria-hidden="true">▤</div><h2>월간 매출 요약</h2><p>연결된 Google 시트의 월간요약을 불러옵니다.</p><form class="rv-pass" id="rvPassForm"><label for="rvPass">매출 비밀번호</label><input type="password" id="rvPass" autocomplete="current-password" required><button class="primary" id="rvConnect">불러오기</button></form><p class="rv-message" id="rvMessage" role="status">${esc(message)}</p><details class="rv-import"><summary>월간요약 CSV 파일로 보기</summary><p>원본 월간요약 탭에서 다운로드한 CSV를 이 기기에서 분석합니다.</p><label for="rvFile">월간요약 CSV 선택</label><input id="rvFile" type="file" accept=".xlsx,.xls,.csv"></details></section>`;
    $('rvFile').onchange = async e => {
      const file = e.target.files[0]; if (!file) return;
      try {
        $('rvMessage').textContent = '파일 분석 중…';
        const parsed = await fileParse(file); // .xlsx(일일마감·월간요약)/.csv
        generation++; sourceMode = ''; data = parsed; data.updated = 'CSV 파일'; selectedDay = null; render();
      } catch (err) { $('rvMessage').textContent = err.message; e.target.value = ''; rvFail(`「${file.name}」을 반영하지 못했어요`, err); }
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
      const liveM = `${result.year}-${String(result.month).padStart(2, '0')}`;
      await loadMonths(); if (requestGeneration !== generation) return;
      if (months.includes(liveM) || (shownMonth && shownMonth > liveM)) { if (!data || !shownMonth) openNewest(); else render(); return; } // 올려 둔(보관된) 달은 시트보다 보관본을 모두에게 보여 줌
      data = result; shownMonth = ''; selectedDay = selectedDay || result.daily.at(-1)?.day; render();
      loadMonths().then(async () => { const live = `${result.year}-${String(result.month).padStart(2, '0')}`, newest = months.slice().sort().pop(); if (newest && newest > live && !shownMonth && requestGeneration === generation) { try { const r = hist[newest] || (await archive('get', { month: newest })).data; hist[newest] = r; generation++; sourceMode = ''; data = r; shownMonth = newest; selectedDay = r.daily.at(-1)?.day; render(); } catch {} } });
    } catch (error) {
      if (requestGeneration !== generation) return;
      if (months.length) { openNewest(); return; } // 시트를 못 읽어도 보관된 달이 있으면 그걸 보여 줌
      if (data) { const st = $('rvStatus'); if (st) st.textContent = '새로고침 실패 · 이전 확인 내용을 표시 중: ' + error.message; }
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
    if (!cats.length) return '<p class="rv-sub">이 파일 형식에는 시술 정보가 없어요. 통합데이터가 있는 마감 파일을 올리면 시술 분석이 나와요.</p>';
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
  // 전월 같은 기간(1~N일) 합계: 진행 중인 달 비교용
  const samePeriod = () => { const N = Math.max(0, ...data.daily.filter(d => d.count > 0).map(d => d.day)), pd = hist[prevMonth()]?.daily; if (!N || !pd) return null;
    const until = pd.filter(d => d.day <= N); if (!until.length || until.some(d => d.total == null)) return null;
    return { N, total: until.reduce((a, d) => a + d.total, 0), count: until.reduce((a, d) => a + (d.count || 0), 0) }; };
  const partial = () => { const last = Math.max(0, ...data.daily.filter(d => d.count > 0).map(d => d.day)); return last && last < data.daily.length - 2; };
  function tilesHTML(top, top5, abroad) {
    const m = data.metric, P = hist[prevMonth()]?.metric, days = data.daily, part = partial();
    const cum = days.map(d => d.cumulative), dayTot = days.map(d => d.total), dayCnt = days.map(d => d.count), avgPer = days.map(d => d.count ? d.total / d.count : null);
    const sp = part ? samePeriod() : null;
    const dTot = sp ? delta(m.total, sp.total) : part ? delta(m.averageRecordedDay, P?.averageRecordedDay) : delta(m.total, P?.total), dCnt = sp ? delta(m.count, sp.count) : part ? delta(m.count / (m.recordedDays || 1), P && P.count / (P.recordedDays || 1)) : delta(m.count, P?.count);
    return `<section class="rv-tiles">
        ${kpi('총매출', short(m.total) + '원', `보고 ${fmt(m.count)}건 · ${m.recordedDays}일 기록${sp ? ` · 전월 1~${sp.N}일 대비` : part ? ' · 진행 중(일평균 비교)' : ''}`, spark(cum), dTot)}
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
        ${data.gender ? genderCard(data, m) : ''}
        <article class="rv-card rv-span12" id="rvTrend"><h2>월별 통합 추이</h2><p class="rv-sub">보관된 달을 모아 비교합니다 · 불러오는 중…</p></article>
        <article class="rv-card rv-span12 rv-insights"><h2>운영 · 마케팅 인사이트</h2><ul id="rvInsights">${insightList(...(insightArgs = () => [top, top5, cats.filter(c => !exGet().has(c.name)), totalCases, pay, dom])())}</ul></article>
        <details class="rv-card rv-span12 rv-detail"><summary>집계 기준과 검증 결과 보기</summary><div class="rv-check-list">${[['일별 금액 합계', data.checks.dailyDifference], ['보고 건수 합계', data.checks.countDifference], ['결제수단 합계', data.checks.paymentDifference], ['국가별 금액 합계', data.checks.countryDifference], ['담당자 합계', data.checks.staffDifference], ['누적 금액', data.checks.cumulativeDifference]].map(([k, v]) => `<div><span>${k}</span><b class="${v === 0 ? 'ok' : 'review'}">${v === 0 ? '일치' : v == null ? '확인 불가' : '차이 ' + won(v)}</b></div>`).join('')}</div></details>
      </section>`;
    if ($('rvRefresh')) $('rvRefresh').onclick = load;
    $('rvLock').onclick = () => { generation++; sourceMode = ''; renderLocked(); };
    $('rvOrig')?.addEventListener('click', () => downloadOriginal(shownMonth || curKey()));
    $('rvMonth').onchange = async e => {
      const mo = e.target.value; shownMonth = mo;
      if (!mo) return load();
      try { const r = hist[mo] || (await archive('get', { month: mo })).data; hist[mo] = r; generation++; sourceMode = ''; data = r; selectedDay = data.daily.at(-1)?.day; render(); } catch (err) { $('rvStatus').textContent = err.message; }
    };
    $('rvUpload').onchange = e => { const f = e.target.files[0]; if (f) uploadMonth(f).catch(err => rvFail(`「${f.name}」을 반영하지 못했어요`, err)); e.target.value = ''; };
    host.querySelectorAll('[data-chart]').forEach(button => button.onclick = () => { chartMode = button.dataset.chart; host.querySelectorAll('[data-chart]').forEach(b => b.setAttribute('aria-pressed', b === button)); renderChart(); });
    $('rvDaySlider').oninput = e => { selectedDay = data.daily[+e.target.value - 1]?.day; renderDay(); };
    $('rvProcFilter').onclick = e => openProcFilter(e.currentTarget, cats);
    renderChart(); loadTrend();
  }
  function insightList(top, top5, cats, totalCases, pay, dom) {
    const m = data.metric, out = [], P = hist[prevMonth()]?.metric;
    const wd = Array.from({ length: 7 }, () => ({ t: 0, n: 0 })); data.daily.forEach(d => { if (d.count > 0 && d.total != null) { wd[d.weekday].t += d.total; wd[d.weekday].n++; } });
    const avgs = wd.map((w, i) => ({ i, a: w.n ? w.t / w.n : 0 })).filter(x => x.a), best = avgs.slice().sort((a, b) => b.a - a.a)[0], worst = avgs.slice().sort((a, b) => a.a - b.a)[0];
    const sp = partial() ? samePeriod() : null;
    if (sp) out.push(`전월 같은 기간(1~${sp.N}일) 매출 <b>${short(sp.total)}원</b> 대비 이번 달 <b>${short(m.total)}원</b> — <b>${m.total >= sp.total ? '+' : ''}${((m.total / sp.total - 1) * 100).toFixed(1)}%</b>, 건수는 ${fmt(sp.count)}건 → ${fmt(m.count)}건이에요.`);
    else if (P?.total && partial()) out.push(`진행 중인 달이라 <b>기록일 평균</b>으로 비교하면 전월 대비 <b>${m.averageRecordedDay >= P.averageRecordedDay ? '+' : ''}${((m.averageRecordedDay / P.averageRecordedDay - 1) * 100).toFixed(1)}%</b>, 객단가 <b>${m.averageRecord >= P.averageRecord ? '+' : ''}${((m.averageRecord / P.averageRecord - 1) * 100).toFixed(1)}%</b>예요.`);
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
