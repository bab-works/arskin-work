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
    { key: '데일리고정', L: '데일리 고정업무 (매일 반복)' },
    { key: '배치예정', L: '업무 배치 예정' },
    { key: '팔로업', L: '진행중 작업 팔로업' },
    { key: '변동업무', L: '변동업무' },
    { key: '릴스업무', L: '릴스 업무' },
  ];
  const TASK_KEYS = new Set(TASK_SECTIONS.map(s => s.key));
  const WD = ['일', '월', '화', '수', '목', '금', '토'];
  const state = { sharedAnchor: null, sharedMode: localStorage.sharedMode === 'month' ? 'month' : 'week', sharedCollapsed: localStorage.sharedCollapsed === '1', shared: [], person: (C.PEOPLE.find(p => p.name === localStorage.person) || C.PEOPLE.find(p => p.name === C.DEFAULT_PERSON) || C.PEOPLE[0]).name, rows: [], dates: [], sel: null, view: 'daily', collapse: localStorage.collapse === '1', expanded: new Set(), calendar: null, selected: new Set(), sharedCat: '', dir: { tasks: [], me: '' }, sharedTasksOpen: (() => { try { return localStorage.sharedTasksOpen !== '0'; } catch { return true; } })(), calWho: (() => { try { return localStorage.calWho || ''; } catch { return ''; } })(), doneLast: localStorage.doneSort !== 'keep' };

  /* ---------- utils ---------- */
  const pad = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const shiftDate = (s, n) => { const d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); return iso(d); };
  const fmtDate = s => { const d = new Date(s + 'T00:00:00'); return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()} (${WD[d.getDay()]})`; };
  const todayKst = () => new Date(Date.now() + 9 * 36e5).toISOString().slice(0, 10); // 기기 시간대와 무관하게 한국 날짜
  const isWorkday = d => new Date(d + 'T00:00:00Z').getUTCDay() % 6 && !state.holidays[d];
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
      Object.entries({ key: C.API_KEY, code: accessCode(), who: state.person, ...params }).forEach(([k, v]) => u.searchParams.set(k, v));
      const j = await (await fetch(u)).json();
      checkAuth(j); if (j.error) throw new Error(j.error);
      return j;
    },
    async post(body) { // text/plain body → CORS preflight 없이 Apps Script 로 전달
      const j = await (await fetch(C.API_URL, { method: 'POST', body: JSON.stringify({ key: C.API_KEY, code: accessCode(), who: state.person, ...body }) })).json();
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
    const related = state.rows.filter(x => ['프로젝트', '하위업무'].includes(x.section) && list.some(r => SUBTASKABLE.has(r.section) && x.col === r.id));
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

  const CAT_RE = /^\P{L}*?([\p{L}\p{N}][^\s)]{0,11})\)\s*/u; // 앞 장식 기호 + 12자 이내 분류 + ')'
  function itemRow(r, opts = {}) {
    if (SUBTASKABLE.has(r.section) && isProject(r)) return projectCard(r);
    const row = el(`<div class="row${isDone(r) ? ' done' : ''}" data-id="${esc(r.id)}"></div>`);
    if (TASK_KEYS.has(r.section)) row.append(dragHandle(r));
    if (!opts.noStatus) row.append(statusButton(r, code => setStatus(r, code)));
    // '분류) 내용' 은 칩으로 보여주기만 하고, 편집할 때는 원문 전체를 그대로 보여준다
    const tx = el(`<div class="tx" contenteditable="plaintext-only"></div>`), chip = el('<span class="cat" hidden></span>');
    const paint = () => { const m = r.text.match(CAT_RE), rest = m && r.text.slice(m[0].length); chip.hidden = !rest; chip.textContent = rest ? m[1] : ''; tx.textContent = rest || r.text; };
    paint();
    tx.onfocus = () => { chip.hidden = true; tx.textContent = r.text; };
    tx.onblur = () => { const v = tx.textContent.trim(); if (!v) { deleteRow(r); render(); return; } if (v !== r.text) updateRow(r, { text: v }); paint(); };
    tx.onkeydown = e => {
      if (e.isComposing) return; // 한글 조합 중 Enter·Esc 는 무시
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); tx.blur(); }
      if (e.key === 'Escape') { tx.textContent = r.text; tx.blur(); } // 편집 취소
    };
    const del = opts.noStatus ? el(`<button class="del" title="삭제" aria-label="삭제">${icon('x', 14)}</button>`) : el(`<button class="del" title="메뉴" aria-label="업무 메뉴: 상태 변경, 삭제" aria-haspopup="menu">${icon('more', 18)}</button>`);
    del.onclick = () => opts.noStatus ? (deleteRow(r), render()) : statusMenu(del, statusCode(r.status), code => setStatus(r, code), () => { deleteRow(r); render(); });
    row.append(chip, tx);
    if (SUBTASKABLE.has(r.section)) { // 하위 업무 입력칸만 열고, 실제로 하나 입력해야 프로젝트가 된다 (Esc·빈칸으로 벗어나면 취소)
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
  function statusMenu(anchor, current, set, onDelete) {
    document.querySelector('.st-menu')?.remove();
    const m = el(`<div class="st-menu" role="menu" aria-label="${onDelete ? '업무 메뉴' : '상태 선택'}">${Object.keys(STAT).map(k => `<button type="button" role="menuitemradio" aria-checked="${k === current}" data-k="${k}">${statusIcon(k)}<span>${STAT[k].label}</span></button>`).join('')}${onDelete ? `<button type="button" role="menuitem" class="st-del" data-del>${icon('x', 20)}<span>삭제</span></button>` : ''}</div>`);
    document.body.append(m);
    const a = anchor.getBoundingClientRect(), h = m.offsetHeight;
    m.style.left = Math.min(innerWidth - m.offsetWidth - 8, a.left) + 'px';
    m.style.top = (a.bottom + h + 8 > innerHeight ? a.top - h - 4 : a.bottom + 4) + 'px';
    const items = [...m.querySelectorAll('button')];
    const close = (refocus = true) => { m.remove(); removeEventListener('pointerdown', outside, true); if (refocus && anchor.isConnected) anchor.focus(); };
    const outside = e => { if (!m.contains(e.target)) close(false); };
    addEventListener('pointerdown', outside, true);
    items.forEach((it, i) => {
      it.onclick = () => { close(false); if ('del' in it.dataset) onDelete(); else if (it.dataset.k !== current) set(it.dataset.k); };
      it.onkeydown = e => {
        if (e.key === 'Escape' || e.key === 'Tab') { e.preventDefault(); close(); }
        else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); items[(i + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length].focus(); }
      };
    });
    (items.find(x => x.dataset.k === current) || items[0]).focus();
  }
  const childrenOf = r => state.rows.filter(x => x.section === '하위업무' && x.col === r.id && x.date === r.date);
  const SUBTASKABLE = new Set(['배치예정', '변동업무', '팔로업']);
  // 자동 배치: 하위 업무가 있으면 팔로업, 시작 전이면 배치예정, 진행·완료면 변동업무 (데일리·주간·릴스는 제자리)
  const placeFor = (r, code) => !SUBTASKABLE.has(r.section) ? r.section : isProject(r) ? '팔로업' : code === 'todo' ? '배치예정' : '변동업무';
  const setStatus = (r, code) => { updateRow(r, { status: code, section: placeFor(r, code) }); if (TASK_KEYS.has(r.section) || r.section === '공통업무') holdSort(r.id); render(); if (code === 'done') document.querySelector(`.st[data-rid="${CSS.escape(r.id)}"]`)?.classList.add('just-done'); };
  const isProject = r => state.rows.some(x => x.section === '하위업무' && x.col === r.id && x.date === r.date); // 하위 업무가 1개 이상일 때만 프로젝트
  function progressOf(r) {
    const children = childrenOf(r), done = children.filter(isDone).length;
    return { total: children.length, done, percent: children.length ? Math.round(done / children.length * 100) : 0 };
  }
  function progressBar(r) {
    const p = progressOf(r);
    return `<div class="project-progress"><div class="project-progress-label"><span>${p.total ? `${p.done}/${p.total} 완료` : '하위 업무를 추가하세요'}</span><b>${p.percent}%</b></div><div class="project-track" role="progressbar" aria-label="${esc(r.text)} 진행률" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p.percent}"><span style="width:${p.percent}%"></span></div></div>`;
  }
  async function changeSubtask(parent, child, patch, deleting = false) {
    if (changeSubtask.busy) return;
    changeSubtask.busy = true;
    const who = state.person;
    const children = childrenOf(parent).filter(x => !deleting || x.id !== child.id).map(x => x.id === child.id ? { ...x, ...patch } : x);
    if (!deleting && !children.some(x => x.id === child.id)) children.push({ ...child, ...patch });
    const status = children.length && children.every(isDone) ? 'done' : children.some(isDone) ? 'doing' : 'todo';
    try {
      if (deleting) await api.post({ action: 'delete', ids: [child.date + '|' + child.id], who });
      const section = SUBTASKABLE.has(parent.section) && children.length ? '팔로업' : parent.section;
      await api.post({ action: 'upsert', rows: [{ ...parent, status, section }, ...(!deleting ? [{ ...child, ...patch }] : [])], who });
      if (state.person !== who) return;
      const index = state.rows.findIndex(x => x.id === child.id);
      if (deleting) state.rows = state.rows.filter(x => x.id !== child.id);
      else if (index >= 0) state.rows[index] = { ...child, ...patch };
      else state.rows.push({ ...child, ...patch });
      parent.status = status; parent.section = section; render();
    } catch (e) { toast('하위 업무 저장 실패: ' + e.message); load(); }
    finally { changeSubtask.busy = false; }
  }
  function projectCard(r) {
    const p = progressOf(r), card = el(`<div class="project-card" data-id="${esc(r.id)}"></div>`);
    const head = el('<div class="project-card-head"><span class="project-badge">프로젝트</span></div>'); head.prepend(dragHandle(r));
    const del = el('<button class="project-delete" title="프로젝트 삭제">삭제</button>'); del.onclick = () => { deleteRow(r); render(); }; head.append(del);
    const title = el('<div class="project-title" contenteditable="plaintext-only"></div>'); title.textContent = r.text;
    title.onblur = () => { const text = title.textContent.trim(); if (text && text !== r.text) { updateRow(r, { text }); render(); } else if (!text) title.textContent = r.text; };
    title.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); title.blur(); } };
    card.append(head, title, el(progressBar(r)));
    const list = el('<div class="subtasks"></div>');
    childrenOf(r).forEach(child => {
      const line = el('<div class="subtask"></div>');
      const check = el('<input type="checkbox">'); check.checked = isDone(child); check.setAttribute('aria-label', child.text + ' 완료');
      check.onchange = () => { if (changeSubtask.busy) { check.checked = isDone(child); return; } check.disabled = true; changeSubtask(r, child, { status: check.checked ? 'done' : 'todo' }); };
      const text = el(`<div class="subtask-text${check.checked ? ' done' : ''}" contenteditable="plaintext-only"></div>`); text.textContent = child.text;
      text.onblur = () => { const value = text.textContent.trim(); if (value && value !== child.text) changeSubtask(r, child, { text: value }); else if (!value) text.textContent = child.text; };
      text.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); text.blur(); } };
      const remove = el(`<button title="하위 업무 삭제" aria-label="하위 업무 삭제">${icon('x', 14)}</button>`); remove.onclick = () => changeSubtask(r, child, {}, true);
      line.append(check, text, remove); list.append(line);
    });
    card.append(list, addInput(text => changeSubtask(r, { id: newId(r.date), date: r.date, section: '하위업무', col: r.id, status: 'todo', text, start: '', end: '' }, {}), '+ 하위 업무 추가 (Enter)'));
    return card;
  }
  function projectSummary(d) {
    const projects = state.rows.filter(r => r.date === d && SUBTASKABLE.has(r.section) && isProject(r));
    if (!projects.length) return null;
    const box = el('<div class="project-summary"></div>');
    projects.forEach(r => { const entry = el('<div class="project-summary-entry"></div>'); const title = el('<b></b>'); title.textContent = r.text; entry.append(title, el(progressBar(r))); box.append(entry); });
    return sec('프로젝트 진행도', box);
  }
  function addInput(onAdd, ph = '+ 추가 (Enter)') {
    const w = el(`<div class="add"><input placeholder="${ph}"></div>`); const i = w.firstChild;
    i.onkeydown = e => {
      if (e.isComposing) return;
      if (e.key === 'Escape') { i.value = ''; i.blur(); }
      if (e.key !== 'Enter' || !i.value.trim()) return;
      const idx = [...document.querySelectorAll('.add input')].indexOf(i);
      onAdd(i.value.trim()); i.value = ''; render();
      document.querySelectorAll('.add input')[idx]?.focus(); // 연속 입력: 같은 자리의 입력칸으로 포커스 복귀
    };
    return w;
  }
  function itemList(date, section, col, opts = {}) {
    const box = document.createElement('div'); if (opts.doneLast) box.className = 'task-list';
    let rows = rowsFor(date, section, col);
    if (opts.doneLast && state.doneLast) { const late = r => isDone(r) && !sortHold.has(r.id); rows = [...rows.filter(r => !late(r)), ...rows.filter(late)]; }
    const key = date + section + (col ?? '');
    const hide = state.collapse && TASK_KEYS.has(section) && !state.expanded.has(key);
    let hidden = 0;
    rows.forEach(r => { const n = itemRow(r, opts); if (hide && isDone(r)) { n.classList.add('collapsed'); hidden++; } box.append(n); });
    if (hidden) { const m = el(`<button class="more">… 완료 ${hidden}건 보기</button>`); m.onclick = () => { state.expanded.add(key); render(); }; box.append(m); }
    box.append(addInput(text => addRow({ date, section, col: col ?? '', text, status: opts.noStatus ? '' : (opts.defaultStatus || 'todo') })));
    return box;
  }
  // 완료 정렬: 방금 바꾼 행은 400ms 제자리에 두었다가 220ms 동안 새 위치로 이동(FLIP)
  const sortHold = new Set();
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
      const list = rowsFor(r.date, r.section), i = list.indexOf(r), j = i + (e.key === 'ArrowUp' ? -1 : 1);
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
    const move = ev => {
      ghost.style.top = ev.clientY - dy + 'px'; ghost.style.left = ev.clientX - dx + 'px';
      ghost.hidden = true; const under = document.elementFromPoint(ev.clientX, ev.clientY); ghost.hidden = false;
      const target = under?.closest('.task-list .row[data-id], .task-list .project-card[data-id]');
      const list = under?.closest('.task-list');
      if (target && target !== node) { const t = target.getBoundingClientRect(); target[ev.clientY < t.top + t.height / 2 ? 'before' : 'after'](ph); }
      else if (list && !target) list.querySelector('.add')?.before(ph);
      if (ev.clientY < 80) scrollBy(0, -12); else if (ev.clientY > innerHeight - 80) scrollBy(0, 12);
    };
    const up = () => {
      removeEventListener('pointermove', move); removeEventListener('pointerup', up);
      ghost.remove(); node.classList.remove('dragging');
      const sec = ph.closest('.sec[id^="sec-"]'); if (!sec) { ph.remove(); return; }
      ph.replaceWith(node);
      const key = sec.id.slice(4), ids = [...sec.querySelectorAll('.task-list > [data-id]')].map(n => n.dataset.id);
      const changed = [];
      ids.forEach((id, i) => { const x = state.rows.find(y => y.id === id); if (!x) return; const patch = { order: String(i + 1), section: key }; if (x.order !== patch.order || x.section !== key) { Object.assign(x, patch); changed.push(x); } });
      if (changed.length) save(changed);
      render();
    };
    addEventListener('pointermove', move); addEventListener('pointerup', up);
  }
  function taskSection(d, s) {
    const all = rowsFor(d, s.key), done = all.filter(isDone).length;
    const node = sec(s.L, itemList(d, s.key, undefined, { doneLast: true, defaultStatus: s.key === '변동업무' ? 'doing' : 'todo' }));
    node.id = 'sec-' + s.key; node.querySelector('h3').insertAdjacentHTML('beforeend', ` <small class="sec-count">${done}/${all.length}</small>`);
    return node;
  }
  function sectionChips(d) { // 섹션 바로가기 칩: 남은 개수 표시
    const nav = el('<nav class="sec-chips" aria-label="섹션 바로가기"></nav>');
    TASK_SECTIONS.forEach(s => {
      const left = rowsFor(d, s.key).filter(r => !isDone(r)).length;
      const b = el(`<button type="button">${esc(s.L)}<b>${left}</b></button>`);
      b.setAttribute('aria-label', `${s.L} 남은 업무 ${left}건으로 이동`);
      b.onclick = () => $('sec-' + s.key)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      nav.append(b);
    });
    return nav;
  }
  function renderReport() {
    const d = state.sel, box = $('report'); box.innerHTML = '';
    if (!state.rows.some(r => r.date === d)) {
      box.append(el(`<div class="empty-note">${fmtDate(d)} 보고서가 비어 있습니다.<br><button id="emptyCarry" class="primary">직전 근무일 항목 가져오기</button> <button id="emptyNew">빈 보고서 시작</button></div>`));
      $('emptyCarry').onclick = carryForward;
      $('emptyNew').onclick = () => { addRow({ date: d, section: '메모', text: ' ' }); render(); };
      return;
    }
    box.append(el(`<div class="titlebar"><span>업무보고 및 회의록</span><span class="meta">${fmtDate(d)} · ${esc(state.person)}</span></div>`));
    box.append(sectionChips(d));
    const projects = projectSummary(d); if (projects) box.append(projects);
    TASK_SECTIONS.forEach(s => box.append(taskSection(d, s)));
    const pub = publishingFor(d);
    if (pub) box.append(sec('오늘 발행 (콘텐츠 캘린더)', pub));
    box.append(sec('메모 · 회의록', textarea('memo', cellText(d, '메모', ''), v => setCellText(d, '메모', '', v), '메모')));
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

  /* ---------- timeline ---------- */
  const PX = 48; // 1시간 높이
  const [H0, H1] = C.TIMELINE;
  const yToMin = (y, g) => Math.max(H0 * 60, Math.min(H1 * 60, Math.round((H0 * 60 + (y / g.clientHeight) * (H1 - H0) * 60) / 15) * 15));
  function place(b, start, end) {
    const s = toMin(start), e = toMin(end);
    b.style.top = ((s - H0 * 60) / 60 * PX) + 'px'; b.style.height = Math.max(14, (e - s) / 60 * PX - 2) + 'px';
  }
  function renderTimeline() {
    const box = $('timeline'); box.innerHTML = '';
    box.append(el(`<div class="tl-head"><span>타임라인 <small>${esc(state.sel.slice(5))}</small></span><button id="tlAdd" class="more">+ 블록</button></div>`));
    const grid = el('<div class="tl-grid"></div>'); grid.style.height = (H1 - H0) * PX + 'px';
    for (let h = H0; h < H1; h++) grid.append(el(`<div class="tl-hour"><span>${pad(h)}:00</span></div>`));
    // 공용 캘린더의 회의(시간 있는 일정)는 모두의 타임라인에 같은 색으로 표시, 수정은 공용 일정 편집기로
    state.shared.filter(r => r.section === '일정' && r.date === state.sel && r.start && r.end).forEach(r => {
      const b = el(`<div class="tl-block tl-shared${isDone(r) ? ' done' : ''}" title="공통 일정"><small>공통 · ${esc(r.start)}~${esc(r.end)}</small>${esc(r.text)}</div>`);
      place(b, r.start, r.end); b.onclick = () => openEditor(r, b); grid.append(b);
    });
    rowsFor(state.sel, '타임라인').forEach(r => {
      const b = el(`<div class="tl-block"><small>${esc(r.start)}~${esc(r.end)}</small>${esc(r.text)}</div>`);
      place(b, r.start, r.end);
      b.onpointerdown = e => startMove(e, r, b, grid);
      b.onclick = () => { if (!b.moved) openEditor(r, b); };
      grid.append(b);
    });
    grid.onpointerdown = e => { // 빈 곳에서 드래그 → 새 블록 (마우스만; 터치는 + 블록 버튼)
      if (e.pointerType !== 'mouse' || e.target.closest('.tl-block')) return;
      const rect = grid.getBoundingClientRect(); const m0 = yToMin(e.clientY - rect.top, grid);
      const ghost = el('<div class="tl-block ghost"></div>'); grid.append(ghost); grid.setPointerCapture(e.pointerId);
      let m1 = m0;
      const upd = ev => { m1 = yToMin(ev.clientY - rect.top, grid); place(ghost, toTime(Math.min(m0, m1)), toTime(Math.max(m0, m1, Math.min(m0, m1) + 15))); };
      upd(e);
      grid.onpointermove = upd;
      grid.onpointerup = () => {
        grid.onpointermove = grid.onpointerup = null; ghost.remove();
        const s = Math.min(m0, m1), en = Math.max(m0, m1) > s ? Math.max(m0, m1) : s + 30;
        openEditor({ date: state.sel, section: '타임라인', start: toTime(s), end: toTime(Math.min(en, H1 * 60)), text: '' }, null, true);
      };
    };
    box.append(grid);
    $('tlAdd').onclick = () => openEditor({ date: state.sel, section: '타임라인', start: '09:00', end: '10:00', text: '' }, null, true);
  }
  function startMove(e, r, b, grid) {
    if (e.pointerType !== 'mouse') return;
    e.stopPropagation(); b.moved = false;
    const y0 = e.clientY, s0 = toMin(r.start), dur = toMin(r.end) - s0;
    b.setPointerCapture(e.pointerId);
    b.onpointermove = ev => {
      const dm = Math.round(((ev.clientY - y0) / PX * 60) / 15) * 15;
      if (Math.abs(ev.clientY - y0) > 3) b.moved = true;
      const s = Math.max(H0 * 60, Math.min(H1 * 60 - dur, s0 + dm)); b.dataset.s = s; place(b, toTime(s), toTime(s + dur));
    };
    b.onpointerup = () => {
      b.onpointermove = b.onpointerup = null;
      if (b.moved) { const s = +b.dataset.s; updateRow(r, { start: toTime(s), end: toTime(s + dur) }); renderTimeline(); }
    };
  }
  let editing = null;
  function openEditor(r, anchor, isNew) {
    editing = { r, isNew };
    const p = $('blockEditor'); p.classList.remove('hidden');
    $('beTitle').value = r.text; $('beStart').value = r.start; $('beEnd').value = r.end;
    $('beDelete').classList.toggle('hidden', !!isNew);
    const a = anchor ? anchor.getBoundingClientRect() : { left: innerWidth / 2 - 130, top: innerHeight / 2 - 80, width: 0 };
    p.style.left = Math.max(8, Math.min(innerWidth - 350, a.left - 350)) + 'px';
    p.style.top = Math.max(8, Math.min(innerHeight - 170, a.top)) + 'px';
    $('beTitle').focus();
  }
  function closeEditor() { $('blockEditor').classList.add('hidden'); editing = null; }
  addEventListener('pointerdown', e => { if (editing && !$('blockEditor').contains(e.target) && !e.target.closest('.sc-add,.sc-ev,.tl-block,.tl-grid')) closeEditor(); }, true);
  $('beCancel').onclick = closeEditor;
  $('beSave').onclick = () => {
    if (!editing) return;
    const text = $('beTitle').value.trim(), start = $('beStart').value, end = $('beEnd').value;
    if (!text) return toast('내용을 입력하세요');
    if (editing.r.section === '타임라인' && (!start || !end)) return toast('시작과 종료 시각을 입력하세요');
    if ((end && !start) || (start && end && toMin(end) <= toMin(start))) return toast('종료 시각이 시작보다 뒤여야 합니다');
    if (editing.isNew) addRow({ ...editing.r, text, start, end }); else updateRow(editing.r, { text, start, end });
    closeEditor(); renderTimeline(); renderShared();
  };
  $('beDelete').onclick = () => { if (editing && !editing.isNew) deleteRow(editing.r); closeEditor(); renderTimeline(); renderShared(); };
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
  function publishingFor(d) {
    const c = state.calendar; if (!c) return null;
    const [y, m, day] = d.split('-').map(Number);
    if (m !== c.month) return null;
    const items = c.days[day] || [];
    const w = el(`<div class="today-pub">${items.length ? items.map(chip).join('') : '<span class="note-empty">발행 예정 없음</span>'}</div>`);
    return w;
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
  }
  const personInfo = () => C.PEOPLE.find(p => p.name === state.person);
  function renderPeople() {
    const make = () => C.PEOPLE.map(p => {
      const b = el(`<button class="${p.name === state.person ? 'active' : ''}">${esc(p.name)}${p.sheet ? '' : '<small>연결 대기</small>'}</button>`);
      b.onclick = () => { if (p.name === state.person) return setView('daily'); state.person = p.name; localStorage.person = p.name; state.rows = []; state.expanded.clear(); setView('daily'); load(); };
      return b;
    });
    $('subnav').replaceChildren(...make()); $('peopleM').replaceChildren(...make());
  }
  function setView(v) {
    state.view = v;
    document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === v));
    $('viewDaily').classList.toggle('hidden', v !== 'daily');
    $('viewCalendar').classList.toggle('hidden', v !== 'calendar');
    $('viewRevenue').classList.toggle('hidden', v !== 'revenue');
    $('viewDirector').classList.toggle('hidden', v !== 'director');
    if (v === 'director') { renderDirector(); loadDirector(); }
    window.document.querySelector('.topbar').classList.toggle('hidden', v !== 'daily');
    if (v === 'calendar') window.ContentHub.open();
    if (v === 'revenue') window.RevenueHub.open();
  }
  function render() { renderDatestrip(); renderShared(); renderReport(); renderTimeline(); $('btnCollapse').classList.toggle('on', state.collapse); $('btnCollapse').setAttribute('aria-pressed', state.collapse); $('btnDoneSort').classList.toggle('on', state.doneLast); $('btnDoneSort').setAttribute('aria-pressed', state.doneLast); }

  document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => setView(b.dataset.view));
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
  $('btnDoneSort').onclick = () => { state.doneLast = !state.doneLast; localStorage.doneSort = state.doneLast ? 'bottom' : 'keep'; render(); };
  $('btnCollapse').onclick = () => { state.collapse = !state.collapse; localStorage.collapse = state.collapse ? '1' : '0'; state.expanded.clear(); render(); };
  $('btnPrint').onclick = () => { setView('daily'); print(); };
  $('btnReload').onclick = () => load();
  // A4 한 장 맞춤: 인쇄 폭(194mm)으로 잰 높이가 한 장(281mm)을 넘으면 그만큼 축소
  addEventListener('beforeprint', () => {
    if (state.view !== 'daily') setView('daily');
    document.documentElement.classList.add('printing');
    const mm = 96 / 25.4, h = $('report').scrollHeight;
    document.documentElement.style.setProperty('--print-zoom', Math.min(1, (279 * mm) / h).toFixed(3));
  });
  addEventListener('afterprint', () => document.documentElement.classList.remove('printing'));
  /* ---------- 공통 캘린더 · 공통 업무 (아르스킨 공통 시트, 모든 사람 보고서 상단에 동일하게 표시) ---------- */
  const SHARED = '공통';
  const weekStart = d => { const x = new Date(d + 'T00:00:00'); x.setDate(x.getDate() - (x.getDay() + 6) % 7); return iso(x); };
  // 옛 배포(v1)는 who 를 무시하고 전성환 시트에 쓰므로, v2 확인 전에는 다른 사람·공통 데이터를 막는다
  let backendOk = null;
  const checkBackend = async () => backendOk ??= await api.get({ action: 'ping' }).then(j => j.v >= 2).catch(() => false);
  async function loadShared() {
    if (!(await checkBackend())) { state.shared = []; return renderShared(); }
    const anchor = state.sharedAnchor || state.sel, ws = weekStart(anchor);
    const monthEnd = iso(new Date(+anchor.slice(0, 4), +anchor.slice(5, 7), 0));
    const from = ['2026-10-01', ws].sort()[0], to = [monthEnd, shiftDate(ws, 4), todayKst()].sort().pop();
    const requested = anchor;

    try { const result = await api.get({ who: SHARED, from, to }); if (requested !== (state.sharedAnchor || state.sel)) return; state.shared = result.rows.map(r => ({ ...r, _who: SHARED })); }
    catch (e) { toast('공통 데이터 불러오기 실패: ' + e.message); return; }
    renderShared();
  }
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
    tasks.hidden = false;
    const anchor = state.sharedAnchor || state.sel, ws = weekStart(anchor), today = todayKst();
    const monthly = state.sharedMode === 'month', month = anchor.slice(0, 7);
    cal.classList.toggle('sc-collapsed', state.sharedCollapsed);
    cal.classList.toggle('sc-month-view', monthly);
    cal.innerHTML = `<div class="sc-header"><div><b>마케팅 공용 캘린더</b><small>${monthly ? month.replace('-', '년 ') + '월' : ws.slice(5).replace('-', '.') + ' ~ ' + shiftDate(ws, 4).slice(5).replace('-', '.')} · 월~금</small></div><div class="sc-mode" role="group" aria-label="캘린더 보기"><button data-mode="week" aria-pressed="${!monthly}">주간</button><button data-mode="month" aria-pressed="${monthly}">월간</button></div><button type="button" class="more sc-holbtn">휴일 관리</button></div>`;
    cal.querySelector('.sc-holbtn').onclick = openHolidays;
    const who = el(`<div class="sc-who" role="group" aria-label="담당자 필터">${['', ...C.PEOPLE.map(p => p.name)].map(n => `<button type="button" data-who="${esc(n)}" aria-pressed="${state.calWho === n}">${n ? esc(n) : '전체'}</button>`).join('')}</div>`);
    who.onclick = e => { const b = e.target.closest('[data-who]'); if (!b) return; state.calWho = b.dataset.who; try { localStorage.calWho = state.calWho; } catch {} renderShared(); };
    cal.querySelector('.sc-header').after(who);
    cal.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => switchCalMode(b.dataset.mode));
    const body = el('<div class="sc-body" id="sharedCalendarBody"></div>');
    const nav = el(`<div class="sc-navigation"><button type="button" aria-label="이전 ${monthly ? '달' : '주'}">‹ 이전 ${monthly ? '달' : '주'}</button><button type="button">${monthly ? '이번 달' : '이번 주'}</button><button type="button" aria-label="다음 ${monthly ? '달' : '주'}">다음 ${monthly ? '달' : '주'} ›</button></div>`);
    [...nav.children].forEach((b, i) => b.onclick = () => { state.sharedAnchor = i === 1 ? today : monthly ? iso(new Date(+anchor.slice(0, 4), +anchor.slice(5, 7) - 1 + (i === 0 ? -1 : 1), 1)) : shiftDate(ws, i === 0 ? -7 : 7); renderShared(); loadShared(); });
    body.append(nav);
    const grid = el(`<div class="sc-week${monthly ? ' sc-month' : ''}" role="group" aria-label="${monthly ? '월간' : '주간'} 평일 일정"></div>`);
    const dates = [];
    if (monthly) {
      const first = month + '-01', end = iso(new Date(+anchor.slice(0, 4), +anchor.slice(5, 7), 0));
      const lastWeek = weekStart(end);
      for (let w = weekStart(first); w <= lastWeek; w = shiftDate(w, 7)) for (let i = 0; i < 5; i++) dates.push(shiftDate(w, i));
    } else for (let i = 0; i < 5; i++) dates.push(shiftDate(ws, i));
    dates.forEach(d => {
      const dt = new Date(d + 'T00:00:00'), outside = monthly && !d.startsWith(month);
      const col = el(`<div class="sc-day${d === today ? ' today' : ''}${d === state.sel ? ' sel' : ''}${outside ? ' sc-outside' : ''}" data-date="${d}"><button type="button" class="sc-date" aria-label="${d} 보고서 보기"><span>${WD[dt.getDay()]}</span><b>${dt.getDate()}</b>${state.holidays[d] ? `<em class="sc-hol">${esc(state.holidays[d].name)}</em>` : ''}</button></div>`);
      col.querySelector('.sc-date').onclick = () => { // 캘린더 → 그날 보고서
        if (!state.dates.includes(d)) return toast('보고서는 최근 근무일 5일만 볼 수 있습니다');
        state.sel = d; render(); $('report').scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
      if (state.holidays[d]) col.classList.add('holiday');
      if (!outside) {
        state.shared.filter(r => r.section === '일정' && r.date === d && (!state.calWho || r.col === state.calWho)).sort((a, b) => (a.start || '').localeCompare(b.start || '')).forEach(r => {
          const wrap = el(`<div class="sc-ev-wrap${isDone(r) ? ' done' : ''}"><input type="checkbox" aria-label="${esc(r.text)} 완료"${isDone(r) ? ' checked' : ''}><button class="sc-ev"><small>${esc(r.start || '시간 미정')}${r.end ? '–' + esc(r.end) : ''}</small><span>${esc(r.text)}</span></button></div>`);
          const ev = wrap.querySelector('.sc-ev');
          ev.title = `${r.start || ''}${r.end ? '~' + r.end : ''} ${r.text}${r.col ? ' · ' + r.col : ''}`;
          ev.onclick = () => openEditor(r, ev);
          wrap.querySelector('input').onchange = e => { updateRow(r, { status: e.target.checked ? 'done' : '' }); renderShared(); renderTimeline(); };
          col.append(wrap);
        });
        const add = el(`<button class="sc-add" title="${d} 일정 추가" aria-label="${d} 일정 추가">+</button>`);
        add.onclick = () => openEditor({ date: d, section: '일정', col: state.person, start: '10:00', end: '11:00', text: '', _who: SHARED }, add, true);
        col.append(add);
      }
      grid.append(col);
    });
    body.append(grid);
    const notes = state.shared.filter(r => r.section === '일정메모' && (monthly ? r.date.startsWith(month) : r.date >= ws && r.date <= shiftDate(ws, 4)));
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
    // 일일보고에 반복 기록된 업무는 가장 최근 상태를 표시하고 원본 이력은 시트에 보존한다.
    const latest = new Map();
    // 장식용 앞 기호와 공백만 무시한다. 내용이 다른 업무는 각각 유지한다.
    const taskKey = text => text.normalize('NFKC').replace(/^[^\p{L}\p{N}]+/u, '').replace(/\s+/g, '').toLocaleLowerCase('ko');
    state.shared.filter(r => r.section === '공통업무' && r.date <= state.sel && taskKey(r.text))
      .sort((a, b) => a.date.localeCompare(b.date) || (a.updated || '').localeCompare(b.updated || '') || a.id.localeCompare(b.id))
      .forEach(r => latest.set(taskKey(r.text), r));
    const list = el('<div class="shared-task-grid" role="group" aria-label="공통 업무 목록"></div>');
    const latestRows = [...latest.values()], lateS = r => state.doneLast && isDone(r) && !sortHold.has(r.id);
    const catOf = r => r.text.match(CAT_RE)?.[1] || '';
    const cats = [...new Set(latestRows.map(catOf).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ko'));
    // 카테고리 정렬·필터: '전체'는 카테고리 이름순으로 묶어 보여주고, 칩을 누르면 그 카테고리만
    const bar = el(`<div class="cat-bar" role="group" aria-label="카테고리 필터">${['', ...cats].map(c => `<button type="button" data-cat="${esc(c)}" aria-pressed="${state.sharedCat === c}">${c ? esc(c) : '전체'}</button>`).join('')}</div>`);
    bar.onclick = e => { const b = e.target.closest('[data-cat]'); if (!b) return; state.sharedCat = b.dataset.cat; renderShared(); };
    if (cats.length) tasks.append(bar);
    const shown = latestRows.filter(r => !state.sharedCat || catOf(r) === state.sharedCat).sort((a, b) => (catOf(a) || '\uffff').localeCompare(catOf(b) || '\uffff', 'ko')); // 분류 없는 업무는 뒤로
    [...shown.filter(r => !lateS(r)), ...shown.filter(lateS)].forEach(r => list.append(itemRow(r)));
    tasks.querySelector('.sec-count').textContent = `${[...latest.values()].filter(r => !isDone(r)).length}건 진행`;
    tasks.append(list);
    // 등록할 때 카테고리를 고르거나 새로 입력 → '분류) 내용' 형식으로 저장
    const form = el(`<form class="cat-add"><input class="cat-in" list="catList" placeholder="분류" aria-label="카테고리" value="${esc(state.sharedCat)}" maxlength="12"><datalist id="catList">${cats.map(c => `<option value="${esc(c)}">`).join('')}</datalist><input class="txt-in" placeholder="+ 공통 업무 추가 (Enter)" aria-label="공통 업무 내용"><button type="submit" hidden>추가</button></form>`);
    form.onsubmit = e => {
      e.preventDefault(); const [ci, ti] = form.querySelectorAll('input'); const t = ti.value.trim(); if (!t) return;
      const c = ci.value.trim().replace(/[)\s]/g, '');
      addRow({ date: today, section: '공통업무', col: state.person, text: c ? `${c}) ${t}` : t, status: 'todo', _who: SHARED }); render();
      document.querySelector('.cat-add .txt-in')?.focus();
    };
    form.querySelector('.txt-in').onkeydown = e => { if (e.isComposing) e.stopPropagation(); if (e.key === 'Escape') e.target.value = ''; };
    tasks.append(form);
  }
  setInterval(() => { if (!document.hidden) loadShared(); }, 60000); // 다른 팀원 변경분 반영
  addEventListener('focus', () => loadShared());

  const setHolidays = list => { state.holidays = {}; (list || []).forEach(h => { state.holidays[h.date] = h; }); };
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
  async function load() {
    if (!state.holidays) { state.holidays = {}; await api.get({ action: 'holidays' }).then(j => setHolidays(j.holidays)).catch(() => {}); } // 옛 서버면 빈 목록
    state.dates = workDates(C.DAYS); state.sel = state.sel || state.dates[state.dates.length - 1];
    renderPeople(); loadShared();
    $('sheetLink').href = `https://docs.google.com/spreadsheets/d/${personInfo().sheet}/edit`;
    if (state.person !== C.DEFAULT_PERSON && !(await checkBackend())) {
      state.rows = []; renderDatestrip(); $('timeline').innerHTML = '';
      $('report').innerHTML = `<div class="empty-note"><b>${esc(state.person)}</b>님 시트는 연결됐지만 Apps Script가 옛 버전입니다.<br><small>apps-script/Code.gs 를 붙여넣고 새 버전으로 재배포하면 열립니다.</small></div>`;
      return;
    }
    if (!personInfo().sheet) { // 시트 미연결: 다른 사람 데이터를 실수로 보여주지 않도록 요청 자체를 안 보낸다
      state.rows = []; renderDatestrip(); $('timeline').innerHTML = '';
      $('report').innerHTML = `<div class="empty-note"><b>${esc(state.person)}</b>님 일일보고 시트가 아직 연결되지 않았습니다.<br><small>공유 시트 링크를 전달해 주시면 연결됩니다.</small></div>`;
      return;
    }
    const asked = state.person;
    $('report').innerHTML = '<div class="empty-note">불러오는 중…</div>';
    try { const rows = (await api.get({ from: state.dates[0], to: state.dates[state.dates.length - 1] })).rows; if (asked !== state.person) return; state.rows = rows; }
    catch (e) { $('report').innerHTML = `<div class="empty-note">데이터를 불러오지 못했습니다.<br><small>${esc(e.message)}</small><br><small>config.js 의 API_URL / API_KEY 와 Apps Script 배포(액세스: 모든 사용자)를 확인하세요.</small></div>`; return; }
    render();
    const today = todayKst(); // 00:05 트리거가 못 돌았을 때 보완 생성 (서버가 멱등 처리)
    if (isWorkday(today) && !state.rows.some(r => r.date === today)) api.post({ action: 'generate', date: today }).then(j => { if (j.rows?.length && asked === state.person) { state.rows.push(...j.rows); render(); } }).catch(() => {});
    api.get({ action: 'calendar' }).then(j => { state.calendar = parseCalendar(j.grid); if (state.view === 'daily') renderReport(); }).catch(() => {});
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
    if (state.view === 'director') renderDirector(); else paintDirBadge();
  }
  async function saveDirector(body) {
    try { state.dir.tasks = (await api.post(body)).tasks; } catch (e) { toast(e.message); }
    renderDirector();
  }
  function renderDirector() {
    const box = $('directorHub'), { tasks, me } = state.dir, isDir = me === DIRECTOR, seen = dirSeen();
    const count = k => tasks.filter(t => t.status === k).length;
    box.innerHTML = `<div class="dir-head"><h1>원장님 숙제</h1><p>마케터가 원장님께 드리는 숙제입니다. 누구나 쓰고 고칠 수 있고, 승인·거절은 원장님만 할 수 있습니다.</p></div>
      <div class="dir-sum">${Object.keys(DIR_ST).map(k => `<span class="dir-pill d-${k}">${DIR_ST[k]} <b>${count(k)}</b></span>`).join('')}</div>
      <form class="dir-add"><input name="text" placeholder="원장님께 드릴 숙제" aria-label="숙제 내용" maxlength="500" required><input name="due" type="date" aria-label="마감일"><button class="primary">추가</button></form>`;
    box.querySelector('form').onsubmit = e => { e.preventDefault(); const f = e.target; saveDirector({ action: 'directorSave', task: { text: f.text.value, due: f.due.value } }); };
    [['pending', '대기 중'], ['approved', '승인됨'], ['done', '완료'], ['rejected', '거절됨']].forEach(([k, label]) => {
      const list = tasks.filter(t => t.status === k).sort((a, b) => (b.updated > a.updated ? 1 : -1));
      if (!list.length) return;
      const g = el(`<section class="sec dir-group"><h3>${label} <small>${list.length}</small></h3></section>`);
      list.forEach(t => {
        const fresh = t.author === me && (k === 'approved' || k === 'rejected') && t.updated > seen;
        const meta = [`작성 ${esc(t.author)}`, t.created.slice(5).replace('-', '.'), t.due && `마감 ${t.due.slice(5).replace('-', '.')}`, t.decided && k !== 'pending' && `결정 ${t.decided.slice(5).replace('-', '.')}`].filter(Boolean).join(' · ');
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
      <dt><kbd>Esc</kbd></dt><dd>수정 취소, 창·메뉴 닫기</dd><dt><kbd>Space</kbd></dt><dd>상태 버튼에서 다음 상태로</dd><dt><kbd>Shift</kbd>+<kbd>F10</kbd></dt><dd>상태 선택 메뉴</dd><dt><kbd>?</kbd></dt><dd>이 도움말</dd></dl>
      <button type="button" class="primary">닫기</button></dialog>`);
    dlg.querySelector('button').onclick = () => dlg.close(); dlg.onclose = () => dlg.remove();
    document.body.append(dlg); dlg.showModal();
  }
  document.addEventListener('keydown', e => {
    if (e.isComposing || e.ctrlKey || e.metaKey || e.altKey || typing(e.target) || document.querySelector('dialog[open]')) return;
    if (e.key === '?') { e.preventDefault(); openShortcuts(); }
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
    list.innerHTML = rows.length ? rows.map((r, i) => `<label class="tr-item"><input type="checkbox" data-i="${i}"><span><b>${esc(r.text) || '(내용 없음)'}</b><small>${esc(r.who)} · ${esc(r.section)} · ${r.date.slice(5).replace('-', '.')} 업무 · ${new Date(r.deletedAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })} 삭제</small></span></label>`).join('') : '<p class="tr-empty">휴지통이 비어 있습니다.</p>';
    list.onchange = () => { btn.disabled = !list.querySelector(':checked'); };
    btn.onclick = async () => {
      const keys = [...list.querySelectorAll(':checked')].map(c => rows[c.dataset.i].deletedAt + '|' + rows[c.dataset.i].id);
      btn.disabled = true;
      try { const j = await api.post({ action: 'trashRestore', keys }); toast(`${j.restored}개 복원했습니다`); dlg.close(); load(); loadShared(); } catch (e) { toast(e.message); btn.disabled = false; }
    };
  }
  $('btnTrash').onclick = openTrash;

  load();
  loadDirector();
  setView('calendar');
})();
