(() => {
  const C = window.CONFIG;
  // 상태 코드는 시트에 그대로 저장한다. 옛 이모지 값도 읽을 수 있게 별칭으로 둔다(보류·반복은 시작 전으로 합침).
  const STAT = { todo: { label: '시작 전' }, doing: { label: '진행 중' }, done: { label: '완료' }, check: { label: '확인 필요' } };
  const STATUS_ALIAS = { '🔷': 'todo', '▶️': 'doing', '⭕': 'done', '?': 'check', '⏸️': 'todo', '🔄': 'todo', hold: 'todo', repeat: 'todo' };
  const statusCode = v => STAT[v] ? v : STATUS_ALIAS[v] || 'todo'; // '' 등 미지정은 시작 전으로 표시
  const nextStatus = c => c === 'todo' ? 'doing' : c === 'doing' ? 'done' : c === 'done' ? 'todo' : 'doing';
  const isDone = r => statusCode(r.status) === 'done';
  // 아이콘: Phosphor Icons (MIT, https://phosphoricons.com)
  const ICONS = {"trash": "<path d=\"M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z\"/>", "drag": "<path d=\"M104,60A12,12,0,1,1,92,48,12,12,0,0,1,104,60Zm60,12a12,12,0,1,0-12-12A12,12,0,0,0,164,72ZM92,116a12,12,0,1,0,12,12A12,12,0,0,0,92,116Zm72,0a12,12,0,1,0,12,12A12,12,0,0,0,164,116ZM92,184a12,12,0,1,0,12,12A12,12,0,0,0,92,184Zm72,0a12,12,0,1,0,12,12A12,12,0,0,0,164,184Z\"/>", "sinkdone": "<path d=\"M50.34,117.66a8,8,0,0,1,11.32-11.32L120,164.69V32a8,8,0,0,1,16,0V164.69l58.34-58.35a8,8,0,0,1,11.32,11.32l-72,72a8,8,0,0,1-11.32,0ZM216,208H40a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Z\"/>", "hide": "<path d=\"M53.92,34.62A8,8,0,1,0,42.08,45.38L61.32,66.55C25,88.84,9.38,123.2,8.69,124.76a8,8,0,0,0,0,6.5c.35.79,8.82,19.57,27.65,38.4C61.43,194.74,93.12,208,128,208a127.11,127.11,0,0,0,52.07-10.83l22,24.21a8,8,0,1,0,11.84-10.76Zm47.33,75.84,41.67,45.85a32,32,0,0,1-41.67-45.85ZM128,192c-30.78,0-57.67-11.19-79.93-33.25A133.16,133.16,0,0,1,25,128c4.69-8.79,19.66-33.39,47.35-49.38l18,19.75a48,48,0,0,0,63.66,70l14.73,16.2A112,112,0,0,1,128,192Zm6-95.43a8,8,0,0,1,3-15.72,48.16,48.16,0,0,1,38.77,42.64,8,8,0,0,1-7.22,8.71,6.39,6.39,0,0,1-.75,0,8,8,0,0,1-8-7.26A32.09,32.09,0,0,0,134,96.57Zm113.28,34.69c-.42.94-10.55,23.37-33.36,43.8a8,8,0,1,1-10.67-11.92A132.77,132.77,0,0,0,231.05,128a133.15,133.15,0,0,0-23.12-30.77C185.67,75.19,158.78,64,128,64a118.37,118.37,0,0,0-19.36,1.57A8,8,0,1,1,106,49.79,134,134,0,0,1,128,48c34.88,0,66.57,13.26,91.66,38.35,18.83,18.83,27.3,37.62,27.65,38.41A8,8,0,0,1,247.31,131.26Z\"/>", "todo": "<path d=\"M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Z\"/>", "doing": "<path d=\"M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24ZM40,128a88.1,88.1,0,0,1,88-88V216A88.1,88.1,0,0,1,40,128Z\"/>", "done": "<path d=\"M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm45.66,85.66-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z\"/>", "check": "<path d=\"M140,180a12,12,0,1,1-12-12A12,12,0,0,1,140,180ZM128,72c-22.06,0-40,16.15-40,36v4a8,8,0,0,0,16,0v-4c0-11,10.77-20,24-20s24,9,24,20-10.77,20-24,20a8,8,0,0,0-8,8v8a8,8,0,0,0,16,0v-.72c18.24-3.35,32-17.9,32-35.28C168,88.15,150.06,72,128,72Zm104,56A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z\"/>", "carry": "<path d=\"M229.66,157.66l-48,48a8,8,0,0,1-11.32-11.32L204.69,160H128A104.11,104.11,0,0,1,24,56a8,8,0,0,1,16,0,88.1,88.1,0,0,0,88,88h76.69l-34.35-34.34a8,8,0,0,1,11.32-11.32l48,48A8,8,0,0,1,229.66,157.66Z\"/>", "sort": "<path d=\"M224,128a8,8,0,0,1-8,8H128a8,8,0,0,1,0-16h88A8,8,0,0,1,224,128ZM128,72h88a8,8,0,0,0,0-16H128a8,8,0,0,0,0,16Zm88,112H128a8,8,0,0,0,0,16h88a8,8,0,0,0,0-16ZM82.34,42.34,56,68.69,45.66,58.34A8,8,0,0,0,34.34,69.66l16,16a8,8,0,0,0,11.32,0l32-32A8,8,0,0,0,82.34,42.34Zm0,64L56,132.69,45.66,122.34a8,8,0,0,0-11.32,11.32l16,16a8,8,0,0,0,11.32,0l32-32a8,8,0,0,0-11.32-11.32Zm0,64L56,196.69,45.66,186.34a8,8,0,0,0-11.32,11.32l16,16a8,8,0,0,0,11.32,0l32-32a8,8,0,0,0-11.32-11.32Z\"/>", "print": "<path d=\"M214.67,72H200V40a8,8,0,0,0-8-8H64a8,8,0,0,0-8,8V72H41.33C27.36,72,16,82.77,16,96v80a8,8,0,0,0,8,8H56v32a8,8,0,0,0,8,8H192a8,8,0,0,0,8-8V184h32a8,8,0,0,0,8-8V96C240,82.77,228.64,72,214.67,72ZM72,48H184V72H72ZM184,208H72V160H184Zm40-40H200V152a8,8,0,0,0-8-8H64a8,8,0,0,0-8,8v16H32V96c0-4.41,4.19-8,9.33-8H214.67c5.14,0,9.33,3.59,9.33,8Zm-24-52a12,12,0,1,1-12-12A12,12,0,0,1,200,116Z\"/>", "reload": "<path d=\"M240,56v48a8,8,0,0,1-8,8H184a8,8,0,0,1,0-16H211.4L184.81,71.64l-.25-.24a80,80,0,1,0-1.67,114.78,8,8,0,0,1,11,11.63A95.44,95.44,0,0,1,128,224h-1.32A96,96,0,1,1,195.75,60L224,85.8V56a8,8,0,1,1,16,0Z\"/>", "x": "<path d=\"M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z\"/>", "more": "<path d=\"M140,128a12,12,0,1,1-12-12A12,12,0,0,1,140,128Zm56-12a12,12,0,1,0,12,12A12,12,0,0,0,196,116ZM60,116a12,12,0,1,0,12,12A12,12,0,0,0,60,116Z\"/>"};
  const icon = (name, size = 20, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 256 256" width="${size}" height="${size}" fill="currentColor" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;
  const statusIcon = c => icon(c, 20, 'sti sti-' + c);
  const TASK_SECTIONS = [ // 예전 L/R 두 칸(진행/완료)은 한 목록으로 합침. 시트의 열 값은 그대로 둔다
    { key: '주간고정', L: '주간고정' },
    { key: '데일리고정', L: '데일리 고정업무' },
    { key: '배치예정', L: '업무 배치 예정' },
    { key: '팔로업', L: '팔로업 리스트' },
    { key: '변동업무', L: '변동업무' },
    { key: '릴스업무', L: '릴스 업무' },
  ];
  const TASK_KEYS = new Set(TASK_SECTIONS.map(s => s.key));
  const mySections = () => TASK_SECTIONS.filter(s => s.key !== '릴스업무' || state.person === (C.REELS_OWNER || state.person)); // 릴스 칸은 릴스 담당자(미스타전)만
  const WD = ['일', '월', '화', '수', '목', '금', '토'];
  const state = { sharedAnchor: null, sharedMode: localStorage.sharedMode === 'month' ? 'month' : 'week', sharedCollapsed: localStorage.sharedCollapsed === '1', shared: [], person: (C.PEOPLE.find(p => p.name === localStorage.person && !p.director) || C.PEOPLE.find(p => p.name === C.DEFAULT_PERSON) || C.PEOPLE[0]).name, rows: [], dates: [], sel: null, view: 'daily', collapse: localStorage.collapse === '1', expanded: new Set(), calendar: null, team: {}, tags: {}, deletedTags: [], leaves: [], leaveMode: '', selected: new Set(), sharedCat: '', sharedTab: (() => { try { return localStorage.sharedTab || '변동'; } catch { return '변동'; } })(), reelPlan: [], dir: { tasks: [], me: '' }, sharedTasksOpen: (() => { try { return localStorage.sharedTasksOpen !== '0'; } catch { return true; } })(), calWho: (() => { try { return localStorage.calWho || ''; } catch { return ''; } })(), doneLast: localStorage.doneSort !== 'keep' };

  /* ---------- utils ---------- */
  const pad = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const shiftDate = (s, n) => { const d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); return iso(d); };
  const fmtDate = s => { const d = new Date(s + 'T00:00:00'); return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()} (${WD[d.getDay()]})`; };
  const todayKst = () => new Date(Date.now() + 9 * 36e5).toISOString().slice(0, 10); // 기기 시간대와 무관하게 한국 날짜
  const DIRECTOR_WHO = '원장님';
  const disp = n => C.PEOPLE.find(p => p.name === n)?.label || n; // 화면 표시 이름
  const isDirector = () => !!C.PEOPLE.find(p => p.name === state.person)?.director;
  const isWorkday = d => { const wd = new Date(d + 'T00:00:00Z').getUTCDay(); return wd !== 0 && (wd !== 6 || isDirector()) && !state.holidays[d]; }; // 마케터 월~금, 원장님 월~토
  function workDates(n) { // 당일 + 이전 근무일(월~금, 공휴일 제외)
    const out = [todayKst()]; let d = out[0];
    while (out.length < n) { d = shiftDate(d, -1); if (isWorkday(d)) out.push(d); }
    return out.reverse();
  }
  const newId = date => `${date.replace(/-/g, '')}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const el = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; };
  const $ = id => document.getElementById(id);
  const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const toTime = m => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
  function toast(msg, action) { // action: { label, ms, run } → 되돌리기 같은 버튼
    const t = $('appToast'); t.textContent = msg; t.classList.remove('hidden'); clearTimeout(toast.t);
    if (action) { const b = el(`<button type="button">${esc(action.label)}</button>`); b.onclick = () => { clearTimeout(toast.t); t.classList.add('hidden'); action.run(); }; t.append(b); }
    toast.t = setTimeout(() => t.classList.add('hidden'), action?.ms || 2500);
  }

  /* ---------- api (Apps Script) ---------- */
  // 접속 코드: 사람별로 1회 입력해 브라우저에 저장. 서버가 거부하면 다시 묻는다.
  const accessCode = () => { try { return localStorage.accessCode || ''; } catch { return ''; } };
  function askCode(message) {
    if (document.getElementById('codeDlg')) return;
    const d = el(`<dialog id="codeDlg" class="code-dlg" aria-labelledby="codeTitle"><form method="dialog"><h2 id="codeTitle">접속 코드</h2><p>${esc(message)}</p><input id="codeInput" type="password" autocomplete="current-password" aria-label="접속 코드" required><button class="primary">확인</button></form></dialog>`);
    document.body.append(d);
    d.querySelector('form').onsubmit = () => { localStorage.accessCode = d.querySelector('#codeInput').value.trim(); location.reload(); };
    d.addEventListener('cancel', e => e.preventDefault()); // 코드 없이 닫지 않음
    d.showModal();
  }
  const checkAuth = j => { if (j.error === 'unauthorized') askCode(accessCode() ? '코드가 맞지 않습니다. 다시 입력해 주세요.' : '팀에서 받은 접속 코드를 입력해 주세요.'); };
  const api = {
    async get(params) {
      const u = new URL(C.API_URL);
      Object.entries({ code: accessCode(), who: state.person, ...params }).forEach(([k, v]) => u.searchParams.set(k, v));
      const j = await (await fetch(u)).json();
      checkAuth(j); if (j.error) throw new Error(j.error);
      return j;
    },
    async post(body) { // text/plain body → CORS preflight 없이 Apps Script 로 전달
      const j = await (await fetch(C.API_URL, { method: 'POST', body: JSON.stringify({ code: accessCode(), who: state.person, ...body }) })).json();
      checkAuth(j); if (j.error) throw new Error(j.error);
      return j;
    },
  };
  const save = (rows, who = state.person) => api.post({ action: 'upsert', rows, who }).catch(e => toast('저장 실패: ' + e.message));
  const removeIds = (ids, who = state.person) => api.post({ action: 'delete', ids, who }).catch(e => toast('삭제 실패: ' + e.message));

  function addRow(o) {
    if (!(o.text || '').trim()) return null;
    const r = { id: newId(o.date), status: '', col: '', text: '', start: '', end: '', ...o };
    (r._who ? state.shared : state.rows).push(r); save([r], r._who); return r; // _who='공통' 이면 공통 시트
  }
  function updateRow(r, patch) { Object.assign(r, patch); save([r], r._who); }
  const deleteRow = r => deleteRows([r]);
  // 화면에서 바로 빼고 5초 뒤 시트에서 지운다(서버가 휴지통에 14일 보관). 되돌리기를 누르면 시트는 건드리지 않는다.
  // shortcut: 5초 안에 창을 닫으면 삭제가 전송되지 않아 항목이 남음(안전한 쪽)
  function deleteRows(list) {
    const related = state.rows.filter(x => ['프로젝트', '하위업무'].includes(x.section) && list.some(r => NESTABLE.has(r.section) && x.col === r.id));
    if (related.some(x => x.section === '하위업무') && !confirm('하위 업무도 함께 삭제할까요?')) return;
    const gone = [...list, ...related], snap = { rows: [...state.rows], shared: [...state.shared] };
    state.rows = state.rows.filter(x => !gone.includes(x)); state.shared = state.shared.filter(x => !gone.includes(x));
    state.selected.clear();
    const timer = setTimeout(() => {
      const mine = gone.filter(x => !x._who), shared = gone.filter(x => x._who);
      if (mine.length) removeIds(mine.map(x => x.date + '|' + x.id));
      if (shared.length) removeIds(shared.map(x => x.date + '|' + x.id), shared[0]._who);
    }, 5000);
    toast(list.length > 1 ? `${list.length}개 삭제했습니다` : '삭제했습니다', { label: '되돌리기', ms: 5000, run: () => {
      clearTimeout(timer);
      state.rows = [...state.rows, ...snap.rows.filter(x => gone.includes(x))]; state.shared = [...state.shared, ...snap.shared.filter(x => gone.includes(x))];
      state.rows.sort((a, b) => snap.rows.indexOf(a) - snap.rows.indexOf(b)); render();
    } });
  }

  const ord = r => Number(r.order) || Infinity; // 순서 없는 행은 기존 순서대로 뒤에
  const rowsFor = (date, section, col) => state.rows.filter(r => r.date === date && r.section === section && (col === undefined || r.col === col)).sort((a, b) => ord(a) - ord(b));
  // 같은 칸에 행이 여러 개면(과거 시트 흔적) 첫 행에 합쳐 저장한다
  function setCellText(date, section, col, text) {
    const rs = rowsFor(date, section, col);
    if (rs[0]) { updateRow(rs[0], { text }); rs.slice(1).forEach(deleteRow); }
    else addRow({ date, section, col, text });
  }
  const cellText = (date, section, col) => rowsFor(date, section, col).map(r => r.text).filter(Boolean).join('\n');

  /* ---------- report ---------- */
  function sec(title, ...nodes) { const s = el(`<section class="sec"><h3>${esc(title)}</h3></section>`); nodes.forEach(n => s.append(n)); return s; }
  function textarea(cls, value, onSave, ph) {
    const t = el(`<textarea class="${cls}" placeholder="${esc(ph || '')}"></textarea>`); t.value = value;
    t.onchange = () => onSave(t.value); autosize(t); t.oninput = () => autosize(t); return t;
  }
  function autosize(t) { t.style.height = 'auto'; t.style.height = (t.scrollHeight + 2) + 'px'; }

  const CAT_RE = /^[^\p{L}(]*?(\p{L}[^\s()]{0,11})\)\s*/u; // '(화)' 같은 날짜 괄호는 태그로 보지 않음 // 앞 장식 기호 + 12자 이내 분류 + ')'
  // 원장님 숙제 한 줄: 상태 · 제목(레퍼런스 링크) · 오른쪽 연회색 'MM/DD 완료'
  function hwRow(r) {
    const plan = String(r.end).startsWith('plan:') ? String(r.end).slice(5) : '', p = state.reelPlan.find(x => String(x.row) === plan);
    const row = el(`<div class="row hw-row${isDone(r) ? ' done' : ''}" data-id="${esc(r.id)}"></div>`);
    row.append(dragHandle(r), statusButton(r, code => { const was = isDone(r); setStatus(r, code); if (plan && was !== (code === 'done')) homeworkShot({ row: plan, title: r.text, ref: p?.ref || '' }, code === 'done'); }));
    if (plan) { const a = el('<a class="tx hw-link" target="_blank" rel="noopener" title="레퍼런스 열기"></a>'); a.textContent = r.text; a.href = planLink(plan, p?.ref); row.append(a); }
    else { const tx = el('<div class="tx" contenteditable="plaintext-only"></div>'); tx.textContent = r.text; tx.onblur = () => { const v = tx.textContent.trim(); if (v && v !== r.text) updateRow(r, { text: v }); }; row.append(tx); }
    if (isDone(r)) row.append(el(`<small class="hw-done">${(r.completed || r.date).slice(5).replace('-', '/')} 완료</small>`));
    const del = el(`<button class="del" title="삭제" aria-label="삭제">${icon('x', 14)}</button>`); del.onclick = () => { deleteRow(r); render(); }; row.append(del);
    return row;
  }
  function itemRow(r, opts = {}) {
    if (NESTABLE.has(r.section) && isProject(r)) return projectCard(r);
    if (r.section === '릴스업무' && String(r.col).startsWith('plan:')) return reelRow(r);
    if (r.section === '원장님숙제') return hwRow(r);
    const row = el(`<div class="row${isDone(r) ? ' done' : ''}" data-id="${esc(r.id)}"></div>`);
    if (TASK_KEYS.has(r.section) || r.section === '원장님리스트' || r.section === '원장님숙제') row.append(dragHandle(r));
    if (!opts.noStatus) row.append(statusButton(r, code => setStatus(r, code)));
    // '분류) 내용' 은 칩으로 보여주기만 하고, 편집할 때는 원문 전체를 그대로 보여준다
    const tx = el(`<div class="tx" contenteditable="plaintext-only"></div>`), chip = el('<span class="cat" hidden></span>');
    const paint = () => { const m0 = r.text.match(CAT_RE), m = m0 && !state.deletedTags.some(t => t.tag === m0[1]) ? m0 : null, rest = m && r.text.slice(m[0].length); chip.hidden = !rest; chip.textContent = rest ? tagLabel(m[1]) : ''; chip.style.cssText = rest ? tagStyle(m[1]) : ''; chip.title = rest ? (state.tags[m[1]]?.desc || '') : ''; tx.textContent = rest || r.text; };
    paint();
    tx.onfocus = () => { chip.hidden = true; tx.textContent = r.text; };
    tx.onblur = () => { const v = tx.textContent.trim(); if (!v) { deleteRow(r); render(); return; } if (v !== r.text) updateRow(r, { text: v }); paint(); };
    tx.onkeydown = e => {
      if (e.isComposing) return; // 한글 조합 중 Enter·Esc 는 무시
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); tx.blur(); }
      if (e.key === 'Escape') { tx.textContent = r.text; tx.blur(); } // 편집 취소
    };
    const del = opts.noStatus ? el(`<button class="del" title="삭제" aria-label="삭제">${icon('x', 14)}</button>`) : el(`<button class="del" title="메뉴" aria-label="업무 메뉴: 상태 변경, 삭제" aria-haspopup="menu">${icon('more', 18)}</button>`);
    del.onclick = () => opts.noStatus ? (deleteRow(r), render()) : statusMenu(del, statusCode(r.status), code => setStatus(r, code), () => { deleteRow(r); render(); }, r.section === '공통업무' ? [{ label: '↻ 반복 업무로 옮기기', run: () => { updateRow(r, { section: '공통반복' }); toast('반복 업무로 옮겼습니다'); render(); } }] : r.section === '공통반복' ? [{ label: '→ 변동 업무로 옮기기', run: () => { updateRow(r, { section: '공통업무' }); toast('변동 업무로 옮겼습니다'); render(); } }] : []);
    row.append(chip, tx);
    if (isDone(r) && !opts.noStatus && TASK_KEYS.has(r.section)) { // 완료일: 연한 회색, 눌러서 날짜 수정
      const c = String(r.completed || r.date).slice(0, 10), dd = el(`<label class="done-date" title="완료일 수정">${c.slice(5).replace('-', '/')}<input type="date" value="${c}" max="${todayKst()}" aria-label="완료일 수정"></label>`);
      dd.querySelector('input').onchange = e => { if (!e.target.value) return; updateRow(r, { completed: e.target.value }); toast(`완료일을 ${e.target.value.slice(5).replace('-', '/')}로 바꿨습니다`); render(); loadDone(); };
      row.append(dd);
    }
    if (NESTABLE.has(r.section)) { // 하위 업무 입력칸만 열고, 실제로 하나 입력해야 프로젝트가 된다 (Esc·빈칸으로 벗어나면 취소)
      const project = el('<button class="project-start" title="하위 업무를 추가해 프로젝트로 관리">+ 하위 업무</button>');
      project.onclick = () => {
        if (row.nextElementSibling?.classList.contains('sub-add')) return row.nextElementSibling.querySelector('input').focus();
        const box = addInput(text => { changeSubtask(r, { id: newId(r.date), date: r.date, section: '하위업무', col: r.id, status: 'todo', text, start: '', end: '' }, {}); }, '하위 업무 입력 후 Enter · Esc 취소');
        box.classList.add('sub-add'); const i = box.querySelector('input');
        i.addEventListener('blur', () => setTimeout(() => { if (!i.value.trim()) box.remove(); }, 150));
        i.addEventListener('keydown', e => { if (e.key === 'Escape') box.remove(); });
        row.after(box); i.focus();
      };
      row.append(project);
    }
    row.append(del); return row;
  }
  // 상태 버튼: 클릭/Space/Enter = 다음 상태, 우클릭·길게 누르기·Shift+F10 = 상태 바로 선택 메뉴
  function statusButton(r, set) {
    const c = statusCode(r.status), n = nextStatus(c);
    const b = el(`<button type="button" class="st st-${c}" title="${STAT[c].label} · 클릭: ${STAT[n].label} / 우클릭: 상태 선택" aria-label="상태: ${STAT[c].label}. 눌러서 ${STAT[n].label}(으)로 변경" aria-haspopup="menu">${statusIcon(c)}</button>`);
    b.dataset.rid = r.id;
    let timer = null, longPressed = false;
    const apply = k => { set(k); requestAnimationFrame(() => document.querySelector(`.st[data-rid="${CSS.escape(r.id)}"]`)?.focus()); }; // 다시 그려도 키보드 포커스 유지
    b.onclick = e => { if (longPressed) { longPressed = false; return; } apply(n); };
    b.oncontextmenu = e => { e.preventDefault(); statusMenu(b, c, apply); };
    b.onpointerdown = e => { if (e.pointerType === 'mouse') return; longPressed = false; timer = setTimeout(() => { longPressed = true; statusMenu(b, c, apply); }, 450); };
    b.onpointerup = b.onpointercancel = b.onpointerleave = () => clearTimeout(timer);
    return b;
  }
  function statusMenu(anchor, current, set, onDelete, extras = []) {
    document.querySelector('.st-menu')?.remove();
    const m = el(`<div class="st-menu" role="menu" aria-label="${onDelete ? '업무 메뉴' : '상태 선택'}">${Object.keys(STAT).map(k => `<button type="button" role="menuitemradio" aria-checked="${k === current}" data-k="${k}">${statusIcon(k)}<span>${STAT[k].label}</span></button>`).join('')}${extras.map((x, i) => `<button type="button" role="menuitem" class="st-extra" data-ex="${i}"><span>${esc(x.label)}</span></button>`).join('')}${onDelete ? `<button type="button" role="menuitem" class="st-del" data-del>${icon('x', 20)}<span>삭제</span></button>` : ''}</div>`);
    document.body.append(m);
    const a = anchor.getBoundingClientRect(), h = m.offsetHeight;
    m.style.left = Math.min(innerWidth - m.offsetWidth - 8, a.left) + 'px';
    m.style.top = (a.bottom + h + 8 > innerHeight ? a.top - h - 4 : a.bottom + 4) + 'px';
    const items = [...m.querySelectorAll('button')];
    const close = (refocus = true) => { m.remove(); removeEventListener('pointerdown', outside, true); if (refocus && anchor.isConnected) anchor.focus(); };
    const outside = e => { if (!m.contains(e.target)) close(false); };
    addEventListener('pointerdown', outside, true);
    items.forEach((it, i) => {
      it.onclick = () => { close(false); if ('ex' in it.dataset) return extras[it.dataset.ex].run(); if ('del' in it.dataset) onDelete(); else if (it.dataset.k !== current) set(it.dataset.k); };
      it.onkeydown = e => {
        if (e.key === 'Escape' || e.key === 'Tab') { e.preventDefault(); close(); }
        else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); items[(i + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length].focus(); }
      };
    });
    (items.find(x => x.dataset.k === current) || items[0]).focus();
  }
  const childrenOf = r => state.rows.filter(x => x.section === '하위업무' && x.col === r.id && x.date === r.date);
  let applyMainW = () => {};
  const SUBTASKABLE = new Set(['배치예정', '변동업무', '팔로업']);
  const NESTABLE = new Set([...SUBTASKABLE, '주간고정']); // 하위 업무를 가질 수 있는 칸 (주간고정은 제자리에 남음)
  // 자동 배치: 하위 업무가 있으면 팔로업, 시작 전이면 배치예정, 진행·완료면 변동업무 (데일리·주간·릴스는 제자리)
  const placeFor = (r, code) => !SUBTASKABLE.has(r.section) ? r.section : isProject(r) ? '팔로업' : code === 'todo' ? '배치예정' : '변동업무';
  // 완료 축하: 작은 색종이가 잠깐 터지고 사라짐 (동작 줄이기 설정이면 생략)
  function confetti(at) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const b = at?.getBoundingClientRect?.() || { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 }, x = b.left + Math.min(b.width, 40) / 2, y = b.top + b.height / 2;
    const colors = ['#3182f6', '#0a8f55', '#f04452', '#ffb31a', '#7a5af8', '#00b8d9'];
    for (let i = 0; i < 16; i++) {
      const p = document.createElement('i'); p.className = 'confetti'; p.style.cssText = `left:${x}px;top:${y}px;background:${colors[i % colors.length]}`;
      document.body.append(p);
      const ang = Math.random() * Math.PI * 2, dist = 30 + Math.random() * 45, dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist - 20;
      p.animate([{ transform: 'translate(-50%,-50%) scale(1) rotate(0)', opacity: 1 }, { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + 30}px)) scale(.6) rotate(${Math.random() * 540}deg)`, opacity: 0 }], { duration: 750 + Math.random() * 250, easing: 'cubic-bezier(.2,.7,.3,1)' }).onfinish = () => p.remove();
    }
  }
  const setStatus = (r, code) => { updateRow(r, { status: code, section: placeFor(r, code), completed: code === 'done' ? (isDone(r) && r.completed || todayKst()) : '' }); if (TASK_KEYS.has(r.section) || r.section.startsWith('공통') || r.section.startsWith('원장님')) holdSort(r.id); render(); if (code === 'done') { const b = document.querySelector(`.st[data-rid="${CSS.escape(r.id)}"]`); b?.classList.add('just-done'); confetti(b); } };
  const isProject = r => state.rows.some(x => x.section === '하위업무' && x.col === r.id && x.date === r.date); // 하위 업무가 1개 이상일 때만 프로젝트
  function progressOf(r) {
    const children = childrenOf(r), done = children.filter(isDone).length;
    return { total: children.length, done, percent: children.length ? Math.round(done / children.length * 100) : 0 };
  }
  function progressBar(r) {
    const p = progressOf(r);
    return `<div class="project-progress"><div class="project-progress-label"><span>${p.total ? `${p.done}/${p.total} 완료` : '하위 업무를 추가하세요'}</span><b>${p.percent}%</b></div><div class="project-track" role="progressbar" aria-label="${esc(r.text)} 진행률" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p.percent}"><span style="width:${p.percent}%"></span></div></div>`;
  }
  // 하위 업무: 화면을 먼저 바꾸고(바로 반영) 저장은 뒤에서 순서대로 보낸다. 실패하면 알리고 다시 불러온다.
  function changeSubtask(parent, child, patch, deleting = false) {
    const who = state.person, isNew = !deleting && !state.rows.some(x => x.id === child.id), next = { ...child, ...patch };
    if (deleting) state.rows = state.rows.filter(x => x.id !== child.id);
    else if (isNew) state.rows.push(next); else Object.assign(state.rows.find(x => x.id === child.id), patch);
    const children = childrenOf(parent), before = parent.status;
    parent.status = children.length && children.every(isDone) ? 'done' : children.some(isDone) ? 'doing' : 'todo';
    parent.section = SUBTASKABLE.has(parent.section) && children.length ? '팔로업' : parent.section;
    if (patch.status === 'done') confetti(document.activeElement);
    if (isNew) state.expanded.add('p:' + parent.id); // 하위 업무를 넣는 동안 펼친 채 유지
    if (parent.status === 'done' && before !== 'done') confetti(document.querySelector(`[data-id="${CSS.escape(parent.id)}"]`));
    render();
    if (isNew) document.querySelector(`.project-card[data-id="${CSS.escape(parent.id)}"] .add input`)?.focus(); // 연속 입력
    const rows = [{ ...parent }, ...(!deleting ? [next] : [])];
    changeSubtask.q = (changeSubtask.q || Promise.resolve()).then(async () => {
      if (deleting) await api.post({ action: 'delete', ids: [child.date + '|' + child.id], who });
      await api.post({ action: 'upsert', rows, who });
    }).catch(e => { toast('하위 업무 저장 실패: ' + e.message); load(); });
  }

  // 프로젝트(하위 업무가 있는 업무): 한 줄로 작게. 제목 · 작은 진행 막대 · n/m. 누르면 하위 업무가 펼쳐진다.
  function projectCard(r) {
    const p = progressOf(r), open = state.expanded.has('p:' + r.id);
    const card = el(`<div class="project-card${open ? ' open' : ''}" data-id="${esc(r.id)}"></div>`);
    const line = el('<div class="pc-line"></div>'); line.append(dragHandle(r));
    const title = el('<div class="project-title" contenteditable="plaintext-only"></div>'); title.textContent = r.text;
    title.onblur = () => { const text = title.textContent.trim(); if (text && text !== r.text) { updateRow(r, { text }); render(); } else if (!text) title.textContent = r.text; };
    title.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); title.blur(); } };
    const C2 = 2 * Math.PI * 9, prog = el(`<span class="pc-ring" role="progressbar" aria-label="${esc(r.text)} 진행률" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p.percent}"><svg viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="9" fill="none" stroke="var(--grey100)" stroke-width="3.5"/><circle cx="12" cy="12" r="9" fill="none" stroke="${p.percent === 100 ? 'var(--st-done)' : 'var(--blue)'}" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="${(C2 * p.percent / 100).toFixed(1)} ${C2.toFixed(1)}" transform="rotate(-90 12 12)"/></svg></span>`);
    const tog = el(`<button type="button" class="pc-toggle" aria-expanded="${open}" title="하위 업무 ${open ? '접기' : '펼치기'}">${p.done}/${p.total} · ${p.percent}% ${open ? '▴' : '▾'}</button>`);
    tog.onclick = () => { open ? state.expanded.delete('p:' + r.id) : state.expanded.add('p:' + r.id); render(); };
    const del = el(`<button class="del" title="프로젝트 삭제" aria-label="프로젝트 삭제">${icon('x', 14)}</button>`); del.onclick = () => { deleteRow(r); render(); };
    line.append(title, prog, tog, del); card.append(line);
    if (!open) return card;
    const list = el('<div class="subtasks"></div>');
    childrenOf(r).forEach(child => {
      const sub = el('<div class="subtask"></div>');
      const check = el('<input type="checkbox">'); check.checked = isDone(child); check.setAttribute('aria-label', child.text + ' 완료');
      check.onchange = () => changeSubtask(r, child, { status: check.checked ? 'done' : 'todo' });
      const text = el(`<div class="subtask-text${check.checked ? ' done' : ''}" contenteditable="plaintext-only"></div>`); text.textContent = child.text;
      text.onblur = () => { const value = text.textContent.trim(); if (value && value !== child.text) changeSubtask(r, child, { text: value }); else if (!value) text.textContent = child.text; };
      text.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); text.blur(); } };
      const remove = el(`<button title="하위 업무 삭제" aria-label="하위 업무 삭제">${icon('x', 14)}</button>`); remove.onclick = () => changeSubtask(r, child, {}, true);
      sub.append(check, text, remove); list.append(sub);
    });
    card.append(list, addInput(text => changeSubtask(r, { id: newId(r.date), date: r.date, section: '하위업무', col: r.id, status: 'todo', text, start: '', end: '' }, {}), '+ 하위 업무 추가 (Enter)'));
    return card;
  }


  function addInput(onAdd, ph = '+ 추가 (Enter)') {
    const w = el(`<div class="add"><input placeholder="${ph}"></div>`); const i = w.firstChild;
    i.onkeydown = e => {
      if (e.isComposing) return;
      if (e.key === 'Escape') { i.value = ''; i.blur(); }
      if (e.key !== 'Enter' || !i.value.trim()) return;
      const idx = [...document.querySelectorAll('.add input')].indexOf(i);
      onAdd(i.value.trim()); i.value = '';
      if (!i.isConnected && document.activeElement?.matches('.add input')) return; // 추가한 쪽이 이미 다음 입력칸에 포커스를 줬음
      render();
      document.querySelectorAll('.add input')[idx]?.focus(); // 연속 입력: 같은 자리의 입력칸으로 포커스 복귀
    };
    return w;
  }
  function itemList(date, section, col, opts = {}) {
    const box = document.createElement('div'); if (opts.doneLast) { box.className = 'task-list'; box.dataset.section = section; if (col !== undefined) box.dataset.col = col; }
    let rows = rowsFor(date, section, col);
    if (opts.doneLast && state.doneLast) rows = rankSort(rows);
    const key = date + section + (col ?? '');
    const hide = state.collapse && TASK_KEYS.has(section) && !state.expanded.has(key);
    let hidden = 0;
    rows.forEach(r => { const n = itemRow(r, opts); if (hide && isDone(r)) { n.classList.add('collapsed'); hidden++; } box.append(n); });
    if (hidden) { const m = el(`<button class="more">… 완료 ${hidden}건 보기</button>`); m.onclick = () => { state.expanded.add(key); render(); }; box.append(m); }
    else if (state.collapse && TASK_KEYS.has(section) && state.expanded.has(key) && rows.some(isDone)) { const m = el('<button class="more">▲ 완료 접기</button>'); m.onclick = () => { state.expanded.delete(key); render(); }; box.append(m); }
    box.append(addInput(text => opts.onAdd ? opts.onAdd(text) : addRow({ date, section, col: col ?? '', text, status: opts.noStatus ? '' : (opts.defaultStatus || 'todo') })));
    return box;
  }
  // 완료 정렬: 방금 바꾼 행은 400ms 제자리에 두었다가 220ms 동안 새 위치로 이동(FLIP)
  const sortHold = new Set();
  // 진행 중 → 시작 전·확인 필요 → 완료 순 (방금 바꾼 행은 잠시 제자리)
  const rankOf = r => sortHold.has(r.id) ? 1 : isDone(r) ? 2 : statusCode(r.status) === 'doing' ? 0 : 1;
  const rankSort = rows => rows.map((r, i) => [r, i]).sort((a, b) => rankOf(a[0]) - rankOf(b[0]) || a[1] - b[1]).map(x => x[0]);
  function holdSort(id) {
    if (!state.doneLast) return;
    sortHold.add(id); clearTimeout(holdSort.t);
    holdSort.t = setTimeout(() => {
      const rows = () => document.querySelectorAll('#report .row[data-id], #sharedtasks .row[data-id]');
      const before = new Map([...rows()].map(n => [n.dataset.id, n.getBoundingClientRect().top]));
      const focused = document.activeElement?.dataset?.rid;
      sortHold.clear(); renderReport(); renderShared();
      if (focused) document.querySelector(`.st[data-rid="${CSS.escape(focused)}"]`)?.focus({ preventScroll: true });
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      rows().forEach(n => { const dy = (before.get(n.dataset.id) ?? NaN) - n.getBoundingClientRect().top; if (dy) n.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 220, easing: 'cubic-bezier(.2,0,0,1)' } /* = --dur, --ease */); });
    }, 400);
  }
  /* ---------- 드래그로 순서·칸 이동: 손잡이를 끌어 놓으면 그 칸의 순서를 1..n 으로 다시 저장 ---------- */
  function dragHandle(r) {
    const h = el(`<button type="button" class="drag" aria-label="끌어서 옮기기" title="끌어서 순서·칸 이동">${icon('drag', 16)}</button>`);
    h.onpointerdown = e => startDrag(e, h.closest('.row,.project-card'), r);
    h.onkeydown = e => { // 키보드: ↑↓ 로 같은 칸 안에서 한 칸씩 이동
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.preventDefault();
      const list = rowsFor(r.date, r.section, r.section.startsWith('원장님') ? r.col : undefined), i = list.indexOf(r), j = i + (e.key === 'ArrowUp' ? -1 : 1);
      if (j < 0 || j >= list.length) return;
      [list[i], list[j]] = [list[j], list[i]]; list.forEach((x, k) => { x.order = String(k + 1); }); save(list); render();
      document.querySelector(`[data-id="${CSS.escape(r.id)}"] .drag`)?.focus();
    };
    h.setAttribute('aria-label', '끌어서 옮기기, 화살표 위·아래로 순서 이동');
    return h;
  }
  function startDrag(e, node, r) {
    if (e.button !== 0) return;
    e.preventDefault();
    const box = node.getBoundingClientRect(), ghost = node.cloneNode(true), ph = el('<div class="drop-ph"></div>');
    ghost.classList.add('drag-ghost'); Object.assign(ghost.style, { width: box.width + 'px', left: box.left + 'px', top: box.top + 'px' });
    ph.style.height = box.height + 'px'; node.after(ph); node.classList.add('dragging'); document.body.append(ghost);
    const dy = e.clientY - box.top, dx = e.clientX - box.left;
    let tlAt = null, nestTo = null, hold = null; const tlGhost = el('<div class="tl-block ghost tl-drop"><small></small></div>');
    const move = ev => {
      ghost.style.top = ev.clientY - dy + 'px'; ghost.style.left = ev.clientX - dx + 'px';
      ghost.hidden = true; const under = document.elementFromPoint(ev.clientX, ev.clientY); ghost.hidden = false;
      // 타임라인 위: 1시간 블록 미리보기 (원래 업무는 제자리에 남음)
      const tl = under?.closest('.tl-grid');
      if (tl) {
        const rc = tl.getBoundingClientRect(), s = Math.min(yToMin(ev.clientY - rc.top, tl), H1 * 60 - 60);
        tlAt = s; if (!tlGhost.isConnected) tl.append(tlGhost); place(tlGhost, toTime(s), toTime(s + 60));
        tlGhost.firstChild.textContent = `${toTime(s)} ~ ${toTime(s + 60)} · ${r.text}`; return;
      }
      tlAt = null; tlGhost.remove();
      const target = under?.closest('.task-list .row[data-id], .task-list .project-card[data-id]');
      const list = under?.closest('.task-list');
      // 다른 업무 가운데에 0.7초 머무르면 그 업무의 하위 업무로 넣을 준비 (테두리 표시). 가장자리로 가면 순서 이동.
      const t = target && target !== node && target.getBoundingClientRect(), mid = t && ev.clientY > t.top + t.height * .25 && ev.clientY < t.bottom - t.height * .25;
      const parent = mid && canNest && state.rows.find(x => x.id === target.dataset.id);
      if (parent && NESTABLE.has(parent.section)) {
        if (hold?.el !== target) { clearNest(); hold = { el: target, timer: setTimeout(() => { nestTo = parent; target.classList.add('nest-target'); ph.hidden = true; }, 700) }; }
        return;
      }
      clearNest();
      if (target && target !== node) { target[ev.clientY < t.top + t.height / 2 ? 'before' : 'after'](ph); }
      else if (list && !target) list.querySelector('.add')?.before(ph);
      if (ev.clientY < 80) scrollBy(0, -12); else if (ev.clientY > innerHeight - 80) scrollBy(0, 12);
    };
    const canNest = r.section !== '하위업무' && !isProject(r) && TASK_KEYS.has(r.section) && !String(r.col).startsWith('plan:');
    const clearNest = () => { if (hold) { clearTimeout(hold.timer); hold.el.classList.remove('nest-target'); } hold = null; nestTo = null; ph.hidden = false; };
    const up = () => {
      removeEventListener('pointermove', move); removeEventListener('pointerup', up);
      ghost.remove(); node.classList.remove('dragging');
      if (nestTo) { // 하위 업무로 들어감: 부모의 진행률에 포함
        const parent = nestTo; clearNest(); ph.remove();
        changeSubtask(parent, r, { section: '하위업무', col: parent.id, date: parent.date, order: '' });
        state.expanded.add('p:' + parent.id); toast(`"${parent.text.replace(CAT_RE, '') || parent.text}" 하위 업무로 넣었습니다`); return render();
      }
      clearNest();
      if (tlAt != null) { // 타임라인에 놓음: 업무 이름으로 1시간 블록 추가, 목록은 그대로
        tlGhost.remove(); ph.remove();
        addRow({ date: state.sel, section: '타임라인', start: toTime(tlAt), end: toTime(tlAt + 60), text: r.text.replace(CAT_RE, '') || r.text });
        toast(`${toTime(tlAt)}~${toTime(tlAt + 60)} 타임라인에 넣었습니다`); return render();
      }
      const list = ph.closest('.task-list[data-section]'); if (!list) { ph.remove(); return; }
      ph.replaceWith(node);
      const key = list.dataset.section, col = list.dataset.col, ids = [...list.querySelectorAll(':scope > [data-id]')].map(n => n.dataset.id);
      const changed = [];
      ids.forEach((id, i) => { const x = state.rows.find(y => y.id === id); if (!x) return; const patch = { order: String(i + 1), section: key, ...(col !== undefined && { col }) }; if (Object.keys(patch).some(k => x[k] !== patch[k])) { Object.assign(x, patch); changed.push(x); } });
      if (changed.length) save(changed);
      render();
    };
    addEventListener('pointermove', move); addEventListener('pointerup', up);
  }
  /* ---------- 릴스: 제목(링크) + 촬영/편집/업로드 단계 버튼. 셋 다 누르면 완료, 촬영을 누르면 영상 기획 시트에 ⭕ ---------- */
  const REEL_STEPS = ['촬영', '편집', '업로드'];
  // shortcut: 단계는 행의 '시작' 칸에 "촬영,편집" 처럼, 링크는 '종료' 칸에 저장(릴스 행은 시간 칸을 안 씀). 필드가 더 필요해지면 전용 컬럼으로
  const reelSteps = r => new Set(String(r.start || '').split(',').filter(x => REEL_STEPS.includes(x)));
  const reelLink = r => r.end && /^https?:/.test(r.end) ? r.end : `https://docs.google.com/spreadsheets/d/1onONNURdaBteNOeEP4VGANBYLQHlipe451M4rnKqBLo/edit#gid=1655414943&range=L${String(r.col).slice(5)}`;
  function reelRow(r, virtual = false) {
    const steps = reelSteps(r), row = el(`<div class="row reel${isDone(r) ? ' done' : ''}${virtual ? ' virtual' : ''}"${virtual ? '' : ` data-id="${esc(r.id)}"`}></div>`);
    row.append(virtual ? el('<span class="drag-spacer" aria-hidden="true"></span>') : dragHandle(r));
    row.append(el(`<span class="pst">${statusIcon(statusCode(r.status))}</span>`));
    const a = el(`<a class="tx reel-title" target="_blank" rel="noopener" title="영상 기획 열기"></a>`); a.href = reelLink(r); a.textContent = r.text; row.append(a);
    row.append(el(`<small class="reel-print">${steps.size ? REEL_STEPS.filter(x => steps.has(x)).join('·') + ' 완료' : ''}</small>`)); // 인쇄용 짧은 표시
    const box = el('<div class="reel-steps" role="group" aria-label="진행 단계"></div>');
    REEL_STEPS.forEach(st => {
      const b = el(`<button type="button" aria-pressed="${steps.has(st)}">${st}</button>`);
      b.onclick = () => {
        let target = r;
        if (virtual) { const { id, ...rest } = r; target = addRow(rest); } // 처음 누를 때 오늘 행으로 저장
        const set = reelSteps(target); set.has(st) ? set.delete(st) : set.add(st);
        const status = set.size === REEL_STEPS.length ? 'done' : set.size ? 'doing' : 'todo';
        updateRow(target, { start: REEL_STEPS.filter(x => set.has(x)).join(','), status });
        // 영상 기획 시트에도: 촬영 ⭕ / 편집 ⭕ / 업로드 날짜 + 콘텐츠 캘린더의 그날 영상 링크
        api.post({ action: 'reelsStep', row: String(target.col).slice(5), step: st, on: set.has(st) })
          .then(j => { if (j.link) { updateRow(target, { end: j.link }); render(); toast('업로드 영상 링크를 연결했습니다'); } else if (st === '업로드' && set.has(st)) toast('콘텐츠 캘린더에 아직 오늘 게시물이 없어요. 올라오면 링크가 자동으로 채워집니다'); })
          .catch(e => toast('영상 기획 반영 실패: ' + e.message));
        if (status === 'done') { holdSort(target.id); confetti(b); }
        render();
      };
      box.append(b);
    });
    const rej = el('<button type="button" class="reel-rej" title="기각: 내 목록에서 빼고 영상 기획에 기각 표시">기각</button>');
    rej.onclick = () => {
      if (!confirm(`"${r.text}"을(를) 기각할까요? 영상 기획 시트에도 기각으로 표시됩니다.`)) return;
      api.post({ action: 'reelsReject', row: String(r.col).slice(5) }).then(() => toast('기각했습니다')).catch(e => toast('기각 표시 실패: ' + e.message));
      state.reelPlan = state.reelPlan.filter(p => 'plan:' + p.row !== r.col);
      if (virtual) render(); else { deleteRows([r]); render(); }
    };
    box.append(rej);
    row.append(box);
    // 릴스 줄은 × 대신 '기각'으로 뺀다(모든 줄 폭을 같게). 지우기는 줄 선택 후 Delete 키로도 가능
    return row;
  }
  // 보고서 카드 배치(사람별 브라우저 저장): 왼쪽·오른쪽 두 칸, 순서, 카드별 테두리·채우기 색
  const CARD_DEFAULT = { L: ['주간고정', '데일리고정', '배치예정', '팔로업'], R: ['변동업무', '릴스업무', 'pub', 'memo'] };
  function cardColumns(cards, def = CARD_DEFAULT) {
    const lay = pref('cardLayout', def), colors = pref('cardColors', {}), placed = new Set([...lay.L, ...lay.R]);
    const L = [...lay.L], Rr = [...lay.R]; Object.keys(cards).forEach(k => { if (!placed.has(k)) (/memo|pub|dhw/.test(k) ? Rr : L).push(k); });
    const wrap = el(`<div class="card-cols${state.cardEdit ? ' editing' : ''}"><div class="card-col" data-c="L"></div><div class="card-col" data-c="R"></div></div>`);
    [['L', L], ['R', Rr]].forEach(([c, keys]) => keys.forEach(k => { const n = cards[k]; if (!n) return; n.dataset.card = k;
      const col = colors[k]; if (col) { n.style.borderColor = col.border || ''; n.style.background = col.fill || ''; n.classList.add('tinted'); }
      if (state.cardEdit) cardEditControls(n, k, colors[k] || {});
      wrap.querySelector(`[data-c="${c}"]`).append(n); }));
    return wrap;
  }
  const CARD_PASTELS = [['하늘', '#a8cbff', '#eef5ff'], ['민트', '#9be3c8', '#ecfaf4'], ['레몬', '#f5d97a', '#fffbea'], ['피치', '#ffc4a3', '#fff3ec'], ['로즈', '#f7b2c4', '#fff0f4'], ['라벤더', '#c9b8f5', '#f5f1ff'], ['세이지', '#b8d4a8', '#f3f8ef'], ['그레이', '#cfd6de', '#f6f7f9']];
  function cardEditControls(n, k, col) {
    const h = n.querySelector('h3'); if (!h) return;
    const g = el(`<span class="card-grip" title="끌어서 옮기기">${icon('drag', 18)}</span>`); h.prepend(g);
    // 파스텔 팔레트(테두리·채우기 한 쌍) 먼저, 세밀하게 고르고 싶으면 옆의 직접 선택
    const pal = el(`<span class="card-palette" role="group" aria-label="파스텔 색">${CARD_PASTELS.map(([name, b, f]) => `<button type="button" title="${name}" aria-label="${name}" style="background:${f};border-color:${b}" data-b="${b}" data-f="${f}"></button>`).join('')}</span>`);
    pal.onclick = e => { const b = e.target.closest('[data-b]'); if (!b) return; n.style.borderColor = b.dataset.b; n.style.background = b.dataset.f; n.classList.add('tinted'); const all = pref('cardColors', {}); all[k] = { border: b.dataset.b, fill: b.dataset.f }; setPref('cardColors', all); renderReport(); };
    h.append(pal);
    const pick = el(`<span class="card-colors"><label title="테두리 색">테두리 <input type="color" value="${col.border || '#e5e8eb'}"></label><label title="채우기 색">채우기 <input type="color" value="${col.fill || '#ffffff'}"></label><button type="button" class="card-reset">기본</button></span>`);
    const [bi, fi] = pick.querySelectorAll('input'), saveC = v => { const all = pref('cardColors', {}); if (v) all[k] = v; else delete all[k]; setPref('cardColors', all); };
    bi.oninput = () => { n.style.borderColor = bi.value; n.classList.add('tinted'); }; fi.oninput = () => { n.style.background = fi.value; n.classList.add('tinted'); };
    bi.onchange = fi.onchange = () => saveC({ border: bi.value, fill: fi.value });
    pick.querySelector('.card-reset').onclick = () => { saveC(null); renderReport(); };
    h.append(pick);
    g.onpointerdown = e => { // 카드 끌어서 순서·칸 바꾸기
      e.preventDefault(); const ph = el('<div class="card-ph"></div>'); ph.style.height = n.offsetHeight + 'px'; n.after(ph); n.classList.add('card-lift');
      const move = ev => { n.style.transform = `translateY(${ev.clientY - e.clientY}px)`; n.hidden = true; const t = document.elementFromPoint(ev.clientX, ev.clientY); n.hidden = false;
        const over = t?.closest('[data-card]'), col = t?.closest('.card-col');
        if (over && over !== n) { const r = over.getBoundingClientRect(); over[ev.clientY < r.top + r.height / 2 ? 'before' : 'after'](ph); } else if (col && !over) col.append(ph); };
      const up = () => { removeEventListener('pointermove', move); removeEventListener('pointerup', up); n.style.transform = ''; n.classList.remove('card-lift'); ph.replaceWith(n);
        const cols = n.closest('.card-cols'); setPref('cardLayout', { L: [...cols.querySelectorAll('[data-c="L"] > [data-card]')].map(x => x.dataset.card), R: [...cols.querySelectorAll('[data-c="R"] > [data-card]')].map(x => x.dataset.card) }); };
      addEventListener('pointermove', move); addEventListener('pointerup', up);
    };
  }
  function taskSection(d, s) {
    const all = rowsFor(d, s.key), done = all.filter(isDone).length;
    const onAdd = s.key !== '릴스업무' ? undefined : async text => { // 릴스 직접 추가 → 영상 기획 시트에 새 기획 행 → 그 행과 연결된 릴스 업무
      const title = text.replace(CAT_RE, '').trim() || text;
      try { const j = await api.post({ action: 'reelsAdd', title }); if (!j.row) throw new Error('기획 행을 찾지 못했습니다');
        addRow({ date: d, section: '릴스업무', col: 'plan:' + j.row, text: title, status: 'todo', start: '', end: '' }); toast('영상 기획 시트에도 추가했습니다'); }
      catch (e) { addRow({ date: d, section: '릴스업무', col: '', text, status: 'todo' }); toast('영상 기획 시트에는 쓰지 못했습니다: ' + e.message); }
      render();
    };
    const node = sec(s.L, itemList(d, s.key, undefined, { doneLast: true, defaultStatus: s.key === '변동업무' ? 'doing' : 'todo', onAdd }));
    node.id = 'sec-' + s.key; node.querySelector('h3').insertAdjacentHTML('beforeend', ` <small class="sec-count">${done}/${all.length}</small>`);
    if (s.key === '릴스업무') { // 영상 기획에서 아직 촬영 안 한 항목: 오늘 행이 없으면 가상 행으로 보여주고 처음 누를 때 저장
      const have = new Set(all.map(r => r.col)), list = node.querySelector('.task-list'), add = list.querySelector(':scope > .add');
      const tkey = t => String(t).normalize('NFKC').replace(CAT_RE, '').replace(/[^\p{L}\p{N}]/gu, '').toLowerCase(), seenT = new Set(all.map(r => tkey(r.text)));
      state.reelPlan.filter(p => !p.shot && !have.has('plan:' + p.row) && !seenT.has(tkey(p.title)) && seenT.add(tkey(p.title))).forEach(p => add.before(reelRow({ id: '', date: d, section: '릴스업무', col: 'plan:' + p.row, text: p.title, start: '', end: p.ref, status: 'todo' }, true)));
      // 정리: 영상 기획 연동 항목(단계 버튼) 묶음 → 직접 추가한 릴스 업무 묶음
      const planRows = [...list.querySelectorAll(':scope > .row.reel')], manual = [...list.querySelectorAll(':scope > [data-id]:not(.reel)')];
      if (planRows.length) { const h = el(`<h4 class="reel-head">영상 기획 연동 · ${planRows.length}</h4>`); list.prepend(h); [...planRows].reverse().forEach(n => h.after(n)); }
      // 직접 추가한 'OO 촬영/편집/업로드' 행들은 제목별로 한 줄로 묶고 단계 버튼으로 보여준다(각 단계 = 원래 행)
      const STEP_RE = /\s*(촬영|편집|업로드)\s*$/, groups = new Map();
      manual.forEach(n => { const r = state.rows.find(x => x.id === n.dataset.id); if (!r || isProject(r)) return; const base = r.text.replace(CAT_RE, '').replace(STEP_RE, '').trim(), m = r.text.match(STEP_RE); if (!m) return; (groups.get(base) || groups.set(base, []).get(base)).push({ r, n, step: m[1] }); });
      groups.forEach((items, base) => {
        const tag = items[0].r.text.match(CAT_RE)?.[1], done = items.every(i => isDone(i.r));
        const g = el(`<div class="row reel reel-group${done ? ' done' : ''}"><span class="drag-spacer" aria-hidden="true"></span><span class="pst">${statusIcon(done ? 'done' : items.some(i => isDone(i.r)) ? 'doing' : 'todo')}</span>${tag ? `<span class="cat" style="${tagStyle(tag)}">${esc(tagLabel(tag))}</span>` : ''}<span class="tx">${esc(base)}</span><small class="reel-print">${REEL_STEPS.filter(st => items.some(i => i.step === st && isDone(i.r))).join('·')}${items.some(i => isDone(i.r)) ? ' 완료' : ''}</small><div class="reel-steps" role="group" aria-label="${esc(base)} 단계"></div></div>`);
        REEL_STEPS.forEach(st => {
          const it = items.find(i => i.step === st), b = el(`<button type="button" aria-pressed="${!!it && isDone(it.r)}"${it ? '' : ' disabled title="이 단계 업무가 없습니다"'}>${st}</button>`);
          if (it) b.onclick = () => setStatus(it.r, isDone(it.r) ? 'todo' : 'done');
          g.querySelector('.reel-steps').append(b);
        });
        items[0].n.before(g); items.forEach(i => i.n.remove());
      });
      const rest = [...list.querySelectorAll(':scope > [data-id]:not(.reel), :scope > .reel-group')];
      if (planRows.length && rest.length) { const h = el(`<h4 class="reel-head">직접 추가 · ${rest.length}</h4>`); add.before(h); rest.forEach(n => add.before(n)); }
    }
    return node;
  }
  function sectionChips(d) { // 섹션 바로가기 칩: 남은 개수 표시
    const nav = el('<nav class="sec-chips" aria-label="섹션 바로가기"></nav>');
    mySections().forEach(s => {
      const left = rowsFor(d, s.key).filter(r => !isDone(r)).length;
      const b = el(`<button type="button">${esc(s.L)}<b>${left}</b></button>`);
      b.setAttribute('aria-label', `${s.L} 남은 업무 ${left}건으로 이동`);
      b.onclick = () => $('sec-' + s.key)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      nav.append(b);
    });
    if (state.calendar) { const b = el('<button type="button">이번 주 발행</button>'); b.onclick = () => $('sec-pub')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); nav.append(b); }
    dragScroll(nav);
    return nav;
  }
  // 가로로 넘치는 칩 줄: 마우스로 잡아 좌우로 끌기 + 세로 휠로 가로 이동 (끌었으면 클릭 무시)
  function dragScroll(n) {
    let x0 = null, s0 = 0, moved = false;
    n.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; x0 = e.clientX; s0 = n.scrollLeft; moved = false; });
    addEventListener('pointermove', e => { if (x0 == null) return; const dx = e.clientX - x0; if (Math.abs(dx) > 4) { moved = true; n.classList.add('dragging-x'); } n.scrollLeft = s0 - dx; });
    addEventListener('pointerup', () => { x0 = null; setTimeout(() => n.classList.remove('dragging-x'), 0); });
    n.addEventListener('click', e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
    n.addEventListener('wheel', e => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && n.scrollWidth > n.clientWidth) { n.scrollLeft += e.deltaY; e.preventDefault(); } }, { passive: false });
  }
  /* ---------- 원장님 워크시트: 월~토 시트, 월~일 달력(휴일 색) ---------- */
  function cellGrid(d, section, keys, cls, mode) {
    const g = el(`<div class="${cls}"></div>`);
    keys.forEach(([col, label]) => {
      const c = el(`<div class="cell"><h4>${esc(label)}</h4></div>`);
      if (mode === 'list') c.append(itemList(d, section, col, { noStatus: true }));
      else c.append(textarea('', cellText(d, section, col), v => setCellText(d, section, col, v), ''));
      g.append(c);
    });
    return g;
  }
  const DIR_COLS = [['원개블', '원개블'], ['그외', '추가 업무'], ['릴스촬영', '릴스 촬영 리스트']]; // 시트 열 값(원개블/그외/릴스촬영)은 그대로
  const planLink = (row, ref) => /^https?:/.test(ref || '') ? ref : `https://docs.google.com/spreadsheets/d/1onONNURdaBteNOeEP4VGANBYLQHlipe451M4rnKqBLo/edit#gid=1655414943&range=L${row}`;
  // 숙제 배치: 그날 원장님 시트에 행으로 기록(원장님숙제, '종료' 칸에 plan:행번호 연결)
  function assignHomework(p, col) {
    if (state.rows.some(r => r.date === state.sel && r.section === '원장님숙제' && r.end === 'plan:' + p.row)) return toast('이미 배치된 숙제입니다');
    addRow({ date: state.sel, section: '원장님숙제', col, text: p.title, status: 'todo', start: '', end: 'plan:' + p.row }); render();
    toast(`"${p.title}" 숙제로 배치했습니다`);
  }
  async function homeworkShot(p, on) {
    if ('shot' in p) p.shot = on; else { const x = state.reelPlan.find(y => String(y.row) === String(p.row)); if (x) x.shot = on; }
    try {
      await api.post({ action: 'reelsStep', row: p.row, step: '촬영', on });
      const owner = C.REELS_OWNER, d = todayKst(); if (!owner) return;
      const rows = (await api.get({ who: owner, from: d, to: d })).rows, r = rows.find(x => x.col === 'plan:' + p.row);
      const steps = new Set(String(r?.start || '').split(',').filter(Boolean)); on ? steps.add('촬영') : steps.delete('촬영');
      const start = REEL_STEPS.filter(x => steps.has(x)).join(','), status = steps.size === REEL_STEPS.length ? 'done' : steps.size ? 'doing' : 'todo';
      await api.post({ action: 'upsert', who: owner, rows: [r ? { ...r, start, status } : { id: newId(d), date: d, section: '릴스업무', col: 'plan:' + p.row, text: p.title, start, end: p.ref, status }] });
      toast(on ? `촬영 완료로 표시했습니다 (영상 기획 · ${disp(owner)} 릴스)` : '촬영 표시를 취소했습니다');
    } catch (e) { toast('연동 실패: ' + e.message); }
  }
  function renderDirectorReport(d, box) {
    const items = col => rowsFor(d, '원장님리스트', col), pct = l => l.length ? Math.round(l.filter(isDone).length / l.length * 100) : 0;
    const all = DIR_COLS.flatMap(([c]) => items(c));
    const bar = (label, l) => `<div class="dir-prog"><div class="project-progress-label"><span>${esc(label)} · ${l.filter(isDone).length}/${l.length}</span><b>${pct(l)}%</b></div><div class="project-track" role="progressbar" aria-label="${esc(label)} 진행률" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct(l)}"><span style="width:${pct(l)}%"></span></div></div>`;
    const cards = {};
    cards.dprog = sec('진행률', el(`<div class="dir-progs">${bar('전체', all)}${DIR_COLS.map(([c, l]) => bar(l, items(c))).join('')}</div>`));
    const g = el('<div class="dir-lists dir-stack"></div>');
    DIR_COLS.forEach(([col, label]) => { const c = el(`<div class="cell"><h4>${esc(label)}</h4></div>`); c.append(itemList(d, '원장님리스트', col, { doneLast: true, defaultStatus: 'todo' })); g.append(c); });
    cards.dlist = sec('원장님 업무리스트업', g);
    // 원장님 숙제: 위 = 그날 배치된 숙제(시트 행, 미완료는 다음 날로 이월) / 아래 = 영상 기획 '숙제' 전체 목록(끌어 올리거나 '배치')
    const HW_COLS = [['영어', '영상숙제(영어)'], ['영상', '영상숙제']], colOf = p => p.kind === '영어' ? '영어' : '영상';
    const hw = el('<div class="dir-lists dir-stack dir-hw"></div>');
    HW_COLS.forEach(([col, label]) => {
      const c = el(`<div class="cell hw-drop" data-col="${col}"><h4>${esc(label)}</h4></div>`);
      c.append(itemList(d, '원장님숙제', col, { doneLast: true, defaultStatus: 'todo' }));
      c.ondragover = e => { if (e.dataTransfer.types.includes('text/hw')) { e.preventDefault(); c.classList.add('drop-on'); } };
      c.ondragleave = () => c.classList.remove('drop-on');
      c.ondrop = e => { e.preventDefault(); c.classList.remove('drop-on'); const p = state.reelPlan.find(x => String(x.row) === e.dataTransfer.getData('text/hw')); if (p) assignHomework(p, col); };
      hw.append(c);
    });
    const assigned = new Set(state.rows.filter(r => r.date === d && r.section === '원장님숙제').map(r => r.end)), pool = state.reelPlan.filter(p => p.type === '숙제' && !p.shot && !assigned.has('plan:' + p.row));
    const back = el(`<div class="cell hw-pool"><h4>숙제 리스트 · 영상 기획 <small>${pool.length}개 · 위로 끌어 올리거나 '배치'를 누르세요</small></h4></div>`);
    pool.forEach(p => {
      const it = el(`<div class="hw-item" draggable="true"><span class="drag" aria-hidden="true">${icon('drag', 16)}</span><a class="tx" target="_blank" rel="noopener"></a><small class="hw-kind">${esc(p.kind || '국내')}</small><button type="button" class="hw-assign">배치</button></div>`);
      const a = it.querySelector('a'); a.textContent = p.title; a.href = planLink(p.row, p.ref);
      it.ondragstart = e => { e.dataTransfer.setData('text/hw', String(p.row)); e.dataTransfer.effectAllowed = 'copy'; };
      it.querySelector('.hw-assign').onclick = () => assignHomework(p, colOf(p));
      back.append(it);
    });
    if (!pool.length) back.append(el('<p class="muted">배치할 숙제가 없습니다.</p>'));
    hw.append(back);
    cards.dhw = sec('원장님 숙제', hw);
    const memo = sec('메모', textarea('memo', cellText(d, '메모', ''), v => setCellText(d, '메모', '', v), '메모')); memo.classList.add('memo-sec'); cards.dmemo = memo;
    Object.entries(cards).forEach(([k, n]) => { n.id = 'sec-' + k; });
    box.append(cardColumns(cards, { L: ['dprog', 'dlist'], R: ['dhw', 'dmemo'] }));
    box.querySelectorAll('textarea').forEach(autosize);
  }


  const readOnly = () => !!state.dir.me && !isDirector() && state.person !== state.dir.me; // 원장님 워크시트·공통은 모두 편집
  function renderReport() {
    const d = state.sel, box = $('report'); box.innerHTML = '';
    box.classList.toggle('readonly', readOnly()); $('timeline').classList.toggle('readonly', readOnly());
    if (!state.rows.some(r => r.date === d)) {
      box.append(el(`<div class="empty-note">${fmtDate(d)} 보고서가 비어 있습니다.<br><button id="emptyCarry" class="primary">직전 근무일 항목 가져오기</button> <button id="emptyNew">빈 보고서 시작</button></div>`));
      $('emptyCarry').onclick = carryForward;
      $('emptyNew').onclick = () => { addRow({ date: d, section: '메모', text: ' ' }); render(); };
      return;
    }
    if (readOnly()) box.append(el(`<div class="ro-banner">${esc(disp(state.person))}님 보고서 · 보기 전용 (각자 자기 보고서만 고칠 수 있어요)</div>`));
    box.append(el(`<div class="titlebar" style="--tb-bg:${C.PEOPLE.find(p => p.name === state.person)?.color || '#191f28'}"><span>${isDirector() ? '원장님 워크시트' : '업무보고 및 회의록'}</span><span class="meta">${fmtDate(d)} · ${esc(disp(state.person))}</span></div>`));
    applyMainW();
    if (isDirector()) return renderDirectorReport(d, box);
    box.append(sectionChips(d));
    const cards = {};
    mySections().forEach(s => { cards[s.key] = taskSection(d, s); });
    const pub = publishingFor(d);
    if (pub) { cards.pub = sec('이번 주 발행', pub); cards.pub.id = 'sec-pub'; }
    const memo = sec('메모 · 회의록', textarea('memo', cellText(d, '메모', ''), v => setCellText(d, '메모', '', v), '메모')); memo.classList.add('memo-sec'); memo.id = 'sec-memo'; cards.memo = memo;
    box.append(cardColumns(cards));
    box.querySelectorAll('textarea').forEach(autosize);
  }

  async function carryForward() { // 복사 규칙은 서버(generateDay_) 한 곳에만 있다
    const d = state.sel;
    if (!confirm(`직전 근무일의 이어갈 항목을 ${d}(으)로 가져올까요?\n(완료 업무와 타임라인은 제외, 데일리 고정업무는 시작 전으로 초기화)`)) return;
    const j = await api.post({ action: 'generate', date: d, force: true }).catch(e => (toast(e.message), null));
    if (!j) return;
    if (!j.src) return toast('가져올 이전 보고서가 없습니다');
    state.rows.push(...j.rows); render(); toast(`${j.src} 항목 ${j.rows.length}개를 가져왔습니다`);
  }


  /* ---------- 완료 업무 모아보기(A4): 완료일 기준 범위 선택, 사람마다 브라우저에 저장, 인쇄 포함 여부도 저장 ---------- */
  const prefKey = k => `${k}:${state.person}`;
  const pref = (k, def) => { try { const v = localStorage[prefKey(k)]; return v == null ? def : JSON.parse(v); } catch { return def; } };
  const setPref = (k, v) => { try { localStorage[prefKey(k)] = JSON.stringify(v); } catch {} };
  const doneRange = () => pref('doneRange', null) || { from: weekStart(todayKst()), to: todayKst() };
  const DONE_SECS = new Set([...TASK_KEYS, '원장님리스트', '원장님숙제']);
  async function loadDone() {
    const { from, to } = doneRange(), key = [state.person, from, to].join('|');
    if (state.doneKey === key) return renderDone();
    state.doneKey = key; state.doneRows = null; renderDone();
    try { const j = await api.get({ from: shiftDate(from, -7), to }); if (state.doneKey === key) { state.doneRows = j.rows; renderDone(); } } // 완료일 기준이라 조금 앞 날짜부터 읽는다
    catch (e) { if (state.doneKey === key) { state.doneRows = []; renderDone(); toast('완료 업무를 불러오지 못했습니다: ' + e.message); } }
  }
  function renderDone() {
    const box = $('donePage'); if (!box) return;
    const { from, to } = doneRange(), printOn = pref('printDone', false);
    const all = [...(state.doneRows || []), ...state.rows].filter(r => DONE_SECS.has(r.section) && isDone(r));
    const latest = new Map(); all.forEach(r => { const k = r.origin || r.id, c = r.completed || r.date; if (c >= from && c <= to && (!latest.has(k) || latest.get(k).date < r.date)) latest.set(k, { ...r, _c: c }); });
    const byDay = {}; [...latest.values()].forEach(r => (byDay[r._c] = byDay[r._c] || []).push(r));
    const days = Object.keys(byDay).sort().reverse();
    box.innerHTML = `<div class="titlebar" style="--tb-bg:${C.PEOPLE.find(p => p.name === state.person)?.color || '#191f28'}"><span>완료 업무</span><span class="meta">${esc(disp(state.person))}</span></div>
      <div class="done-bar"><button type="button" class="done-range" aria-haspopup="dialog">📅 ${fmtDate(from)} ~ ${fmtDate(to)}</button><span class="sec-count">${latest.size}건</span>
      <label class="print-pick" title="인쇄 버튼을 누를 때 이 페이지도 함께 출력"><input type="checkbox"${printOn ? ' checked' : ''}><span class="dot-check" aria-hidden="true"></span>인쇄에 포함</label></div>`;
    box.querySelector('.print-pick input').onchange = e => { setPref('printDone', e.target.checked); box.classList.toggle('print-on', e.target.checked); };
    box.classList.toggle('print-on', printOn);
    box.querySelector('.done-range').onclick = e => openRangePicker(e.currentTarget);
    if (!state.doneRows) return box.append(el('<div class="empty-note">불러오는 중…</div>'));
    if (!days.length) return box.append(el('<div class="empty-note">이 기간에 완료한 업무가 없습니다.</div>'));
    days.forEach(d => {
      const g = el(`<section class="sec done-day"><h3>${fmtDate(d)} <small class="sec-count">${byDay[d].length}건</small></h3></section>`);
      byDay[d].forEach(r => { const m = r.text.match(CAT_RE), rest = m && r.text.slice(m[0].length);
        g.append(el(`<div class="row done"><span class="pst">${statusIcon('done')}</span><div class="tx">${rest ? `<span class="cat" style="${tagStyle(m[1])}">${esc(tagLabel(m[1]))}</span> ` : ''}${esc(rest || r.text)}</div><small class="done-sec">${esc(TASK_SECTIONS.find(x => x.key === r.section)?.L || r.section)}</small></div>`)); });
      box.append(g);
    });
  }
  // 여행 예약처럼: 시작일 → 종료일 순서로 누르면 범위가 정해진다
  function openRangePicker(anchor) {
    document.querySelector('.range-pop')?.remove();
    let { from, to } = doneRange(), pick = null, month = (to || todayKst()).slice(0, 7);
    const pop = el('<div class="range-pop" role="dialog" aria-label="완료일 범위 선택"></div>'); document.body.append(pop);
    const a = anchor.getBoundingClientRect(); pop.style.top = a.bottom + 6 + 'px'; pop.style.left = Math.max(8, Math.min(innerWidth - 340, a.left)) + 'px';
    const close = () => { pop.remove(); removeEventListener('pointerdown', outside, true); };
    const outside = e => { if (!pop.contains(e.target) && e.target !== anchor) close(); };
    addEventListener('pointerdown', outside, true);
    const paint = () => {
      const first = month + '-01', start = weekStart(first), y = +month.slice(0, 4), mo = +month.slice(5, 7);
      let cells = ''; for (let i = 0; i < 42; i++) { const d = shiftDate(start, i); if (i >= 35 && !d.startsWith(month)) break;
        const lo = pick || from, hi = pick ? pick : to, inR = d >= lo && d <= hi;
        cells += `<button type="button" data-d="${d}" class="${d.startsWith(month) ? '' : 'out'}${inR ? ' in' : ''}${d === lo ? ' edge' : ''}${d === hi ? ' edge' : ''}${d === todayKst() ? ' today' : ''}">${+d.slice(8)}</button>`; }
      pop.innerHTML = `<div class="rp-head"><button type="button" data-m="-1" aria-label="이전 달">‹</button><b>${y}년 ${mo}월</b><button type="button" data-m="1" aria-label="다음 달">›</button></div>
        <div class="rp-dow">${['월', '화', '수', '목', '금', '토', '일'].map(w => `<span>${w}</span>`).join('')}</div><div class="rp-grid">${cells}</div>
        <p class="rp-hint">${pick ? '끝 날짜를 고르세요' : '시작 날짜를 고르세요'}</p>
        <div class="rp-presets"><button type="button" data-p="w">이번 주</button><button type="button" data-p="m">이번 달</button><button type="button" data-p="l">지난달</button><button type="button" data-p="30">최근 30일</button></div>`;
    };
    const apply = (f, t) => { setPref('doneRange', { from: f, to: t }); close(); loadDone(); };
    pop.onclick = e => {
      const m = e.target.closest('[data-m]'); if (m) { const d = new Date(month + '-01T00:00:00'); d.setMonth(d.getMonth() + +m.dataset.m); month = iso(d).slice(0, 7); return paint(); }
      const p = e.target.closest('[data-p]'); if (p) { const t = todayKst(), k = p.dataset.p;
        if (k === 'w') return apply(weekStart(t), t); if (k === 'm') return apply(t.slice(0, 8) + '01', t); if (k === '30') return apply(shiftDate(t, -29), t);
        const lm = new Date(t.slice(0, 8) + '01T00:00:00'); lm.setDate(0); return apply(iso(lm).slice(0, 8) + '01', iso(lm)); }
      const b = e.target.closest('[data-d]'); if (!b) return;
      if (!pick) { pick = b.dataset.d; return paint(); }
      const [f, t] = [pick, b.dataset.d].sort(); apply(f, t);
    };
    pop.onpointerover = e => { const b = e.target.closest('[data-d]'); if (!pick || !b) return; pop.querySelectorAll('[data-d]').forEach(x => { const d = x.dataset.d, [lo, hi] = [pick, b.dataset.d].sort(); x.classList.toggle('in', d >= lo && d <= hi); }); };
    paint();
  }
  /* ---------- timeline ---------- */
  const PX = 48; // 1시간 높이
  const STEP = 30; // 타임라인 기본 단위(분)
  const TL_COLORS = { blue: ['#e8f3ff', '#1b64da'], green: ['#e6f6ee', '#0a7a4a'], orange: ['#fff3e6', '#b35300'], purple: ['#f0ebff', '#5b3cc4'], pink: ['#ffeef6', '#b0236a'], grey: ['#f2f4f6', '#4e5968'] };
  const [H0, H1] = C.TIMELINE;
  const yToMin = (y, g) => Math.max(H0 * 60, Math.min(H1 * 60, Math.floor((H0 * 60 + (y / g.clientHeight) * (H1 - H0) * 60) / STEP) * STEP));
  function place(b, start, end) {
    const s = toMin(start), e = toMin(end);
    b.style.top = ((s - H0 * 60) / 60 * PX) + 'px'; b.style.height = Math.max(14, (e - s) / 60 * PX - 2) + 'px';
  }
  // 현재 시각 선: 오늘 타임라인에만, 30초마다 따라 내려감
  function moveNow(n = document.querySelector('.tl-now')) {
    if (!n) return;
    const k = new Date(Date.now() + 9 * 36e5), m = k.getUTCHours() * 60 + k.getUTCMinutes();
    n.hidden = m < H0 * 60 || m > H1 * 60; n.style.top = ((m - H0 * 60) / 60 * PX) + 'px'; n.lastChild.textContent = toTime(m);
  }
  setInterval(() => moveNow(), 30000);
  function renderTimeline() {
    const box = $('timeline'); box.innerHTML = '';
    box.append(el(`<div class="tl-head"><span>타임라인 <small>${esc(state.sel.slice(5))}</small></span><button id="tlAdd" class="more">+ 블록</button></div>`));
    const grid = el('<div class="tl-grid"></div>'); grid.style.height = (H1 - H0) * PX + 'px';
    for (let h = H0; h < H1; h++) grid.append(el(`<div class="tl-hour"><span>${pad(h)}:00</span></div>`));
    if (state.sel === todayKst()) { const n = el('<div class="tl-now" aria-hidden="true"><i></i><b></b></div>'); grid.append(n); moveNow(n); }
    // 공용 캘린더의 회의(시간 있는 일정)는 모두의 타임라인에 같은 색으로 표시, 수정은 공용 일정 편집기로
    if (isDirector()) { // 원장님 워크시트: 마케터 개인 타임라인은 숨기고 마케팅 공용 회의(시간 있는 일정)만
      const sel = state.sel;
      if (state.teamTLDate !== sel) {
        state.teamTLDate = sel; state.teamTL = [];
        api.get({ who: SHARED, from: sel, to: sel }).then(j => { if (state.teamTLDate === sel && isDirector()) { state.teamTL = j.rows; renderTimeline(); } }).catch(() => {});
      }
    }
    (isDirector() ? state.teamTL : state.shared).filter(r => r.section === '일정' && r.date === state.sel && r.start && r.end).forEach(r => {
      const b = el(`<div class="tl-block tl-shared${isDone(r) ? ' done' : ''}" title="공통 일정 ${esc(r.start)}~${esc(r.end)}">${esc(r.text)}<small>공통 · ${esc(r.start)}~${esc(r.end)}</small></div>`);
      place(b, r.start, r.end); b.onclick = () => isDirector() ? bigPeek(`공통 · ${r.start}~${r.end}`, r.text) : openEditor(r, b); grid.append(b);
    });
    rowsFor(state.sel, '타임라인').forEach(r => {
      const c = TL_COLORS[String(r.col).replace('c:', '')], b = el(`<div class="tl-block" title="${esc(r.start)}~${esc(r.end)} ${esc(r.text)}">${esc(r.text)}<small>${esc(r.start)}~${esc(r.end)}</small></div>`);
      if (c) Object.assign(b.style, { background: c[0], color: c[1], borderLeft: `3px solid ${c[1]}` });
      place(b, r.start, r.end); b._r = r;
      b.onpointerdown = e => startMove(e, r, b, grid);
      b.onclick = () => { if (!b.moved) openEditor(r, b); };
      grid.append(b);
    });
    layoutLanes(grid);
    grid.onpointerdown = e => { // 빈 곳에서 드래그 → 새 블록 (마우스만; 터치는 + 블록 버튼)
      if (e.pointerType !== 'mouse' || e.target.closest('.tl-block')) return;
      const rect = grid.getBoundingClientRect(); const m0 = yToMin(e.clientY - rect.top, grid);
      const ghost = el('<div class="tl-block ghost"><small></small></div>'); grid.append(ghost); grid.setPointerCapture(e.pointerId);
      let m1 = m0;
      const span = () => { const s = Math.min(m0, m1), en = Math.min(H1 * 60, Math.max(m0, m1) + STEP); return [s, en]; }; // 누른 칸부터 끝 칸까지(30분 단위)
      const upd = ev => { m1 = yToMin(ev.clientY - rect.top, grid); const [s, en] = span(); place(ghost, toTime(s), toTime(en)); ghost.firstChild.textContent = `${toTime(s)} ~ ${toTime(en)} · ${(en - s) / 60}시간`; };
      upd(e);
      grid.onpointermove = upd;
      grid.onpointerup = () => {
        grid.onpointermove = grid.onpointerup = null;
        const [s, en] = span(), at = ghost.getBoundingClientRect(); ghost.remove();
        openEditor({ date: state.sel, section: '타임라인', start: toTime(s), end: toTime(en), text: '' }, { getBoundingClientRect: () => at }, true);
      };
    };
    box.append(grid);
    $('tlAdd').onclick = () => openEditor({ date: state.sel, section: '타임라인', ...nearSlot(), text: '' }, null, true);
  }
  // 시간이 겹치는 블록(내 블록·공통 일정)은 최대 3칸으로 나란히. 넓은 블록이 좁은 블록을 덮지 않게.
  function layoutLanes(grid) {
    const blocks = [...grid.querySelectorAll('.tl-block:not(.tl-team):not(.ghost)')].map(b => ({ b, s: parseFloat(b.style.top), e: parseFloat(b.style.top) + parseFloat(b.style.height) })).sort((x, y) => x.s - y.s || y.e - x.e);
    let group = [], end = -1;
    const flush = () => { const n = Math.min(3, Math.max(1, ...group.map(g => g.lane + 1))); group.forEach(g => Object.assign(g.b.style, { left: `calc(44px + ${Math.min(g.lane, 2)} * (100% - 46px) / ${n})`, width: `calc((100% - 46px) / ${n} - 2px)`, right: 'auto' })); group = []; };
    blocks.forEach(x => {
      if (x.s >= end) { flush(); end = -1; }
      const used = group.filter(g => g.e > x.s).map(g => g.lane); let lane = 0; while (used.includes(lane)) lane++;
      x.lane = lane; group.push(x); end = Math.max(end, x.e);
    });
    flush();
  }
  function startMove(e, r, b, grid) {
    if (e.pointerType !== 'mouse') return;
    e.stopPropagation(); b.moved = false;
    const y0 = e.clientY, s0 = toMin(r.start), dur = toMin(r.end) - s0;
    b.setPointerCapture(e.pointerId);
    b.onpointermove = ev => {
      const dm = Math.round(((ev.clientY - y0) / PX * 60) / STEP) * STEP;
      if (Math.abs(ev.clientY - y0) > 3) b.moved = true;
      const s = Math.max(H0 * 60, Math.min(H1 * 60 - dur, s0 + dm)); b.dataset.s = s; place(b, toTime(s), toTime(s + dur)); b.querySelector('small').textContent = `${toTime(s)}~${toTime(s + dur)}`;
    };
    b.onpointerup = () => {
      b.onpointermove = b.onpointerup = null;
      if (b.moved) { const s = +b.dataset.s; updateRow(r, { start: toTime(s), end: toTime(s + dur) }); renderTimeline(); }
    };
  }
  // 일정 글에 적힌 시간 읽기: "09시", "12시 반", "10시 15분", "9시~11시", "14시 /" 등. 1~7시는 오후로 본다. 시간이 하나일 때만 글자에서 지운다.
  function parseTimeText(raw) {
    const T = /(\d{1,2})\s*시\s*(반|(\d{1,2})\s*분)?/g, hits = [...String(raw).matchAll(T)];
    if (!hits.length) return null;
    const hm = m => { let h = +m[1], mi = m[2] === '반' ? 30 : +(m[3] || 0); if (h >= 1 && h <= 7) h += 12; return h > 23 || mi > 59 ? null : h * 60 + mi; };
    const s0 = hm(hits[0]); if (s0 == null) return null;
    const range = hits.length === 2 && /^\s*[~\-–]\s*$/.test(raw.slice(hits[0].index + hits[0][0].length, hits[1].index));
    if (hits.length > 1 && !range) return null; // 시간이 여러 개(변경 메모 등)면 건드리지 않음
    const e0 = range ? hm(hits[1]) : s0 + 60;
    let text = raw.slice(0, hits[0].index) + raw.slice((range ? hits[1] : hits[0]).index + (range ? hits[1] : hits[0])[0].length);
    text = text.replace(/^\s*-?\s*\d{1,2}\s*\([월화수목금토일]\)\s*/, '').replace(/^[\s\/·,\-]+|[\s\/·,\-]+$/g, '').replace(/\s*\/\s*\/\s*/g, ' / ').replace(/\s{2,}/g, ' ').trim();
    return { start: toTime(s0), end: toTime(Math.min(e0 ?? s0 + 60, 23 * 60 + 59)), text: text || raw.trim() };
  }
  const REPEAT = { w: 7, '2w': 14, m: 'm' };
  // shortcut: 일정의 '순서' 칸에 "반복규칙 ext" 를 함께 저장 (예: "w ext"). 빈 값은 서버가 무시하므로 지울 때는 '-'
  const ruleOf = r => String(r.order || '').split(' ').find(t => REPEAT[t]) || '';
  const isExt = r => String(r.order || '').split(' ').includes('ext');
  const nextDate = (d, rule) => { if (rule !== 'm') return shiftDate(d, REPEAT[rule]); const t = new Date(d + 'T00:00:00'); t.setMonth(t.getMonth() + 1); return iso(t); };
  // 반복 일정을 완료하면 다음 회차를 만든다(이미 있으면 만들지 않음)
  function spawnNext(r) {
    if (!ruleOf(r) || !isDone(r)) return;
    const d = nextDate(r.date, ruleOf(r)), key = r.origin || r.id;
    if (state.shared.some(x => x.section === r.section && x.date === d && (x.origin || x.id) === key)) return;
    const { id, ...rest } = r;
    addRow({ ...rest, date: d, status: '', completed: '', origin: key });
    toast(`다음 일정(${d.slice(5).replace('-', '/')})을 만들었습니다`);
  }
  // 새 일정 기본 시각: 지금과 가장 가까운 30분 단위부터 1시간
  const nearSlot = () => { const k = new Date(Date.now() + 9 * 36e5), m = Math.min(23 * 60, Math.round((k.getUTCHours() * 60 + k.getUTCMinutes()) / 30) * 30); return { start: toTime(m), end: toTime(m + 60) }; };
  let editing = null;
  function openEditor(r, anchor, isNew) {
    editing = { r, isNew };
    const p = $('blockEditor'); p.classList.remove('hidden');
    $('beTitle').value = r.text; $('beStart').value = r.start; $('beEnd').value = r.end;
    $('beDelete').classList.toggle('hidden', !!isNew);
    const isEv = ['일정', '원장님일정'].includes(r.section), isTl = r.section === '타임라인';
    $('beColorWrap').hidden = !isTl;
    if (isTl) { const cur = String(r.col || '').replace('c:', '') || 'blue'; $('beColorWrap').innerHTML = '색 ' + Object.entries(TL_COLORS).map(([k, c]) => `<label title="${k}"><input type="radio" name="beColor" value="${k}"${k === cur ? ' checked' : ''}><span style="background:${c[0]};border-color:${c[1]}"></span></label>`).join(''); }
    $('beRepeatWrap').hidden = !isEv; $('beExtWrap').hidden = !isEv; $('beRepeat').value = isEv ? ruleOf(r) : ''; $('beExt').checked = isEv && isExt(r);
    $('beCopyWrap').hidden = !!isNew; $('beCopyDate').value = shiftDate(r.date, 7);
    const a = anchor ? anchor.getBoundingClientRect() : { left: innerWidth / 2 - 130, top: innerHeight / 2 - 80, width: 0 };
    p.style.left = Math.max(8, Math.min(innerWidth - 350, a.left - 350)) + 'px';
    p.style.top = Math.max(8, Math.min(innerHeight - 170, a.top)) + 'px';
    $('beTitle').focus();
  }
  function closeEditor() { $('blockEditor').classList.add('hidden'); editing = null; }
  addEventListener('pointerdown', e => { if (editing && !$('blockEditor').contains(e.target) && !e.target.closest('.sc-add,.sc-ev,.tl-block,.tl-grid')) closeEditor(); }, true);
  $('beCancel').onclick = closeEditor;
  // 복제: 날짜와 대상 캘린더(마케팅 공용 / 원장님 / 내 타임라인)를 골라 같은 내용으로 새로 만든다
  $('beCopy').onclick = async () => {
    if (!editing) return;
    const r = editing.r, d = $('beCopyDate').value, to = $('beCopyTo').value;
    if (!d) return toast('복제할 날짜를 고르세요');
    const text = $('beTitle').value.trim() || r.text, start = normTime($('beStart').value), end = normTime($('beEnd').value);
    if (to === 'me') { if (!start || !end) return toast('타임라인은 시작·종료 시각이 필요합니다'); const row = { id: newId(d), date: d, section: '타임라인', col: '', status: '', text, start, end }; if (d === state.sel) state.rows.push(row); await save([row]); }
    else { const who = to, section = to === '원장님' ? '원장님일정' : '일정', row = { id: newId(d), date: d, section, col: to === '원장님' ? '' : state.person, status: '', text, start, end };
      await api.post({ action: 'upsert', rows: [row], who }); if ((to === '원장님') === isDirector()) state.shared.push({ ...row, _who: who }); }
    toast(`${d.slice(5).replace('-', '/')} ${to === 'me' ? '내 타임라인' : to === '원장님' ? '원장님 캘린더' : '마케팅 공용'}에 복제했습니다`);
    closeEditor(); renderShared(); renderTimeline();
  };
  $('beSave').onclick = () => {
    if (!editing) return;
    const text = $('beTitle').value.trim(), start = normTime($('beStart').value), end = normTime($('beEnd').value);
    if (!text) return toast('내용을 입력하세요');
    if (['beStart', 'beEnd'].some(id => $(id).value.trim() && !normTime($(id).value))) return toast('시각은 0930, 14 처럼 24시로 입력하세요');
    if (editing.r.section === '타임라인' && (!start || !end)) return toast('시작과 종료 시각을 입력하세요');
    if ((end && !start) || (start && end && toMin(end) <= toMin(start))) return toast('종료 시각이 시작보다 뒤여야 합니다');
    let t = { text, start, end };
    if (['일정', '원장님일정'].includes(editing.r.section)) { const p = parseTimeText(text); if (p) t = { text: p.text, start: p.start, end: p.end }; } // "09시 내부회의" → 09:00~10:00 내부회의
    if (editing.r.section === '타임라인') t.col = 'c:' + (document.querySelector('input[name=beColor]:checked')?.value || 'blue');
    if (['일정', '원장님일정'].includes(editing.r.section)) t.order = [$('beRepeat').value, $('beExt').checked && 'ext'].filter(Boolean).join(' ') || '-'; // shortcut: 일정 행은 '순서' 칸에 반복 규칙(w/2w/m)을 저장, 일정 정렬은 시각으로 하므로 겹치지 않음
    if (editing.isNew) addRow({ ...editing.r, ...t }); else updateRow(editing.r, t);
    state.ext = null; // 대시보드 외부 미팅 다시 받기
    closeEditor(); renderTimeline(); renderShared();
  };
  $('beDelete').onclick = () => { if (editing && !editing.isNew) deleteRow(editing.r); closeEditor(); renderTimeline(); renderShared(); };
  // 시각 직접 입력(24시): 9 → 09:00, 930 → 09:30, 1415 → 14:15, 14:5 → 14:05, 9.30·9시30분도 받음. 잘못되면 '' 
  const normTime = v => {
    const d = String(v).replace(/[^0-9:.시]/g, '').replace(/[.시]/g, ':');
    let h, m;
    if (d.includes(':')) [h, m] = d.split(':').map(x => +x || 0);
    else if (d.length <= 2) [h, m] = [+d, 0];
    else [h, m] = [+d.slice(0, -2), +d.slice(-2)];
    return d && h <= 24 && m < 60 && !(h === 24 && m) ? pad(h) + ':' + pad(m) : '';
  };
  console.assert(normTime('9') === '09:00' && normTime('930') === '09:30' && normTime('1415') === '14:15' && normTime('14:5') === '14:05' && normTime('9시30') === '09:30' && normTime('25') === '' && normTime('') === '', 'normTime');
  ['beStart', 'beEnd'].forEach(id => {
    $(id).onfocus = e => e.target.select(); // 들어가면 바로 덮어쓰기
    $(id).oninput = e => { const v = e.target.value; if (/^\d{4}$/.test(v) && normTime(v)) { e.target.value = normTime(v); if (id === 'beStart') { e.target.blur(); $('beEnd').focus(); } } }; // 1330 → 13:30, 시작이면 종료로
    $(id).onblur = e => {
      const v = e.target.value.trim(); if (!v) return;
      const t = normTime(v); if (!t) { toast('시각은 0930, 14 처럼 24시로 입력하세요'); return; }
      e.target.value = t;
      if (id === 'beStart' && (!normTime($('beEnd').value) || toMin(normTime($('beEnd').value)) <= toMin(t))) $('beEnd').value = toTime(Math.min(toMin(t) + 60, 24 * 60)); // 종료가 비었거나 앞이면 1시간 뒤로
    };
    $(id).onkeydown = e => { if (e.isComposing) return; if (e.key === 'Enter') { e.target.blur(); $('beSave').click(); } if (e.key === 'Escape') closeEditor(); };
  });
  $('beTitle').onkeydown = e => { if (e.isComposing) return; if (e.key === 'Enter') $('beSave').click(); if (e.key === 'Escape') closeEditor(); };

  /* ---------- content calendar ---------- */
  function parseCalendar(grid) {
    const title = (grid[2] || [])[1] || '';
    const month = parseInt(title) || new Date().getMonth() + 1;
    const days = {}; let cur = null;
    for (const r of grid) {
      const cells = r.slice(1, 8).map(c => String(c || ''));
      const nums = cells.map(c => /^\d{1,2}$/.test(c.trim()) ? +c : null);
      if (nums.some(n => n !== null) && cells.every((c, i) => nums[i] !== null || !c.trim())) { cur = nums; continue; }
      if (!cur) continue;
      cells.forEach((c, i) => { if (cur[i] && c.trim()) (days[cur[i]] ??= []).push(...c.split('\n').map(s => s.trim()).filter(Boolean)); });
    }
    return { month, days };
  }
  const chip = s => `<span class="chip ${/💚|💜/.test(s) ? 'blog' : s.includes('@') ? 'ig' : ''}" title="${esc(s)}">${esc(s)}</span>`;
  // 발행 링크: 콘텐츠 데이터(채널별 [날짜, 제목/캡션, 링크])에서 같은 날·같은 채널 게시물을 찾는다
  const PUB_CH = [[/원개블|원장/, 'won'], [/자사블|병원 블로그/, 'jasa'], [/global|글로벌/i, 'global'], [/hongzz|홍크크/i, 'hongzz'], [/figo/i, 'figo'], [/arskin|아르스킨/i, 'arskin']];
  function pubLink(day, txt) {
    const cd = state.contentData; if (!cd) return '';
    const ch = PUB_CH.find(([re]) => re.test(txt))?.[1]; if (!ch || !cd[ch]) return '';
    const [y, m, d] = day.split('-').map(Number), key = `${y}. ${m}. ${d}`, same = cd[ch].filter(r => String(r[0]).trim() === key && /^https?:/.test(r[2]));
    const words = txt.split('|').pop().replace(/[^\p{L}\p{N}]/gu, ' ').split(/\s+/).filter(w => w.length > 1);
    return (same.find(r => words.some(w => String(r[1]).includes(w))) || same[0])?.[2] || '';
  }
  async function loadContentLinks() {
    if (loadContentLinks.done) return; loadContentLinks.done = true;
    const c = cacheGet('contentLinks'); if (c) { state.contentData = c; renderReport(); }
    try { const j = await api.get({ action: 'content' }); const slim = {}; ['hongzz', 'global', 'figo', 'arskin', 'won', 'jasa'].forEach(k => { slim[k] = (j[k] || []).slice(-60).map(r => [r[0], String(r[1]).slice(0, 80), r[2]]); });
      state.contentData = slim; cacheSet('contentLinks', slim); renderReport(); } catch {}
  }
  // 이번 주(월~일) 발행 예정: 날짜와 내용만 한 줄씩 (콘텐츠 캘린더 시트에서)
  function publishingFor(d) {
    const c = state.calendar; if (!c) return null;
    const ws = weekStart(d), lines = [];
    for (let i = 0; i < 7; i++) {
      const day = shiftDate(ws, i), [, m, dd] = day.split('-').map(Number); if (m !== c.month) continue;
      (c.days[dd] || []).forEach(t => { const txt = t.replace(/^[^\p{L}\p{N}@]+/u, ''), url = pubLink(day, txt);
        lines.push(`<li><span class="pub-date">${m}/${dd} (${WD[new Date(day + 'T00:00:00').getDay()]})</span>${url ? `<a class="pub-text" href="${esc(url)}" target="_blank" rel="noopener">${esc(txt)} ↗</a>` : `<span class="pub-text">${esc(txt)}</span>`}</li>`); });
    }
    return el(`<ul class="week-pub">${lines.join('') || '<li class="note-empty">이번 주 발행 예정이 없습니다</li>'}</ul>`);
  }

  /* ---------- print-only layout: 시트처럼 좌/우 항목을 한 줄씩 짝지은 표 (행 단위로만 페이지 분할) ---------- */


  /* ---------- shell ---------- */
  function renderDatestrip() {
    const s = $('datestrip'); s.innerHTML = '';
    state.dates.forEach(d => {
      const dt = new Date(d + 'T00:00:00'); const has = state.rows.some(r => r.date === d);
      const isToday = d === todayKst();
      const b = el(`<button class="${d === state.sel ? 'active' : ''}${has ? '' : ' empty'}${isToday ? ' today' : ''}"${isToday ? ' aria-current="date"' : ''}><small>${isToday ? '오늘' : WD[dt.getDay()]}</small><b>${dt.getDate()}</b></button>`);
      b.title = d; b.onclick = () => { state.sel = d; state.sharedAnchor = d; render(); loadShared(); };
      s.append(b);
    });
    requestAnimationFrame(() => { s.scrollLeft = s.scrollWidth; }); // 좁은 화면: 오늘이 보이게
  }
  const personInfo = () => C.PEOPLE.find(p => p.name === state.person);
  function renderPeople() {
    const make = () => C.PEOPLE.filter(p => !p.director).map(p => {
      const b = el(`<button class="${p.name === state.person ? 'active' : ''}">${esc(p.label || p.name)}${p.sheet ? '' : '<small>연결 대기</small>'}</button>`);
      b.onclick = () => { if (p.name === state.person) return setView('daily'); state.person = p.name; localStorage.person = p.name; state.rows = []; state.sel = null; state.expanded.clear(); setView('daily'); load(); };
      return b;
    });
    $('subnav').replaceChildren(...make());
    if (isDirector()) { const l = el('<button>숙제 목록</button>'), w = el('<button class="active">원장님 워크시트</button>'); l.onclick = () => setView('director'); $('peopleM').replaceChildren(l, w); }
    else $('peopleM').replaceChildren(...make());
  }
  // 원장님 워크시트는 '원장님 숙제' 메뉴 아래에서 연다. 일간보고서를 누르면 직전 마케터로 돌아간다.
  function openDirSheet() {
    if (!isDirector()) { state.prevPerson = state.person; state.person = DIRECTOR_WHO; state.rows = []; state.sel = null; state.sharedAnchor = null; state.teamTLDate = null; }
    setView('daily'); load();
  }
  function leaveDirSheet() { state.person = state.prevPerson || C.DEFAULT_PERSON; state.rows = []; state.sel = null; state.sharedAnchor = null; load(); }

  function setView(v) {
    state.view = v;
    const navV = v === 'daily' && isDirector() ? 'director' : v;
    document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === navV));
    document.querySelectorAll('[data-dir]').forEach(b => b.classList.toggle('active', (b.dataset.dir === 'sheet') === (v === 'daily')));
    $('viewDaily').classList.toggle('hidden', v !== 'daily');
    $('viewCalendar').classList.toggle('hidden', v !== 'calendar');
    $('viewRevenue').classList.toggle('hidden', v !== 'revenue');
    $('viewDirector').classList.toggle('hidden', v !== 'director');
    $('viewHome').classList.toggle('hidden', v !== 'home');
    $('viewTeam').classList.toggle('hidden', v !== 'team');
    $('viewSettings').classList.toggle('hidden', v !== 'settings');
    if (v === 'settings') renderSettings();
    if (v === 'home') renderHome();
    if (v === 'team') { state.teamPage = state.teamPage || (isBoss() ? 'tags' : 'check'); renderTeam(); if (!isBoss()) loadTeam(todayKst()).then(renderTeam); }
    document.querySelectorAll('[data-team]').forEach(b => b.classList.toggle('active', v === 'team' && b.dataset.team === state.teamPage));
    if (v === 'director') { renderDirector(); loadDirector(); }
    window.document.querySelector('.topbar').classList.toggle('hidden', v !== 'daily');
    if (v === 'calendar') window.ContentHub.open();
    if (v === 'revenue') window.RevenueHub.open();
  }
  function render() { renderDatestrip(); renderShared(); renderReport(); renderTimeline(); loadDone(); $('btnCollapse').classList.toggle('on', state.collapse); $('btnCollapse').setAttribute('aria-pressed', state.collapse); $('btnDoneSort').classList.toggle('on', state.doneLast); $('btnDoneSort').setAttribute('aria-pressed', state.doneLast); }

  document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => {
    if (b.classList.contains('active') && b.dataset.view !== 'home') return setView('home'); // 같은 대메뉴를 다시 누르면 접고 홈으로
    if (b.dataset.view === 'daily' && isDirector()) { leaveDirSheet(); return setView('daily'); } // 사람을 먼저 바꿔야 메뉴 표시가 맞는다
    const mineD = C.PEOPLE.find(p => p.name === state.dir.me && !p.director);
    if (b.dataset.view === 'daily' && mineD && state.person !== mineD.name) { state.person = mineD.name; state.rows = []; state.sel = null; setView('daily'); return load(); } // 일간보고서 = 내 보고서부터
    if (b.dataset.view === 'director') return openDirSheet(); // 숙제 목록 페이지는 숨김(코드는 보관)
    setView(b.dataset.view);
  });
  $('brandHome').onclick = () => setView('home');
  $('brandHome').onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setView('home'); } };
  document.querySelectorAll('[data-team]').forEach(b => b.onclick = () => { state.teamPage = b.dataset.team; setView('team'); });
  document.querySelectorAll('[data-dir]').forEach(b => b.onclick = () => b.dataset.dir === 'sheet' ? openDirSheet() : setView('director'));
  document.querySelectorAll('[data-pane]').forEach(b => b.onclick = () => {
    document.querySelectorAll('[data-pane]').forEach(x => x.classList.toggle('active', x === b));
    $('report').parentElement.classList.toggle('hidden-m', b.dataset.pane !== 'report');
    $('timeline').classList.toggle('hidden-m', b.dataset.pane !== 'timeline');
  });
  document.querySelectorAll('[data-content-view]').forEach(button => button.onclick = () => {
    setView('calendar'); window.ContentHub.select(button.dataset.contentView);
  });
  addEventListener('content-navigation', ({ detail }) => {
    document.querySelectorAll('[data-content-view]').forEach(button => {
      const selected = button.dataset.contentView === detail.view;
      button.classList.toggle('active', selected); button.setAttribute('aria-pressed', selected);
      button.disabled = button.dataset.contentView !== 'cal' && !detail.available;
    });
  });
  document.querySelectorAll('[data-icon]').forEach(n => { n.outerHTML = icon(n.dataset.icon, 18); });
  $('btnCarry').onclick = carryForward;
  $('btnKeys').onclick = () => openShortcuts();
  // 오른쪽 위 도구: 햄버거(☰)를 누르면 메뉴로 펼친다. 바깥 클릭·Esc·항목 선택으로 닫힘(정렬·접기 토글은 열린 채 유지)
  const tm = $('toolMenu'), tt = $('toolToggle');
  const toolClose = () => { tm.hidden = true; tt.setAttribute('aria-expanded', 'false'); };
  tt.onclick = e => { e.stopPropagation(); tm.hidden = !tm.hidden; tt.setAttribute('aria-expanded', String(!tm.hidden)); if (!tm.hidden) tm.querySelector('button')?.focus(); };
  tm.addEventListener('click', e => { const b = e.target.closest('button'); if (b && !['btnDoneSort', 'btnCollapse'].includes(b.id)) toolClose(); });
  addEventListener('pointerdown', e => { if (!tm.hidden && !tm.contains(e.target) && e.target !== tt) toolClose(); });
  tm.addEventListener('keydown', e => { if (e.key === 'Escape') { toolClose(); tt.focus(); } });
  $('cardEdit').onclick = () => { state.cardEdit = !state.cardEdit; $('cardEdit').textContent = state.cardEdit ? '편집 완료' : '카드 배치 편집'; $('cardEdit').setAttribute('aria-pressed', state.cardEdit); renderReport(); if (state.cardEdit) $('report').scrollIntoView({ block: 'start' }); };
  // 본문 폭: 모니터마다 다르니 이 기기에만 저장 (기본 800px)
  // 일간보고서와 원장님 워크시트는 폭을 따로 기억한다
  const wKey = () => isDirector() ? 'mainWdir' : 'mainW';
  const setMainW = w => { document.documentElement.style.setProperty('--main-w', w + 'px'); $('mainW').value = w; $('mainWv').textContent = w + 'px'; try { localStorage[wKey()] = w; } catch {} };
  applyMainW = () => setMainW(+(() => { try { return localStorage[wKey()]; } catch { return 0; } })() || 800);
  applyMainW();
  $('widthEdit').onclick = () => { const box = $('widthBox'); box.hidden = !box.hidden; $('widthEdit').setAttribute('aria-pressed', !box.hidden); if (!box.hidden) $('mainW').focus(); };
  $('mainW').oninput = e => setMainW(+e.target.value);
  $('mainWreset').onclick = () => setMainW(800);
  $('btnDoneSort').onclick = () => { state.doneLast = !state.doneLast; localStorage.doneSort = state.doneLast ? 'bottom' : 'keep'; render(); };
  $('btnCollapse').onclick = () => { state.collapse = !state.collapse; localStorage.collapse = state.collapse ? '1' : '0'; state.expanded.clear(); render(); };
  $('btnPrint').onclick = () => { setView('daily'); print(); };
  $('btnReload').onclick = () => load();
  // A4 한 장 맞춤: 인쇄 폭(194mm)으로 잰 높이가 한 장(281mm)을 넘으면 그만큼 축소
  addEventListener('beforeprint', () => {
    if (state.view !== 'daily') setView('daily');
    document.documentElement.classList.add('printing');
    // 마케팅 공통 업무도 같은 A4에: 진행 중 + 이날 완료한 것만 보고서 끝에 붙였다가 인쇄 후 제거
    const list = state.shared.filter(r => r.section === '공통업무' && (!isDone(r) || String(r.completed || r.date).slice(0, 10) === state.sel));
    if (list.length && !isDirector()) $('report').append(el(`<section class="sec print-shared"><h3>마케팅 공통 업무 <small class="sec-count">${list.filter(isDone).length}/${list.length}</small></h3><div class="task-list">${list.map(r => `<div class="row${isDone(r) ? ' done' : ''}"><span class="pst">${statusIcon(statusCode(r.status))}</span><div class="tx">${esc(r.text)}</div></div>`).join('')}</div></section>`));
    const mm = 96 / 25.4, h = $('report').scrollHeight;
    document.documentElement.style.setProperty('--print-zoom', Math.min(1, (279 * mm) / h).toFixed(3));
    document.documentElement.style.setProperty('--print-zoom2', Math.min(1, (279 * mm) / $('donePage').scrollHeight).toFixed(3));
  });
  addEventListener('afterprint', () => { document.documentElement.classList.remove('printing'); document.querySelectorAll('.print-shared').forEach(n => n.remove()); });
  /* ---------- 공통 캘린더 · 공통 업무 (아르스킨 공통 시트, 모든 사람 보고서 상단에 동일하게 표시) ---------- */
  const SHARED = '공통';
  const weekStart = d => { const x = new Date(d + 'T00:00:00'); x.setDate(x.getDate() - (x.getDay() + 6) % 7); return iso(x); };
  // 옛 배포(v1)는 who 를 무시하고 전성환 시트에 쓰므로, v2 확인 전에는 다른 사람·공통 데이터를 막는다
  let backendOk = null;
  const checkBackend = async () => backendOk ??= await api.get({ action: 'ping' }).then(j => j.v >= 2).catch(() => false);
  async function loadShared() {
    const anchor = state.sharedAnchor || state.sel, ws = weekStart(anchor);
    const monthEnd = iso(new Date(+anchor.slice(0, 4), +anchor.slice(5, 7), 0));
    const dir = isDirector(), owner = dir ? DIRECTOR_WHO : SHARED;
    const from = ['2026-10-01', ws].sort()[0], to = [monthEnd, shiftDate(ws, 6), todayKst()].sort().pop();
    const requested = anchor;

    const sk = `shared:${owner}:${from}:${to}`, sc = cacheGet(sk);
    if (sc && !state.shared.length) { state.shared = sc.map(r => ({ ...r, _who: owner })); renderShared(); }
    try { const result = await api.get({ who: owner, from, to }); if (requested !== (state.sharedAnchor || state.sel) || dir !== isDirector()) return; const rows = result.rows.filter(r => !dir || r.section === '원장님일정'); cacheSet(sk, rows); state.shared = rows.map(r => ({ ...r, _who: owner })); }
    catch (e) { toast('공통 데이터 불러오기 실패: ' + e.message); return; }
    renderShared();
  }
  // 캘린더 일정: 0.8초 꾹 누르면 들려서 다른 날짜 칸에 놓을 수 있다 (짧게 누르면 편집)
  function longPressMove(e, wrap, r) {
    if (e.button !== 0) return;
    const x0 = e.clientX, y0 = e.clientY; let ghost = null, over = null;
    const cancel = () => { clearTimeout(timer); removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); };
    const timer = setTimeout(() => {
      wrap.dragged = true; wrap.classList.add('lifting'); navigator.vibrate?.(15);
      ghost = wrap.cloneNode(true); ghost.className = 'sc-ev-wrap sc-drag-ghost'; const b = wrap.getBoundingClientRect();
      Object.assign(ghost.style, { width: b.width + 'px', left: b.left + 'px', top: b.top + 'px' }); document.body.append(ghost);
    }, 800);
    const move = ev => {
      if (!ghost) { if (Math.hypot(ev.clientX - x0, ev.clientY - y0) > 8) cancel(); return; } // 누르는 중 움직이면 취소(스크롤)
      ev.preventDefault();
      ghost.style.left = ev.clientX - 20 + 'px'; ghost.style.top = ev.clientY - 14 + 'px';
      ghost.hidden = true; const day = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('.sc-day[data-date]:not(.sc-outside)'); ghost.hidden = false;
      if (over !== day) { over?.classList.remove('drop-on'); over = day; over?.classList.add('drop-on'); }
    };
    const up = () => {
      cancel(); if (!ghost) return;
      ghost.remove(); wrap.classList.remove('lifting'); over?.classList.remove('drop-on');
      const to = over?.dataset.date;
      if (to && to !== r.date) {
        const from = r.date;
        if (from.slice(0, 7) !== to.slice(0, 7)) removeIds([from + '|' + r.id], r._who); // 월 탭이 바뀌면 옛 탭에서 지우고 새 탭에 저장
        updateRow(r, { date: to }); toast(`${to.slice(5).replace('-', '/')}로 옮겼습니다`);
      }
      renderShared(); renderTimeline();
    };
    addEventListener('pointermove', move, { passive: false }); addEventListener('pointerup', up); addEventListener('pointercancel', up);
  }
  // 달 고르기 팝업: 연도 ‹ › + 12개월
  function openMonthPicker(anchorEl, anchor, go) {
    document.querySelector('.month-pop')?.remove();
    let y = +anchor.slice(0, 4);
    const pop = el('<div class="month-pop range-pop" role="dialog" aria-label="달 고르기"></div>'); document.body.append(pop);
    const r = anchorEl.getBoundingClientRect(); pop.style.top = r.bottom + 6 + 'px'; pop.style.left = Math.max(8, Math.min(innerWidth - 300, r.left + r.width / 2 - 150)) + 'px';
    const close = () => { pop.remove(); removeEventListener('pointerdown', out, true); }, out = e => { if (!pop.contains(e.target) && e.target !== anchorEl) close(); };
    addEventListener('pointerdown', out, true);
    const paint = () => { pop.innerHTML = `<div class="rp-head"><button type="button" data-y="-1" aria-label="이전 해">‹</button><b>${y}년</b><button type="button" data-y="1" aria-label="다음 해">›</button></div><div class="mp-grid">${Array.from({ length: 12 }, (_, i) => `<button type="button" data-mo="${i + 1}" class="${y === +anchor.slice(0, 4) && i + 1 === +anchor.slice(5, 7) ? 'edge' : ''}">${i + 1}월</button>`).join('')}</div>`; };
    pop.onclick = e => { const yb = e.target.closest('[data-y]'); if (yb) { y += +yb.dataset.y; return paint(); } const m = e.target.closest('[data-mo]'); if (m) { close(); go(`${y}-${String(m.dataset.mo).padStart(2, '0')}-01`); } };
    paint(); pop.querySelector('.edge, [data-mo]')?.focus();
  }
  // 연월차: 공통 시트 leaves 탭
  const LEAVE_KINDS = ['연차', '오전 반차', '오후 반차'];
  async function loadLeaves() { try { state.leaves = (await api.get({ action: 'leaves' })).leaves || []; renderShared(); if (state.view === 'team') renderTeam(); } catch {} }
  async function leaveEdit(body) { try { state.leaves = (await api.post(body)).leaves || []; toast(body.action === 'leaveAdd' ? `${body.kind} 등록했습니다` : '취소했습니다'); } catch (e) { toast(e.message); } renderShared(); if (state.view === 'team') renderTeam(); }
  // 주간↔월간: 높이를 이전 값에서 새 값으로 부드럽게 (모션 줄이기면 즉시)
  function switchCalMode(mode) {
    const cal = $('sharedcal'), h0 = cal.offsetHeight;
    state.sharedMode = mode; try { localStorage.sharedMode = mode; } catch {}
    renderShared(); loadShared();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const h1 = cal.offsetHeight;
    cal.animate([{ height: h0 + 'px', overflow: 'hidden' }, { height: h1 + 'px', overflow: 'hidden' }], { duration: 320, easing: 'cubic-bezier(.2,0,0,1)' });
  }
  function renderShared() {
    const cal = $('sharedcal'), tasks = $('sharedtasks');
    if (!cal) return;
    if (backendOk === false) { cal.innerHTML = '<div class="sc-head"><b>공통 캘린더</b><small>Apps Script를 새 버전으로 재배포하면 켜집니다</small></div>'; tasks.hidden = true; return; }
    const dir = isDirector(), N = dir ? 7 : 5, EV = dir ? '원장님일정' : '일정', OWNER = dir ? DIRECTOR_WHO : SHARED; // 원장님: 월~일, 자기 시트의 일정
    tasks.hidden = dir;
    const anchor = state.sharedAnchor || state.sel, ws = weekStart(anchor), today = todayKst();
    const monthly = state.sharedMode === 'month', month = anchor.slice(0, 7);
    cal.classList.toggle('sc-collapsed', state.sharedCollapsed);
    cal.classList.toggle('sc-month-view', monthly);
    cal.innerHTML = `<div class="sc-header"><div><b>${dir ? '원장님 캘린더' : '마케팅 공용 캘린더'}</b><small>${monthly ? month.replace('-', '년 ') + '월' : ws.slice(5).replace('-', '.') + ' ~ ' + shiftDate(ws, N - 1).slice(5).replace('-', '.')} · ${dir ? '월~일' : '월~금'}</small></div><div class="sc-mode" role="group" aria-label="캘린더 보기"><button data-mode="week" aria-pressed="${!monthly}">주간</button><button data-mode="month" aria-pressed="${monthly}">월간</button></div></div>`;
    const who = el(`<div class="sc-who" role="group" aria-label="담당자 필터">${['', ...C.PEOPLE.filter(p => !p.director).map(p => p.name)].map(n => `<button type="button" data-who="${esc(n)}" aria-pressed="${state.calWho === n}">${n ? esc(disp(n)) : '전체'}</button>`).join('')}</div>`);
    who.onclick = e => { const b = e.target.closest('[data-who]'); if (!b) return; state.calWho = b.dataset.who; try { localStorage.calWho = state.calWho; } catch {} renderShared(); };
    if (!dir) cal.querySelector('.sc-header').after(who);
    cal.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => switchCalMode(b.dataset.mode));
    const body = el('<div class="sc-body" id="sharedCalendarBody"></div>');
    // ‹ [2026년 11월] › 오늘 — 가운데 버튼을 누르면 달 고르기
    const nav = el(`<div class="sc-navigation"><span class="sc-nav-mid"><button type="button" class="sc-prev" aria-label="이전 ${monthly ? '달' : '주'}">‹</button><button type="button" class="sc-month-btn" aria-haspopup="dialog" aria-label="달 고르기">${+anchor.slice(0, 4)}년 ${+anchor.slice(5, 7)}월${monthly ? '' : ` <small>${ws.slice(5).replace('-', '.')}~${shiftDate(ws, N - 1).slice(5).replace('-', '.')}</small>`} ▾</button><button type="button" class="sc-next" aria-label="다음 ${monthly ? '달' : '주'}">›</button><button type="button" class="sc-today">오늘</button></span>${dir ? '' : `<button type="button" class="sc-leave-toggle" aria-expanded="${!!state.leaveOpen || !!state.leaveMode}">휴가 등록</button><span class="sc-leave-btns" role="group" aria-label="연차 등록"${state.leaveOpen || state.leaveMode ? '' : ' hidden'}>${LEAVE_KINDS.map(k => `<button type="button" data-leave="${k}" aria-pressed="${state.leaveMode === k}">${k}</button>`).join('')}</span>`}</div>`);
    const go = a => { state.sharedAnchor = a; renderShared(); loadShared(); };
    nav.querySelector('.sc-prev').onclick = () => go(monthly ? iso(new Date(+anchor.slice(0, 4), +anchor.slice(5, 7) - 2, 1)) : shiftDate(ws, -7));
    nav.querySelector('.sc-next').onclick = () => go(monthly ? iso(new Date(+anchor.slice(0, 4), +anchor.slice(5, 7), 1)) : shiftDate(ws, 7));
    nav.querySelector('.sc-today').onclick = () => go(today);
    nav.querySelector('.sc-leave-toggle')?.addEventListener('click', () => { state.leaveOpen = !state.leaveOpen; if (!state.leaveOpen) state.leaveMode = null; renderShared(); });
    nav.querySelector('.sc-month-btn').onclick = e => openMonthPicker(e.currentTarget, anchor, go);
    nav.querySelectorAll('[data-leave]').forEach(b => b.onclick = () => { state.leaveMode = state.leaveMode === b.dataset.leave ? '' : b.dataset.leave; renderShared(); if (state.leaveMode) toast(`${state.leaveMode}: 캘린더에서 날짜를 누르세요 (다시 누르면 취소)`); });
    body.append(nav);
    const grid = el(`<div class="sc-week${monthly ? ' sc-month' : ''}${dir ? ' sc-7' : ''}" role="group" aria-label="${monthly ? '월간' : '주간'} 평일 일정"></div>`);
    const dates = [];
    if (monthly) {
      const first = month + '-01', end = iso(new Date(+anchor.slice(0, 4), +anchor.slice(5, 7), 0));
      const lastWeek = weekStart(end);
      for (let w = weekStart(first); w <= lastWeek; w = shiftDate(w, 7)) for (let i = 0; i < N; i++) dates.push(shiftDate(w, i));
    } else for (let i = 0; i < N; i++) dates.push(shiftDate(ws, i));
    dates.forEach(d => {
      const dt = new Date(d + 'T00:00:00'), outside = monthly && !d.startsWith(month);
      const col = el(`<div class="sc-day${d === today ? ' today' : ''}${d === state.sel ? ' sel' : ''}${outside ? ' sc-outside' : ''}" data-date="${d}"><button type="button" class="sc-date" aria-label="${d} 보고서 보기"><span>${WD[dt.getDay()]}</span><b>${dt.getDate()}</b>${state.holidays[d] ? `<em class="sc-hol">${esc(state.holidays[d].name)}</em>` : ''}</button></div>`);
      if (!dir) state.leaves.filter(l => l.date === d).forEach(l => {
        const chip = el(`<button type="button" class="sc-leave k-${LEAVE_KINDS.indexOf(l.kind)}" title="${esc(disp(l.who))} ${esc(l.kind)}${l.memo ? ' · ' + esc(l.memo) : ''} (누르면 취소)">${esc(disp(l.who))} ${esc(l.kind.replace(' 반차', '반차'))}</button>`);
        chip.onclick = e => { e.stopPropagation(); if (confirm(`${disp(l.who)} ${d} ${l.kind}를 취소할까요?`)) leaveEdit({ action: 'leaveDelete', id: l.id }); };
        col.append(chip);
      });
      if (state.leaveMode && !dir) { col.classList.add('leave-pick'); col.onclick = e => { if (e.target.closest('.sc-leave')) return; leaveEdit({ action: 'leaveAdd', date: d, kind: state.leaveMode, who: state.person }); state.leaveMode = ''; }; }
      col.querySelector('.sc-date').onclick = () => { // 캘린더 → 그날 보고서
        if (!state.dates.includes(d)) return toast('보고서는 최근 근무일 5일만 볼 수 있습니다');
        state.sel = d; render(); $('report').scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
      if (state.holidays[d] || dt.getDay() === 0) col.classList.add('holiday'); if (dt.getDay() === 6) col.classList.add('sat');
      if (!outside) {
        state.shared.filter(r => r.section === EV && r.date === d && (dir || !state.calWho || r.col === state.calWho)).sort((a, b) => (a.start || '').localeCompare(b.start || '')).forEach(r => {
          const wrap = el(`<div class="sc-ev-wrap${isDone(r) ? ' done' : ''}${isExt(r) ? ' ext' : ''}"><input type="checkbox" aria-label="${esc(r.text)} 완료"${isDone(r) ? ' checked' : ''}><button class="sc-ev"><small>${esc(r.start || '시간 미정')}${r.end ? '–' + esc(r.end) : ''}${ruleOf(r) ? ' <span class="rep" title="반복 일정">↻</span>' : ''}${isExt(r) ? ' <em class="ext-badge">외부</em>' : ''}</small><span>${esc(r.text)}</span></button></div>`);
          const ev = wrap.querySelector('.sc-ev');
          ev.title = `${r.start || ''}${r.end ? '~' + r.end : ''} ${r.text}${r.col ? ' · ' + disp(r.col) : ''}`;
          ev.onclick = () => { if (!wrap.dragged) openEditor(r, ev); wrap.dragged = false; };
          ev.onpointerdown = e => longPressMove(e, wrap, r);
          wrap.querySelector('input').onchange = e => { if (e.target.checked) confetti(e.target); updateRow(r, { status: e.target.checked ? 'done' : '' }); spawnNext(r); renderShared(); renderTimeline(); };
          col.append(wrap);
        });
        const add = el(`<button class="sc-add" title="${d} 일정 추가" aria-label="${d} 일정 추가">+</button>`);
        add.onclick = () => openEditor({ date: d, section: EV, col: dir ? '' : state.person, ...nearSlot(), text: '', _who: OWNER }, add, true);
        col.append(add);
      }
      grid.append(col);
    });
    body.append(grid);
    const notes = state.shared.filter(r => r.section === '일정메모' && (monthly ? r.date.startsWith(month) : r.date >= ws && r.date <= shiftDate(ws, N - 1)));
    if (notes.length) { const box = el('<div class="sc-notes"><h4>날짜 확인이 필요한 회의 일정</h4></div>'); notes.forEach(r => box.append(itemRow(r, { noStatus: true }))); body.append(box); }
    const grip = el(`<button type="button" class="sc-grip" aria-label="${monthly ? '주간으로 접기' : '월간으로 펼치기'}" title="끌거나 눌러서 주간·월간 전환"><span></span></button>`);
    grip.onpointerdown = e => {
      const y0 = e.clientY; let moved = false; grip.setPointerCapture(e.pointerId);
      grip.onpointermove = ev => { const dy = ev.clientY - y0; if (Math.abs(dy) > 8) moved = true; cal.style.setProperty('--pull', Math.max(-60, Math.min(60, dy)) + 'px'); };
      grip.onpointerup = ev => {
        grip.onpointermove = grip.onpointerup = null; cal.style.removeProperty('--pull');
        const dy = ev.clientY - y0, want = !moved ? (monthly ? 'week' : 'month') : dy > 40 ? 'month' : dy < -40 ? 'week' : state.sharedMode;
        if (want !== state.sharedMode) switchCalMode(want);
      };
    };
    const toggle = el(`<button class="sc-toggle" aria-controls="sharedCalendarBody" aria-expanded="${!state.sharedCollapsed}"><span class="sc-handle" aria-hidden="true"></span><span>${state.sharedCollapsed ? '일정 펼치기 ⌄' : '일정 접기 ⌃'}</span></button>`);
    toggle.onclick = () => { state.sharedCollapsed = !state.sharedCollapsed; localStorage.sharedCollapsed = state.sharedCollapsed ? '1' : '0'; renderShared(); };
    cal.append(body, grip, toggle);
    const open = state.sharedTasksOpen;
    tasks.innerHTML = `<h3><button type="button" class="sec-toggle" aria-expanded="${open}">공통 업무 <small class="sec-count"></small><span class="chev" aria-hidden="true">${open ? '접기' : '펼치기'}</span></button></h3>`;
    tasks.querySelector('.sec-toggle').onclick = () => { state.sharedTasksOpen = !open; try { localStorage.sharedTasksOpen = open ? '0' : '1'; } catch {} renderShared(); };
    tasks.classList.toggle('folded', !open);
    // 탭: 변동 업무(공통업무) / 반복 업무(공통반복 — 끝내도 다음 날 다시 '시작 전'으로)
    const DONE_TAB = state.sharedTab === '완료', SEC = state.sharedTab === '반복' ? '공통반복' : '공통업무'; // 완료 탭: 변동·반복에서 끝낸 업무를 모아 봄
    const tabs = el(`<div class="seg shared-tabs" role="tablist">${[['변동', '공통업무', '변동 업무'], ['반복', '공통반복', '반복 업무'], ['완료', '', '완료']].map(([k, sec, l]) => `<button type="button" role="tab" data-st="${k}" aria-selected="${(state.sharedTab || '변동') === k}" class="${(state.sharedTab || '변동') === k ? 'active' : ''}">${l}</button>`).join('')}</div>`);
    tabs.onclick = e => { const b = e.target.closest('[data-st]'); if (!b) return; state.sharedTab = b.dataset.st; state.sharedCat = ''; try { localStorage.sharedTab = state.sharedTab; } catch {} renderShared(); };
    tasks.append(tabs);
    // 일일보고에 반복 기록된 업무는 가장 최근 상태를 표시하고 원본 이력은 시트에 보존한다.
    const latest = new Map();
    // 장식용 앞 기호와 공백만 무시한다. 내용이 다른 업무는 각각 유지한다.
    const taskKey = text => text.normalize('NFKC').replace(/^[^\p{L}\p{N}]+/u, '').replace(/\s+/g, '').toLocaleLowerCase('ko');
    state.shared.filter(r => (DONE_TAB ? ['공통업무', '공통반복'].includes(r.section) : r.section === SEC) && r.date <= state.sel && taskKey(r.text))
      .sort((a, b) => a.date.localeCompare(b.date) || (a.updated || '').localeCompare(b.updated || '') || a.id.localeCompare(b.id))
      .forEach(r => latest.set(taskKey(r.text), r));
    if (SEC === '공통반복' && !DONE_TAB) latest.forEach((r, k) => { // 지난날 끝낸 반복 업무는 오늘 '시작 전' 새 행으로 보여준다(누르기 전엔 저장 안 함)
      if (r.date < state.sel && isDone(r)) { const v = { ...r, id: newId(state.sel), date: state.sel, status: 'todo', completed: '', origin: r.origin || r.id }; state.shared.push(v); latest.set(k, v); }
    });
    const list = el('<div class="shared-task-grid" role="group" aria-label="공통 업무 목록"></div>');
    const latestRows = [...latest.values()], lateS = r => state.doneLast && isDone(r) && !sortHold.has(r.id);
    const catOf = r => r.text.match(CAT_RE)?.[1] || '';
    const cats = [...new Set(latestRows.map(catOf).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ko'));
    // 카테고리 정렬·필터: '전체'는 카테고리 이름순으로 묶어 보여주고, 칩을 누르면 그 카테고리만
    const bar = el(`<div class="cat-bar" role="group" aria-label="카테고리 필터">${['', ...cats].map(c => `<button type="button" data-cat="${esc(c)}" aria-pressed="${state.sharedCat === c}">${c ? esc(c) : '전체'}</button>`).join('')}</div>`);
    bar.onclick = e => { const b = e.target.closest('[data-cat]'); if (!b) return; state.sharedCat = b.dataset.cat; renderShared(); };
    if (cats.length) tasks.append(bar);
    const shown = latestRows.filter(r => (DONE_TAB ? isDone(r) : !isDone(r) || sortHold.has(r.id)) && (!state.sharedCat || catOf(r) === state.sharedCat)).sort((a, b) => (catOf(a) || '\uffff').localeCompare(catOf(b) || '\uffff', 'ko')); // 분류 없는 업무는 뒤로
    // '완료 업무 접기'도 공통 업무에 적용: 완료한 줄은 숨기고 '완료 N건 보기'
    const fold = state.collapse && !state.expanded.has('shared:' + SEC); let hiddenN = 0;
    (state.doneLast ? rankSort(shown) : shown).forEach(r => { const n = itemRow(r); if (fold && isDone(r) && !sortHold.has(r.id)) { n.classList.add('collapsed'); hiddenN++; } list.append(n); });
    if (hiddenN) { const m = el(`<button class="more shared-more">… 완료 ${hiddenN}건 보기</button>`); m.onclick = () => { state.expanded.add('shared:' + SEC); renderShared(); }; list.append(m); }
    else if (state.collapse && state.expanded.has('shared:' + SEC) && shown.some(isDone)) { const m = el('<button class="more shared-more">▲ 완료 접기</button>'); m.onclick = () => { state.expanded.delete('shared:' + SEC); renderShared(); }; list.append(m); }
    tasks.querySelector('.sec-count').textContent = DONE_TAB ? `${shown.length}건 완료` : `${[...latest.values()].filter(r => !isDone(r)).length}건 진행`;
    if (!shown.length) list.append(el(`<p class="muted shared-empty">${DONE_TAB ? '완료한 공통 업무가 없습니다.' : '진행할 업무가 없습니다.'}</p>`));
    tasks.append(list);
    // 등록할 때 카테고리를 고르거나 새로 입력 → '분류) 내용' 형식으로 저장
    const form = el(`<form class="cat-add"><input class="cat-in" list="catList" placeholder="분류(선택)" aria-label="카테고리 (선택)" value="${esc(state.sharedCat)}" maxlength="12"><datalist id="catList">${cats.map(c => `<option value="${esc(c)}">`).join('')}</datalist><input class="txt-in" placeholder="+ 공통 업무 추가 (Enter)" aria-label="공통 업무 내용"><button type="submit" hidden>추가</button></form>`);
    form.onsubmit = e => {
      e.preventDefault(); const [ci, ti] = form.querySelectorAll('input'); const t = ti.value.trim(); if (!t) return;
      const c = ci.value.trim().replace(/[)\s]/g, '');
      addRow({ date: today, section: SEC, col: state.person, text: c ? `${c}) ${t}` : t, status: 'todo', _who: SHARED }); render();
      document.querySelector('.cat-add .txt-in')?.focus();
    };
    form.querySelector('.txt-in').onkeydown = e => { if (e.isComposing) e.stopPropagation(); if (e.key === 'Escape') e.target.value = ''; };
    if (!DONE_TAB) tasks.append(form);
  }
  setInterval(() => { if (!document.hidden) loadShared(); }, 60000); // 다른 팀원 변경분 반영
  addEventListener('focus', () => loadShared());

  const setHolidays = list => { state.holidays = {}; (list || []).forEach(h => { state.holidays[h.date] = h; }); };
  // 설정: 휴일 관리(관리자=미스타전 코드만 추가·삭제, 나머지는 보기)
  function renderSettings() {
    const box = $('settingsHub'), adm = state.admin, y = todayKst().slice(0, 4);
    const list = Object.values(state.holidays).filter(h => h.date >= y).sort((a, b) => a.date < b.date ? -1 : 1);
    box.innerHTML = `<div class="dir-head"><h1>설정</h1><p>${adm ? '관리자(미스타전)로 접속했습니다. 휴일을 추가·삭제할 수 있습니다.' : '휴일 추가·삭제는 관리자(미스타전)만 할 수 있습니다. 여기서는 볼 수만 있습니다.'}</p></div>
      <section class="sec"><h3>휴일 관리 <small class="sec-count">${list.length}일</small></h3><p class="muted">공휴일은 Google 캘린더에서 자동으로 가져옵니다(노동절 제외). 회사 휴무일만 직접 추가하세요.</p>
      ${adm ? '<form class="hol-add"><input type="date" required aria-label="날짜"><input placeholder="이름 (예: 창립기념일)" aria-label="휴일 이름" maxlength="40"><button class="primary">추가</button></form>' : ''}
      <ul class="hol-list">${list.map(h => `<li><span>${h.date.slice(2).replace(/-/g, '.')} (${WD[new Date(h.date + 'T00:00:00').getDay()]})</span><b>${esc(h.name)}</b>${h.source === 'manual' && adm ? `<button type="button" data-date="${h.date}" aria-label="${esc(h.name)} 삭제">${icon('x', 14)}</button>` : `<small>${h.source === 'manual' ? '회사 휴무' : '공휴일'}</small>`}</li>`).join('')}</ul></section>
      <section class="sec"><h3>메뉴</h3><p class="muted">사이드바 아래 '메뉴 순서 편집'으로 대메뉴 순서를 바꿀 수 있습니다(브라우저마다 저장).</p></section>`;
    const edit = async body => { try { setHolidays((await api.post(body)).holidays); state.dates = workDates(C.DAYS); renderSettings(); render(); } catch (e) { toast(e.message); } };
    const f = box.querySelector('.hol-add'); if (f) f.onsubmit = e => { e.preventDefault(); const [d, n] = f.querySelectorAll('input'); edit({ action: 'holidayAdd', date: d.value, name: n.value }); };
    box.querySelector('.hol-list').onclick = e => { const b = e.target.closest('[data-date]'); if (b) edit({ action: 'holidayDelete', date: b.dataset.date }); };
  }
  function openHolidays() {
    const dlg = el(`<dialog class="code-dlg hol-dlg" aria-labelledby="holTitle"><h2 id="holTitle">휴일 관리</h2><p>공휴일은 Google 캘린더에서 자동으로 가져옵니다. 회사 휴무일만 직접 추가하세요.</p>
      <form class="hol-add"><input type="date" required aria-label="날짜"><input placeholder="이름 (예: 창립기념일)" aria-label="휴일 이름" maxlength="40"><button class="primary">추가</button></form><ul class="hol-list"></ul><button type="button" class="hol-close">닫기</button></dialog>`);
    const list = dlg.querySelector('.hol-list'), [dIn, nIn] = dlg.querySelectorAll('input');
    const paint = () => { list.innerHTML = Object.values(state.holidays).filter(h => h.date >= todayKst().slice(0, 4)).sort((a, b) => a.date < b.date ? -1 : 1)
      .map(h => `<li><span>${h.date.slice(5).replace('-', '.')} (${WD[new Date(h.date + 'T00:00:00').getDay()]})</span><b>${esc(h.name)}</b>${h.source === 'manual' ? `<button type="button" data-date="${h.date}" aria-label="${esc(h.name)} 삭제">${icon('x', 14)}</button>` : '<small>공휴일</small>'}</li>`).join(''); };
    const edit = async body => { try { setHolidays((await api.post(body)).holidays); paint(); state.dates = workDates(C.DAYS); render(); } catch (e) { toast(e.message); } };
    dlg.querySelector('form').onsubmit = e => { e.preventDefault(); edit({ action: 'holidayAdd', date: dIn.value, name: nIn.value }); nIn.value = ''; };
    list.onclick = e => { const b = e.target.closest('[data-date]'); if (b) edit({ action: 'holidayDelete', date: b.dataset.date }); };
    dlg.querySelector('.hol-close').onclick = () => dlg.close();
    dlg.onclose = () => dlg.remove();
    document.body.append(dlg); paint(); dlg.showModal();
  }
  // 빠르게 보이기: 마지막으로 받은 데이터를 브라우저에 두고 먼저 그린 뒤, 서버 응답이 오면 바뀐 것만 다시 그린다
  const cacheGet = k => { try { return JSON.parse(localStorage['c:' + k] || 'null'); } catch { return null; } };
  const cacheSet = (k, v) => { try { localStorage['c:' + k] = JSON.stringify(v); } catch {} };
  function applyBoot(j) {
    setHolidays(j.holidays); state.tags = Object.fromEntries((j.tags || []).map(t => [t.tag, t])); state.deletedTags = j.deletedTags || []; state.leaves = j.leaves || [];
    document.querySelectorAll('[data-team="check"]').forEach(b => { b.hidden = j.me === DIRECTOR_WHO; });
    state.dir = { tasks: j.tasks || [], me: j.me || '' }; state.admin = !!j.admin; document.querySelector('.gear').hidden = !state.admin; // 설정은 관리자(미스타전)만
  }
  async function boot() { // 휴일·태그·연차·원장님 숙제·내 이름을 한 번에
    const c = cacheGet('boot'); if (c) applyBoot(c);
    try { const j = await api.get({ action: 'boot' }); applyBoot(j); cacheSet('boot', j); }
    catch { if (!c) await api.get({ action: 'holidays' }).then(j => setHolidays(j.holidays)).catch(() => {}); loadDirector(); loadTags(); loadLeaves(); } // 옛 서버
    paintDirBadge(); if (!loadDirector.checked) { loadDirector.checked = true; bossCheck(); }
    const mine = C.PEOPLE.find(p => p.name === state.dir.me && !p.director); // 접속한 사람의 일일보고를 먼저
    if (mine && !boot.moved && state.person !== mine.name && !isDirector()) { boot.moved = true; state.person = mine.name; state.rows = []; state.sel = null; renderPeople(); load(); }
    if (state.view === 'home') renderHome(); if (state.view === 'team') renderTeam();
  }
  async function load() {
    if (!state.holidays) { state.holidays = {}; await boot(); }
    state.dates = workDates(C.DAYS); state.sel = state.sel || state.dates[state.dates.length - 1];
    renderPeople(); loadShared();
    $('sheetLink').href = `https://docs.google.com/spreadsheets/d/${personInfo().sheet}/edit`;
    if (false) { // 옛 서버(v1) 확인은 더 이상 필요 없음
      state.rows = []; renderDatestrip(); $('timeline').innerHTML = '';
      $('report').innerHTML = `<div class="empty-note"><b>${esc(disp(state.person))}</b>님 시트는 연결됐지만 Apps Script가 옛 버전입니다.<br><small>apps-script/Code.gs 를 붙여넣고 새 버전으로 재배포하면 열립니다.</small></div>`;
      return;
    }
    if (!personInfo().sheet) { // 시트 미연결: 다른 사람 데이터를 실수로 보여주지 않도록 요청 자체를 안 보낸다
      state.rows = []; renderDatestrip(); $('timeline').innerHTML = '';
      $('report').innerHTML = `<div class="empty-note"><b>${esc(disp(state.person))}</b>님 일일보고 시트가 아직 연결되지 않았습니다.<br><small>공유 시트 링크를 전달해 주시면 연결됩니다.</small></div>`;
      return;
    }
    const asked = state.person;
    const ck = `rows:${state.person}:${state.dates[0]}`, cached = cacheGet(ck);
    if (cached) { state.rows = cached; render(); } else $('report').innerHTML = '<div class="empty-note">불러오는 중…</div>';
    try { const rows = (await api.get({ from: state.dates[0], to: state.dates[state.dates.length - 1] })).rows; if (asked !== state.person) return;
      cacheSet(ck, rows); if (cached && JSON.stringify(cached) === JSON.stringify(rows)) { afterLoad(asked); return; } state.rows = rows; }
    catch (e) { $('report').innerHTML = `<div class="empty-note">데이터를 불러오지 못했습니다.<br><small>${esc(e.message)}</small><br><small>config.js 의 API_URL 과 Apps Script 배포(액세스: 모든 사용자)를 확인하세요.</small></div>`; return; }
    render(); afterLoad(asked);
  }
  function afterLoad(asked) {
    const today = todayKst(); // 00:05 트리거가 못 돌았을 때 보완 생성 (서버가 멱등 처리)
    if (isWorkday(today) && !state.rows.some(r => r.date === today)) api.post({ action: 'generate', date: today }).then(j => { if (j.rows?.length && asked === state.person) { state.rows.push(...j.rows); render(); } }).catch(() => {});
    const rp = cacheGet('reelsPlan'); if (rp && !state.reelPlan.length) { state.reelPlan = rp; renderReport(); }
    api.get({ action: 'reelsPlan' }).then(j => { state.reelPlan = j.items || []; cacheSet('reelsPlan', state.reelPlan); if (asked === state.person) renderReport(); }).catch(() => {});
    loadContentLinks();
    api.get({ action: 'calendar' }).then(j => { state.calendar = parseCalendar(j.grid); renderReport(); }).catch(() => {}); // 홈에 있을 때 도착해도 보고서에 반영
  }
  /* ---------- 원장님 숙제 (마케터 → 원장님) ---------- */
  const DIR_ST = { pending: '대기', approved: '승인', rejected: '거절', done: '완료' };
  const DIRECTOR = '원장님';
  const dirSeen = () => { try { return localStorage.dirSeen || ''; } catch { return ''; } };
  // 알림: 내가 쓴 숙제가 마지막으로 본 뒤 승인·거절되면 메뉴에 숫자 배지
  const dirNews = () => state.dir.tasks.filter(t => t.author === state.dir.me && (t.status === 'approved' || t.status === 'rejected') && t.updated > dirSeen());
  function paintDirBadge() {
    const n = state.view === 'director' ? 0 : dirNews().length;
    document.querySelectorAll('.nav-badge').forEach(b => { b.textContent = n; b.classList.toggle('hidden', !n); b.setAttribute('aria-label', `새 결과 ${n}건`); });
  }
  async function loadDirector() {
    try { const j = await api.get({ action: 'director' }); state.dir = { tasks: j.tasks || [], me: j.me || '' }; } catch { return; }
    if (!loadDirector.checked) { loadDirector.checked = true; bossCheck(); }
    if (state.view === 'director') renderDirector(); else { paintDirBadge(); if (state.view === 'home') renderHome(); }
  }
  async function saveDirector(body) {
    try { state.dir.tasks = (await api.post(body)).tasks; } catch (e) { toast(e.message); }
    renderDirector();
  }
  function renderDirector() {
    const box = $('directorHub'), { tasks, me } = state.dir, isDir = me === DIRECTOR, seen = dirSeen();
    const count = k => tasks.filter(t => t.status === k).length;
    box.innerHTML = `<div class="seg mobile-only dir-seg"><button class="active">숙제 목록</button><button data-open-sheet>원장님 워크시트</button></div><div class="dir-head"><h1>원장님 숙제</h1><p>마케터가 원장님께 드리는 숙제입니다. 누구나 쓰고 고칠 수 있고, 승인·거절은 원장님만 할 수 있습니다.</p></div>
      <div class="dir-sum">${Object.keys(DIR_ST).map(k => `<span class="dir-pill d-${k}">${DIR_ST[k]} <b>${count(k)}</b></span>`).join('')}</div>
      <form class="dir-add"><input name="text" placeholder="원장님께 드릴 숙제" aria-label="숙제 내용" maxlength="500" required><input name="due" type="date" aria-label="마감일"><button class="primary">추가</button></form>`;
    box.querySelector('[data-open-sheet]').onclick = openDirSheet;
    const head = box.querySelector('.dir-head');
    if (isDir) {
      if ('Notification' in window && Notification.permission === 'default') { const b = el('<button type="button" class="primary nag-perm">🔔 알림 켜기</button>'); b.onclick = () => Notification.requestPermission().then(() => renderDirector()); head.append(b); }
    } else if (me) { const b = el('<button type="button" class="nudge-btn">🔥 원장님 재촉하기</button>'); b.onclick = nudgeBoss; head.append(b); }
    box.querySelector('form').onsubmit = e => { e.preventDefault(); const f = e.target; saveDirector({ action: 'directorSave', task: { text: f.text.value, due: f.due.value } }); };
    [['pending', '대기 중'], ['approved', '승인됨'], ['done', '완료'], ['rejected', '거절됨']].forEach(([k, label]) => {
      const list = tasks.filter(t => t.status === k).sort((a, b) => (b.updated > a.updated ? 1 : -1));
      if (!list.length) return;
      const g = el(`<section class="sec dir-group"><h3>${label} <small>${list.length}</small></h3></section>`);
      list.forEach(t => {
        const fresh = t.author === me && (k === 'approved' || k === 'rejected') && t.updated > seen;
        const meta = [`작성 ${esc(disp(t.author))}`, t.created.slice(5).replace('-', '.'), t.due && `마감 ${t.due.slice(5).replace('-', '.')}`, t.decided && k !== 'pending' && `결정 ${t.decided.slice(5).replace('-', '.')}`].filter(Boolean).join(' · ');
        const acts = [isDir && k === 'pending' && ['approved', '승인'], isDir && k === 'pending' && ['rejected', '거절'], k === 'approved' && ['done', '완료'], isDir && k !== 'pending' && ['pending', '대기로']].filter(Boolean);
        const it = el(`<div class="dir-item d-${k}${fresh ? ' fresh' : ''}"><span class="dir-pill d-${k}">${DIR_ST[k]}</span>
          <div class="dir-body"><div class="dir-text" contenteditable="plaintext-only" role="textbox" aria-label="숙제 내용"></div><small>${meta}${fresh ? ' · <b>새 결과</b>' : ''}</small></div>
          <div class="dir-acts">${acts.map(([st, l]) => `<button type="button" data-st="${st}">${l}</button>`).join('')}${isDir || t.author === me ? `<button type="button" class="dir-del" aria-label="삭제">${icon('x', 14)}</button>` : ''}</div></div>`);
        const tx = it.querySelector('.dir-text'); tx.textContent = t.text;
        tx.onblur = () => { const v = tx.textContent.trim(); if (v && v !== t.text) saveDirector({ action: 'directorSave', task: { id: t.id, text: v } }); };
        it.querySelectorAll('[data-st]').forEach(b => b.onclick = () => saveDirector({ action: 'directorSave', task: { id: t.id, status: b.dataset.st } }));
        it.querySelector('.dir-del')?.addEventListener('click', () => { if (confirm('이 숙제를 지울까요?')) saveDirector({ action: 'directorDelete', task: { id: t.id } }); });
        g.append(it);
      });
      box.append(g);
    });
    if (!tasks.length) box.append(el('<div class="empty-note">아직 숙제가 없습니다. 위에서 첫 숙제를 추가하세요.</div>'));
    try { localStorage.dirSeen = new Date().toISOString(); } catch {}
    paintDirBadge();
  }

  /* ---------- 단축키: N 새 업무, ? 도움말, Esc 닫기/취소 (입력 중에는 동작 안 함) ---------- */
  const typing = t => t.closest('input,textarea,select,[contenteditable]:not([contenteditable=false])');
  function openShortcuts() {
    if (document.querySelector('.keys-dlg')) return;
    const dlg = el(`<dialog class="code-dlg keys-dlg" aria-labelledby="keysTitle"><h2 id="keysTitle">단축키</h2><dl>
      <dt><kbd>N</kbd></dt><dd>변동업무에 새 업무 입력</dd><dt><kbd>Enter</kbd></dt><dd>입력·수정 저장</dd><dt><kbd>Shift</kbd>+<kbd>Enter</kbd></dt><dd>업무 내용 줄바꿈</dd>
      <dt><kbd>C</kbd></dt><dd>완료 업무 접기 / 펼치기</dd><dt><kbd>Esc</kbd></dt><dd>수정 취소, 창·메뉴 닫기</dd><dt><kbd>Space</kbd></dt><dd>상태 버튼에서 다음 상태로</dd><dt><kbd>Shift</kbd>+<kbd>F10</kbd></dt><dd>상태 선택 메뉴</dd><dt><kbd>?</kbd></dt><dd>이 도움말</dd></dl>
      <button type="button" class="primary">닫기</button></dialog>`);
    dlg.querySelector('button').onclick = () => dlg.close(); dlg.onclose = () => dlg.remove();
    document.body.append(dlg); dlg.showModal();
  }
  document.addEventListener('keydown', e => {
    if (e.isComposing || e.ctrlKey || e.metaKey || e.altKey || typing(e.target) || document.querySelector('dialog[open]')) return;
    if (e.key === '?') { e.preventDefault(); openShortcuts(); }
    if ((e.key === 'c' || e.key === 'C' || e.key === 'ㅊ') && !e.shiftKey) { e.preventDefault(); $('btnCollapse').click(); toast(state.collapse ? '완료 업무를 접었습니다 (C)' : '완료 업무를 펼쳤습니다 (C)'); }
    if ((e.key === 'n' || e.key === 'N' || e.key === 'ㅜ') && state.view === 'daily') {
      const i = document.querySelector('#sec-변동업무 .add input') || document.querySelector('#report .add input');
      if (i) { e.preventDefault(); i.scrollIntoView({ block: 'center' }); i.focus(); }
    }
    if (e.key === 'Escape') closeEditor();
  });

  /* ---------- 여러 업무 선택: 행의 빈 곳을 마우스로 끌어 범위 선택, Shift·Ctrl 클릭, Delete/Backspace 로 삭제 ---------- */
  const selRows = () => [...document.querySelectorAll('#sharedtasks .row[data-id], #report .row[data-id]')];
  const paintSel = () => selRows().forEach(n => n.classList.toggle('selected', state.selected.has(n.dataset.id)));
  const rowById = id => state.rows.find(r => r.id === id) || state.shared.find(r => r.id === id);
  // 다른 행으로 끌고 넘어가는 순간부터 행 범위 선택(글자 선택은 해제). 행 빈 곳 클릭은 한 행 선택.
  let selAnchor = null, selPending = false;
  document.addEventListener('pointerdown', e => {
    const row = e.target.closest('#report .row[data-id], #sharedtasks .row[data-id]');
    if (!row) { if (!e.target.closest('.st-menu,#appToast') && state.selected.size) { state.selected.clear(); paintSel(); } return; }
    if (e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest('button,input,.drag')) return;
    const id = row.dataset.id, all = selRows().map(n => n.dataset.id), onText = !!e.target.closest('.tx');
    if (e.shiftKey && selAnchor) { e.preventDefault(); const [a, b] = [all.indexOf(selAnchor), all.indexOf(id)].sort((x, y) => x - y); state.selected = new Set(all.slice(a, b + 1)); }
    else if (e.ctrlKey || e.metaKey) { e.preventDefault(); state.selected.has(id) ? state.selected.delete(id) : state.selected.add(id); selAnchor = id; }
    else { selAnchor = id; selPending = true; state.selected = onText ? new Set() : new Set([id]); }
    paintSel();
  });
  document.addEventListener('pointermove', e => {
    if (!selPending) return;
    const row = document.elementFromPoint(e.clientX, e.clientY)?.closest('#report .row[data-id], #sharedtasks .row[data-id]');
    if (!row || (row.dataset.id === selAnchor && !state.selected.size)) return;
    getSelection().removeAllRanges(); if (document.activeElement?.classList.contains('tx')) document.activeElement.blur();
    document.body.classList.add('row-selecting');
    const all = selRows().map(n => n.dataset.id), [a, b] = [all.indexOf(selAnchor), all.indexOf(row.dataset.id)].sort((x, y) => x - y);
    state.selected = new Set(all.slice(a, b + 1)); paintSel();
  });
  addEventListener('pointerup', () => { selPending = false; document.body.classList.remove('row-selecting'); });
  document.addEventListener('keydown', e => {
    if (!state.selected.size || typing(e.target) || document.querySelector('dialog[open]')) return;
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteRows([...state.selected].map(rowById).filter(Boolean)); render(); }
    if (e.key === 'Escape') { state.selected.clear(); paintSel(); }
  });

  /* ---------- 휴지통 ---------- */
  async function openTrash() {
    const dlg = el(`<dialog class="code-dlg trash-dlg" aria-labelledby="trTitle"><h2 id="trTitle">휴지통</h2><p>지운 업무는 14일 동안 보관됩니다. 복원할 항목을 고르세요.</p><div class="tr-list">불러오는 중…</div>
      <div class="tr-acts"><button type="button" class="tr-close">닫기</button><button type="button" class="primary tr-restore" disabled>복원</button></div></dialog>`);
    const list = dlg.querySelector('.tr-list'), btn = dlg.querySelector('.tr-restore');
    dlg.querySelector('.tr-close').onclick = () => dlg.close(); dlg.onclose = () => dlg.remove();
    document.body.append(dlg); dlg.showModal();
    let rows = [];
    try { rows = (await api.get({ action: 'trash' })).rows.sort((a, b) => b.deletedAt.localeCompare(a.deletedAt)); } catch (e) { list.textContent = '불러오지 못했습니다: ' + e.message; return; }
    list.innerHTML = rows.length ? rows.map((r, i) => `<label class="tr-item"><input type="checkbox" data-i="${i}"><span><b>${esc(r.text) || '(내용 없음)'}</b><small>${esc(disp(r.who))} · ${esc(r.section)} · ${r.date.slice(5).replace('-', '.')} 업무 · ${new Date(r.deletedAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })} 삭제</small></span></label>`).join('') : '<p class="tr-empty">휴지통이 비어 있습니다.</p>';
    list.onchange = () => { btn.disabled = !list.querySelector(':checked'); };
    btn.onclick = async () => {
      const keys = [...list.querySelectorAll(':checked')].map(c => rows[c.dataset.i].deletedAt + '|' + rows[c.dataset.i].id);
      btn.disabled = true;
      try { const j = await api.post({ action: 'trashRestore', keys }); toast(`${j.restored}개 복원했습니다`); dlg.close(); load(); loadShared(); } catch (e) { toast(e.message); btn.disabled = false; }
    };
  }
  $('btnTrash').onclick = openTrash;


  /* ---------- 태그: 'Figo)' 처럼 직접 쓰는 방식은 그대로, 색·표시 이름·설명만 공통 시트(tags 탭)에 저장 ---------- */
  const TAG_COLORS = { grey: ['#f2f4f6', '#4e5968'], blue: ['#e8f3ff', '#1b64da'], green: ['#e6f6ee', '#0a7a4a'], red: ['#fff0f0', '#c92a2a'], orange: ['#fff3e6', '#b35300'], purple: ['#f0ebff', '#5b3cc4'], pink: ['#ffeef6', '#b0236a'], teal: ['#e5f7f6', '#0b7470'] };
  const tagStyle = t => { const c = TAG_COLORS[state.tags[t]?.color]; return c ? `background:${c[0]};color:${c[1]}` : ''; };
  const tagLabel = t => state.tags[t]?.label || t;
  async function loadTags() { try { const j = await api.get({ action: 'tags' }); state.tags = Object.fromEntries((j.tags || []).map(t => [t.tag, t])); render(); } catch {} }

  /* ---------- 팀 데이터(3명의 하루치): 홈 요약과 업무 체크 페이지가 같이 씀 ---------- */
  const marketers = () => C.PEOPLE.filter(p => !p.director && p.sheet);
  async function loadTeam(d) {
    const got = await Promise.all(marketers().map(p => api.get({ who: p.name, from: d, to: d }).then(j => [p.name, j.rows]).catch(() => [p.name, null])));
    state.team = { date: d, ...Object.fromEntries(got) }; return state.team;
  }
  const FIXED = ['데일리고정', '주간고정'], FLEX = ['배치예정', '변동업무', '팔로업'];

  /* ---------- 홈: 음각 로고 + 오늘 요약 ---------- */
  // 외부 미팅: 공용·원장님 캘린더에서 '외부' 표시한 일정 중 앞으로 14일. 5분마다 새로 받음
  async function loadExtMeets() {
    if (state.ext && Date.now() - state.ext.at < 3e5) return;
    const from = todayKst(), to = shiftDate(from, 14);
    const lists = await Promise.all([SHARED, DIRECTOR_WHO].map(who => api.get({ who, from, to }).then(j => j.rows.filter(r => ['일정', '원장님일정'].includes(r.section) && isExt(r) && r.start && !isDone(r)).map(r => ({ ...r, _who: who }))).catch(() => [])));
    state.ext = { at: Date.now(), rows: lists.flat() };
  }
  const kstMs = (d, t) => Date.parse(`${d}T${t}:00+09:00`);
  function paintExt(box) {
    const host = box.querySelector('.ext-meet'); if (!host) return;
    const now = Date.now(), list = (state.ext?.rows || []).map(r => ({ r, s: kstMs(r.date, r.start), e: kstMs(r.date, r.end || r.start) || kstMs(r.date, r.start) + 36e5 })).filter(x => x.e > now).sort((a, b) => a.s - b.s);
    if (!list.length) { host.innerHTML = '<p class="ext-none">앞으로 2주간 예정된 외부 미팅이 없습니다</p>'; return; }
    const { r, s, e } = list[0], left = s - now, live = left <= 0;
    const mins = Math.max(0, Math.ceil(left / 6e4)), dd = Math.floor(mins / 1440), hh = Math.floor(mins % 1440 / 60), mm = mins % 60;
    const txt = live ? '진행 중' : dd ? `${dd}일 ${hh}시간 남음` : hh ? `${hh}시간 ${mm}분 남음` : `${mm}분 남음`;
    const pct = live ? 100 : Math.max(2, Math.min(100, 100 - left / (24 * 36e5) * 100)); // 24시간 전부터 차오름
    const tone = live ? 'live' : left <= 30 * 6e4 ? 'soon' : left <= 2 * 36e5 ? 'near' : '';
    host.className = 'ext-meet ' + tone;
    host.innerHTML = `<div class="ext-top"><span class="ext-label">다음 외부 미팅</span><b class="ext-left">${txt}</b></div>
      <p class="ext-title">${esc(r.text)}</p><p class="ext-when">${fmtDate(r.date)} ${esc(r.start)}${r.end ? '–' + esc(r.end) : ''}${r._who === DIRECTOR_WHO ? ' · 원장님 캘린더' : ''}</p>
      <div class="ext-track" role="progressbar" aria-label="외부 미팅까지 남은 시간" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}"><span style="width:${pct}%"></span></div>
      ${list.length > 1 ? `<ul class="ext-more">${list.slice(1, 4).map(x => `<li>${esc(x.r.date.slice(5).replace('-', '/'))} ${esc(x.r.start)} · ${esc(x.r.text)}</li>`).join('')}</ul>` : ''}`;
  }
  function renderHome() {
    const box = $('homeHub'), dir = state.dir.tasks, cnt = k => dir.filter(x => x.status === k).length;
    // 가운데: 파란 자명종 + 초 단위로 흐르는 시계 (마케터는 그 아래 큰 재촉 버튼)
    box.innerHTML = `<h1 class="sr-only">아르스킨 대시보드</h1>
      <section class="clock-hero" aria-label="현재 시각">
        <svg class="aclock" viewBox="0 0 200 200" aria-hidden="true">
          <circle cx="100" cy="100" r="94" class="ac-face"/><line x1="100" y1="14" x2="100" y2="30" transform="rotate(0 100 100)" class="tk-major"/><line x1="100" y1="17" x2="100" y2="24" transform="rotate(30 100 100)" class="tk"/><line x1="100" y1="17" x2="100" y2="24" transform="rotate(60 100 100)" class="tk"/><line x1="100" y1="14" x2="100" y2="30" transform="rotate(90 100 100)" class="tk-major"/><line x1="100" y1="17" x2="100" y2="24" transform="rotate(120 100 100)" class="tk"/><line x1="100" y1="17" x2="100" y2="24" transform="rotate(150 100 100)" class="tk"/><line x1="100" y1="14" x2="100" y2="30" transform="rotate(180 100 100)" class="tk-major"/><line x1="100" y1="17" x2="100" y2="24" transform="rotate(210 100 100)" class="tk"/><line x1="100" y1="17" x2="100" y2="24" transform="rotate(240 100 100)" class="tk"/><line x1="100" y1="14" x2="100" y2="30" transform="rotate(270 100 100)" class="tk-major"/><line x1="100" y1="17" x2="100" y2="24" transform="rotate(300 100 100)" class="tk"/><line x1="100" y1="17" x2="100" y2="24" transform="rotate(330 100 100)" class="tk"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(6 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(12 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(18 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(24 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(36 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(42 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(48 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(54 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(66 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(72 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(78 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(84 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(96 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(102 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(108 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(114 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(126 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(132 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(138 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(144 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(156 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(162 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(168 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(174 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(186 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(192 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(198 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(204 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(216 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(222 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(228 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(234 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(246 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(252 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(258 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(264 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(276 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(282 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(288 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(294 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(306 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(312 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(318 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(324 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(336 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(342 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(348 100 100)" class="tk-min"/><line x1="100" y1="14" x2="100" y2="17" transform="rotate(354 100 100)" class="tk-min"/>
          <g class="ac-h"><line x1="100" y1="108" x2="100" y2="56"/></g>
          <g class="ac-m"><line x1="100" y1="112" x2="100" y2="34"/></g>
          <g class="ac-s"><line x1="100" y1="122" x2="100" y2="26"/><circle cx="100" cy="100" r="4.5"/></g>
          <circle cx="100" cy="100" r="2" class="ac-pin"/>
        </svg>
        <p class="clock-date"></p>
        <p class="clock-time" aria-live="off"></p>
        ${state.dir.me && !isBoss() ? '<button type="button" class="nudge-hero" data-nudge>🔥 원장님 재촉하기</button><p class="nudge-sub">원장님 창에 바로 경고가 뜹니다</p>' : ''}
      </section>
      <section class="ext-meet" aria-live="polite"></section>
      <div class="home-cards"><div class="home-logo" aria-hidden="true"><span class="deboss"></span></div>
        <section class="home-card"><h2>원장님 숙제</h2><dl class="home-nums"><div><dt>대기</dt><dd>${cnt('pending')}</dd></div><div><dt>승인</dt><dd>${cnt('approved')}</dd></div><div><dt>완료</dt><dd>${cnt('done')}</dd></div></dl><button type="button" class="home-go" data-go="sheet">원장님 워크시트 열기</button></section>
        <section class="home-card"><h2>바로가기</h2><nav class="home-links" aria-label="바로가기"><button type="button" data-go="daily"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 6h12M4 10h12M4 14h8"/></svg><span>일간보고서</span><i aria-hidden="true">›</i></button><button type="button" data-go="calendar"><svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="4" width="14" height="13" rx="2"/><path d="M3 8h14M7 2v4M13 2v4"/></svg><span>콘텐츠 스튜디오</span><i aria-hidden="true">›</i></button><button type="button" data-go="sheet"><svg viewBox="0 0 20 20" aria-hidden="true"><rect x="4" y="3" width="12" height="15" rx="2"/><path d="M7 8h6M7 11h6M7 14h3"/></svg><span>원장님 워크시트</span><i aria-hidden="true">›</i></button><button type="button" data-go="team"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="7" cy="8" r="3"/><circle cx="14" cy="9" r="2.5"/><path d="M2 17c0-3 2.5-5 5-5s5 2 5 5M12 16c.3-2 1.6-3.5 3.5-3.5S18 14 18 16"/></svg><span>마케팅 공용</span><i aria-hidden="true">›</i></button></nav></section>
      </div>`;
    box.querySelectorAll('[data-go]').forEach(b => b.onclick = () => b.dataset.go === 'sheet' ? openDirSheet() : setView(b.dataset.go));
    box.querySelector('[data-nudge]')?.addEventListener('click', nudgeBoss);
    { const k = new Date(Date.now() + 9 * 36e5), sec = k.getUTCSeconds() + k.getUTCMilliseconds() / 1000, min = k.getUTCMinutes() * 60 + sec, hr = (k.getUTCHours() % 12) * 3600 + min;
      [['.ac-s', sec], ['.ac-m', min], ['.ac-h', hr]].forEach(([c, t]) => box.querySelector(c).style.animationDelay = `-${t}s`); }
    loadExtMeets().then(() => paintExt(box));
    const tick = () => {
      if (!box.isConnected || state.view !== 'home') return clearInterval(renderHome.t);
      const k = new Date(Date.now() + 9 * 36e5), h = k.getUTCHours(), m = k.getUTCMinutes(), sec = k.getUTCSeconds(), p2 = n => String(n).padStart(2, '0');
      box.querySelector('.clock-date').textContent = fmtDate(k.toISOString().slice(0, 10));
      if (sec % 30 === 0) { paintExt(box); if (Date.now() - (state.ext?.at || 0) > 3e5) loadExtMeets().then(() => paintExt(box)); }
      box.querySelector('.clock-time').innerHTML = `${p2(h)}:${p2(m)}<b>:${p2(sec)}</b>`;

    };
    clearInterval(renderHome.t); tick(); renderHome.t = setInterval(tick, 1000);
  }


  /* ---------- 마케팅 공용: 업무 체크(3명 고정·변동) / 태그 관리 ---------- */
  function renderTeam() {
    if (isBoss() && (state.teamPage || 'check') === 'check') state.teamPage = 'tags'; // 원장님은 팀 업무 체크 접근 불가
    const box = $('teamHub'), page = state.teamPage || 'check';
    box.innerHTML = `<div class="seg team-seg">${isBoss() ? '' : `<button data-tp="check" class="${page === 'check' ? 'active' : ''}">업무 체크</button>`}<button data-tp="tags" class="${page === 'tags' ? 'active' : ''}">태그 관리</button><button data-tp="leaves" class="${page === 'leaves' ? 'active' : ''}">연월차</button></div>`;
    box.querySelectorAll('[data-tp]').forEach(b => b.onclick = () => { state.teamPage = b.dataset.tp; setView('team'); });
    if (page === 'tags') return renderTagAdmin(box);
    if (page === 'leaves') return renderLeaves(box);
    const d = todayKst();
    box.append(el(`<div class="dir-head"><h1>팀 업무 체크</h1><p>${fmtDate(d)} · 각자의 고정 업무와 변동 업무를 한 화면에서 확인하고 상태를 바꿀 수 있습니다.</p></div>`));
    if (state.team.date !== d) return box.append(el('<div class="empty-note">불러오는 중…</div>'));
    const grid = el('<div class="team-grid"></div>');
    marketers().forEach(p => {
      const rows = state.team[p.name];
      const col = el(`<section class="sec team-col"><h3>${esc(disp(p.name))}</h3></section>`);
      if (!rows) { col.append(el('<p class="muted">불러오지 못했습니다</p>')); grid.append(col); return; }
      [['고정 업무', FIXED], ['변동 업무', FLEX]].forEach(([label, secs]) => {
        const list = rows.filter(r => secs.includes(r.section)).sort((a, b) => isDone(a) - isDone(b));
        col.append(el(`<h4>${label} <small class="sec-count">${list.filter(isDone).length}/${list.length}</small></h4>`));
        list.forEach(r => {
          const row = el(`<div class="row${isDone(r) ? ' done' : ''}"></div>`);
          row.append(p.name === state.dir.me ? statusButton(r, code => { r.status = code; save([r], p.name); renderTeam(); }) : el(`<span class="pst" title="${esc(disp(p.name))}님만 바꿀 수 있어요">${statusIcon(statusCode(r.status))}</span>`));
          const m = r.text.match(CAT_RE), rest = m && r.text.slice(m[0].length);
          row.append(el(`<div class="tx">${rest ? `<span class="cat" style="${tagStyle(m[1])}">${esc(tagLabel(m[1]))}</span> ` : ''}${esc(rest || r.text)}</div>`));
          col.append(row);
        });
      });
      grid.append(col);
    });
    box.append(grid);
  }
  // 연월차: 사람별 요약 카드 · 월별 사용 표 · 예정/지난 내역
  function renderLeaves(box) {
    const y = todayKst().slice(0, 4), today = todayKst(), days = l => l.kind === '연차' ? 1 : 0.5, ppl = marketers();
    const list = state.leaves.filter(l => l.date.startsWith(y)).sort((a, b) => a.date.localeCompare(b.date));
    const col = n => C.PEOPLE.find(p => p.name === n)?.color || '#3182f6', sum = a => a.reduce((t, l) => t + days(l), 0);
    const fmtD = d => `${+d.slice(5, 7)}/${+d.slice(8)} (${WD[new Date(d + 'T00:00:00').getDay()]})`;
    box.append(el(`<header class="lv-head"><div><h1>연월차</h1><p>${y}년 · 등록은 마케팅 공용 캘린더의 <b>휴가 등록</b>에서 해요. 연차 1일, 반차 0.5일.</p></div></header>`));
    box.append(el(`<div class="lv-people">${ppl.map(p => { const mine = list.filter(l => l.who === p.name), next = mine.find(l => l.date >= today);
      return `<section class="lv-card" style="--pc:${col(p.name)}"><div class="lv-who"><span class="lv-av">${esc(disp(p.name).slice(0, 1))}</span><b>${esc(disp(p.name))}</b></div>
        <div class="lv-big"><strong>${sum(mine)}</strong><span>일 사용</span></div>
        <div class="lv-split"><span>연차 <b>${mine.filter(l => l.kind === '연차').length}</b></span><span>반차 <b>${mine.filter(l => l.kind !== '연차').length}</b></span></div>
        <p class="lv-next">${next ? `다음 휴가 <b>${fmtD(next.date)}</b> ${esc(next.kind)}` : '예정된 휴가 없음'}</p></section>`; }).join('')}</div>`));
    const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')), curM = today.slice(5, 7);
    box.append(el(`<section class="lv-panel"><h2>월별 사용</h2><div class="lv-table-wrap"><table class="lv-table"><thead><tr><th scope="col">이름</th>${months.map(m => `<th scope="col"${m === curM ? ' class="cur"' : ''}>${+m}월</th>`).join('')}<th scope="col">합계</th></tr></thead><tbody>${ppl.map(p => { const mine = list.filter(l => l.who === p.name);
      return `<tr style="--pc:${col(p.name)}"><th scope="row"><i class="lv-dot"></i>${esc(disp(p.name))}</th>${months.map(m => { const v = sum(mine.filter(l => l.date.slice(5, 7) === m)); return `<td class="${m === curM ? 'cur' : ''}${v ? ' on' : ''}">${v ? `<span style="--a:${Math.min(1, .25 + v * .25)}">${v}</span>` : ''}</td>`; }).join('')}<td class="lv-total">${sum(mine)}</td></tr>`; }).join('')}</tbody></table></div></section>`));
    const item = l => `<li class="lv-item" style="--pc:${col(l.who)}"><span class="lv-date">${fmtD(l.date)}</span><span class="lv-person"><i class="lv-dot"></i>${esc(disp(l.who))}</span><span class="lv-kind k-${LEAVE_KINDS.indexOf(l.kind)}">${esc(l.kind)}</span><span class="lv-memo">${esc(l.memo || '')}</span><button type="button" class="del" data-id="${esc(l.id)}" aria-label="${esc(disp(l.who))} ${l.date} ${esc(l.kind)} 삭제">${icon('x', 14)}</button></li>`;
    const up = list.filter(l => l.date >= today), past = list.filter(l => l.date < today).reverse();
    const panel = el(`<div class="lv-lists"><section class="lv-panel"><h2>예정 <small>${up.length}</small></h2><ul class="lv-ul">${up.map(item).join('') || '<li class="lv-empty">예정된 휴가가 없어요</li>'}</ul></section><section class="lv-panel"><h2>지난 내역 <small>${past.length}</small></h2><ul class="lv-ul">${past.map(item).join('') || '<li class="lv-empty">아직 사용한 휴가가 없어요</li>'}</ul></section></div>`);
    panel.onclick = e => { const b = e.target.closest('.del'); if (!b) return; const l = list.find(x => x.id === b.dataset.id); if (l && confirm(`${disp(l.who)} ${l.date} ${l.kind}를 삭제할까요?`)) leaveEdit({ action: 'leaveDelete', id: l.id }); };
    box.append(panel);
  }
  // 태그 관리: 카드로 4~5개씩. 지운 태그는 '태그 휴지통'(영구 보관)으로 가고 칩 표시를 멈춘다. 복원 가능.
  function renderTagAdmin(box) {
    const found = new Map(), gone = new Set(state.deletedTags.map(t => t.tag));
    const scan = rows => (rows || []).forEach(r => { const m = String(r.text).match(CAT_RE); if (m && r.text.slice(m[0].length)) found.set(m[1], (found.get(m[1]) || 0) + 1); });
    marketers().forEach(p => scan(state.team[p.name])); scan(state.rows); scan(state.shared);
    Object.keys(state.tags).forEach(t => found.has(t) || found.set(t, 0));
    const tags = [...found.keys()].filter(t => !gone.has(t)).sort((a, b) => a.localeCompare(b, 'ko'));
    box.append(el(`<div class="dir-head"><h1>태그 관리</h1><p>업무 앞에 <b>Figo)</b> <b>촬영)</b> 처럼 직접 쓰는 방식은 그대로입니다. 여기서는 색·표시 이름·설명을 정하고, 안 쓰는 태그는 지울 수 있습니다.</p></div>`));
    const grid = el('<div class="tag-grid"></div>');
    tags.forEach(t => {
      const cur = state.tags[t] || {};
      const card = el(`<form class="tag-card"><div class="tag-card-head"><span class="cat" style="${tagStyle(t)}">${esc(tagLabel(t))}</span><code>${esc(t)})</code><button type="button" class="tag-del" title="태그 휴지통으로" aria-label="${esc(t)} 태그 삭제">${icon('trash', 16)}</button></div>
        <input name="label" placeholder="표시 이름" aria-label="${esc(t)} 표시 이름" value="${esc(cur.label || '')}" maxlength="20">
        <div class="swatches" role="radiogroup" aria-label="${esc(t)} 색">${Object.entries(TAG_COLORS).map(([k, c]) => `<label title="${k}"><input type="radio" name="color" value="${k}"${cur.color === k ? ' checked' : ''}><span style="background:${c[0]};border-color:${c[1]}"></span></label>`).join('')}</div>
        <input name="desc" placeholder="설명" aria-label="${esc(t)} 설명" value="${esc(cur.desc || '')}" maxlength="60">
        <button class="primary">저장</button></form>`);
      card.onsubmit = async e => {
        e.preventDefault(); const f = e.target;
        try { const j = await api.post({ action: 'tagSave', tag: t, label: f.label.value.trim(), color: f.color.value || '', desc: f.desc.value.trim() }); state.tags = Object.fromEntries((j.tags || []).map(x => [x.tag, x])); toast(`${t} 태그를 저장했습니다`); renderTeam(); render(); } catch (err) { toast(err.message); }
      };
      card.querySelector('.tag-del').onclick = () => tagTrash('tagDelete', t);
      grid.append(card);
    });
    if (!tags.length) grid.append(el('<p class="muted">아직 태그가 없습니다. 업무 앞에 "분류)" 를 붙여 쓰면 여기에 나타납니다.</p>'));
    box.append(grid);
    const trash = el(`<details class="sec tag-trash"><summary>태그 휴지통 <small class="sec-count">${state.deletedTags.length}개 · 영구 보관</small></summary><div class="tag-trash-list">${state.deletedTags.map(t => `<div class="tag-trash-item"><span class="cat">${esc(t.label || t.tag)}</span><code>${esc(t.tag)})</code><small class="muted">${t.deletedAt ? new Date(t.deletedAt).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' }) : ''} · ${esc(disp(t.by || ''))}</small><button type="button" data-restore="${esc(t.tag)}">복원</button></div>`).join('') || '<p class="muted">비어 있습니다.</p>'}</div></details>`);
    trash.onclick = e => { const b = e.target.closest('[data-restore]'); if (b) tagTrash('tagRestore', b.dataset.restore); };
    box.append(trash);
  }
  async function tagTrash(action, tag) {
    if (action === 'tagDelete' && !confirm(`"${tag}" 태그를 지울까요? 업무 글은 그대로 두고, 칩 표시만 멈춥니다. 태그 휴지통에 영구 보관되어 언제든 복원할 수 있어요.`)) return;
    try { const j = await api.post({ action, tag }); state.tags = Object.fromEntries((j.tags || []).map(x => [x.tag, x])); state.deletedTags = j.deletedTags || []; toast(action === 'tagDelete' ? '태그를 휴지통으로 옮겼습니다' : '태그를 복원했습니다'); renderTeam(); render(); }
    catch (e) { toast(e.message); }
  }


  /* ---------- 원장님 알림: 원장님 접속 코드로 연 창에서만. 재촉(마케터 버튼)과 미달성 경고 ---------- */
  const NAG = '🔥 원장님!! 블로그 쓰셨어요? 숙제는요??  워크시트 확인해주세요!! 🔥';
  const isBoss = () => state.dir.me === DIRECTOR_WHO;
  function nag(reason, ackAt) { // ackAt: 재촉으로 뜬 경고면 닫을 때 '확인'을 서버에 기록
    try { if ('Notification' in window && Notification.permission === 'granted') new Notification('아르스킨 대시보드', { body: NAG, icon: 'assets/arskin-icon.png', tag: 'arskin-nag' }); } catch {}
    if (document.querySelector('.nag-dlg')) return;
    const dlg = el(`<dialog class="code-dlg nag-dlg" role="alertdialog" aria-labelledby="nagT"><h2 id="nagT">${esc(NAG)}</h2><p>${esc(reason)}</p><div class="tr-acts"><button type="button" class="nag-later">나중에</button><button type="button" class="primary nag-go">워크시트 열기</button></div></dialog>`);
    dlg.querySelector('.nag-later').onclick = () => dlg.close(); dlg.querySelector('.nag-go').onclick = () => { dlg.close(); openDirSheet(); };
    dlg.onclose = () => { dlg.remove(); if (ackAt) api.post({ action: 'nudgeAck', at: ackAt }).catch(() => {}); }; document.body.append(dlg); dlg.showModal();
  }
  const once = key => { try { if (localStorage[key] === todayKst()) return false; localStorage[key] = todayKst(); } catch {} return true; };
  async function bossCheck() {
    if (!isBoss()) { // 마케터: 내가 보낸 재촉을 원장님이 확인했는지
      if (!state.dir.me) return;
      try {
        const since = localStorage.ackSeen || new Date().toISOString(); if (!localStorage.ackSeen) localStorage.ackSeen = since;
        const j = await api.get({ action: 'nudgeAcks', since });
        if (j.acks?.length) { localStorage.ackSeen = j.acks.map(a => a.ack).sort().pop(); bigNotice('원장님이 확인했어요 👀'); }
      } catch {}
      return;
    }
    try { // 1) 재촉 받은 것
      const since = localStorage.nudgeSeen || new Date(Date.now() - 864e5).toISOString();
      const j = await api.get({ action: 'nudges', since });
      if (j.nudges?.length) { const lastAt = j.nudges[j.nudges.length - 1].at; localStorage.nudgeSeen = lastAt; nag(`${[...new Set(j.nudges.map(n => disp(n.from)))].join(', ')}님이 재촉했습니다.`, lastAt); return; }
    } catch {}
    try { // 2) 배치한 날 끝내지 못한 업무 (전날에서 넘어온 미완료) / 오후 6시 이후 오늘 미완료
      const d = todayKst(), rows = (await api.get({ who: DIRECTOR_WHO, from: d, to: d })).rows.filter(r => r.section === '원장님리스트' && !isDone(r));
      const late = rows.filter(r => (r.created || d) < d), hour = +new Date(Date.now() + 9 * 36e5).toISOString().slice(11, 13);
      if (late.length && once('nagLate')) return nag(`지난날 끝내지 못한 업무가 ${late.length}개 있습니다.`);
      // 정기 재촉: 13시·15시·18시 (그 시각이 지났는데 아직 안 띄웠으면 한 번만)
      const slot = [18, 15, 13].find(h => hour >= h);
      if (slot && once('nagAt' + slot)) { [13, 15, 18].filter(h => h < slot).forEach(h => once('nagAt' + h)); nag(`정기 재촉 · ${slot}시${rows.length ? ` · 남은 업무 ${rows.length}개` : ''}`); }
    } catch {}
  }
  setInterval(bossCheck, 60e3); // 창이 열려 있는 동안 1분마다
  function bigPeek(title, text) {
    const dlg = el(`<dialog class="code-dlg peek-dlg"><p class="muted">${esc(title)}</p><h2>${esc(text)}</h2><button type="button" class="primary">닫기</button></dialog>`);
    dlg.querySelector('button').onclick = () => dlg.close(); dlg.onclose = () => dlg.remove(); document.body.append(dlg); dlg.showModal();
  }
  // 화면 가운데 큰 확인 메시지(누르거나 3초 뒤 사라짐)
  function bigNotice(text) {
    document.querySelector('.big-notice')?.remove();
    const n = el(`<div class="big-notice" role="status" aria-live="assertive"><div>${esc(text)}</div></div>`);
    const off = () => { n.classList.add('out'); setTimeout(() => n.remove(), 250); };
    n.onclick = off; document.body.append(n); setTimeout(off, 3000);
  }
  async function nudgeBoss() {
    try { await api.post({ action: 'nudge' }); bigNotice('원장님을 재촉 했습니다! ✅'); } catch (e) { toast(e.message); }
  }
  /* ---------- 사이드바 대메뉴 순서 편집: 편집 버튼을 켜고 손잡이를 끌어 위아래로 ---------- */
  const navGroups = () => [...document.querySelectorAll('.nav > button[data-view]')];
  function applyNavOrder() {
    let order = []; try { order = JSON.parse(localStorage.navOrder || '[]'); } catch {}
    const nav = document.querySelector('.nav');
    order.forEach(v => { const b = nav.querySelector(`:scope > button[data-view="${v}"]`); if (!b) return; const sub = b.nextElementSibling?.classList.contains('subnav') ? b.nextElementSibling : null; nav.append(b); if (sub) nav.append(sub); });
  }
  function saveNavOrder() { try { localStorage.navOrder = JSON.stringify(navGroups().map(b => b.dataset.view)); } catch {} }
  $('navEdit').onclick = () => {
    const on = document.querySelector('.nav').classList.toggle('editing');
    $('navEdit').setAttribute('aria-pressed', on); $('navEdit').textContent = on ? '편집 완료' : '메뉴 순서 편집';
    navGroups().forEach(b => {
      b.querySelector('.nav-grip')?.remove();
      if (!on) return;
      const g = el(`<span class="nav-grip" role="button" tabindex="0" aria-label="${b.textContent.trim()} 순서 이동 (끌거나 ↑↓)">${icon('drag', 16)}</span>`);
      g.onpointerdown = e => {
        e.preventDefault(); e.stopPropagation();
        const move = ev => {
          const over = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('.nav > button[data-view]');
          if (!over || over === b) return;
          const nav = b.parentNode, sub = b.nextElementSibling?.classList.contains('subnav') ? b.nextElementSibling : null, r = over.getBoundingClientRect();
          const before = ev.clientY < r.top + r.height / 2, anchor = before ? over : (over.nextElementSibling?.classList.contains('subnav') ? over.nextElementSibling : over).nextSibling;
          nav.insertBefore(b, anchor); if (sub) nav.insertBefore(sub, b.nextSibling);
        };
        const up = () => { removeEventListener('pointermove', move); removeEventListener('pointerup', up); saveNavOrder(); };
        addEventListener('pointermove', move); addEventListener('pointerup', up);
      };
      g.onclick = e => e.stopPropagation();
      g.onkeydown = e => {
        if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
        e.preventDefault(); const list = navGroups(), i = list.indexOf(b), t = list[i + (e.key === 'ArrowUp' ? -1 : 1)]; if (!t) return;
        const nav = b.parentNode, sub = b.nextElementSibling?.classList.contains('subnav') ? b.nextElementSibling : null;
        if (e.key === 'ArrowUp') nav.insertBefore(b, t); else nav.insertBefore(b, (t.nextElementSibling?.classList.contains('subnav') ? t.nextElementSibling : t).nextSibling);
        if (sub) nav.insertBefore(sub, b.nextSibling); saveNavOrder(); g.focus();
      };
      b.prepend(g);
    });
  };
  applyNavOrder();
  $('jandiLink').href = C.JANDI_URL || 'https://www.jandi.com/';

  load();
  setView('home');
})();
