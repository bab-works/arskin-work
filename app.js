(() => {
  const C = window.CONFIG;
  const STATUSES = ['🔷', '▶️', '⭕', '⏸️', '🔄'];
  const TASK_SECTIONS = [
    { key: '마케팅공통', L: '마케팅 공통', R: '마케팅 추가 업무' },
    { key: '주간고정', L: '주간고정', R: '주간고정 완료' },
    { key: '데일리고정', L: '데일리 고정업무', R: '' },
    { key: '배치예정', L: '업무 배치 예정', R: '' },
    { key: '팔로업', L: '🔥 진행중 작업 팔로업', R: '' },
    { key: '변동업무', L: '변동업무', R: '변동업무 진행중&완료' },
    { key: '릴스업무', L: '릴스 업무', R: '릴스 완료' },
  ];
  const TASK_KEYS = new Set(TASK_SECTIONS.map(s => s.key));
  const WD = ['일', '월', '화', '수', '목', '금', '토'];
  const state = { shared: [], person: (C.PEOPLE.find(p => p.name === localStorage.person) || C.PEOPLE.find(p => p.name === C.DEFAULT_PERSON) || C.PEOPLE[0]).name, rows: [], dates: [], sel: null, view: 'daily', collapse: localStorage.collapse === '1', expanded: new Set(), calendar: null };

  /* ---------- utils ---------- */
  const pad = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const shiftDate = (s, n) => { const d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); return iso(d); };
  const fmtDate = s => { const d = new Date(s + 'T00:00:00'); return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()} (${WD[d.getDay()]})`; };
  function workDates(n) { // 당일 + 이전 근무일(월~금)
    const out = []; const d = new Date(); out.push(iso(d));
    while (out.length < n) { d.setDate(d.getDate() - 1); if (d.getDay() % 6) out.push(iso(d)); }
    return out.reverse();
  }
  const newId = date => `${date.replace(/-/g, '')}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const el = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; };
  const $ = id => document.getElementById(id);
  const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const toTime = m => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
  function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.remove('hidden'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.add('hidden'), 2500); }

  /* ---------- api (Apps Script) ---------- */
  const api = {
    async get(params) {
      const u = new URL(C.API_URL);
      Object.entries({ key: C.API_KEY, who: state.person, ...params }).forEach(([k, v]) => u.searchParams.set(k, v));
      const j = await (await fetch(u)).json();
      if (j.error) throw new Error(j.error);
      return j;
    },
    async post(body) { // text/plain body → CORS preflight 없이 Apps Script 로 전달
      const j = await (await fetch(C.API_URL, { method: 'POST', body: JSON.stringify({ key: C.API_KEY, who: state.person, ...body }) })).json();
      if (j.error) throw new Error(j.error);
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
  function deleteRow(r) { if (r._who) state.shared = state.shared.filter(x => x !== r); else state.rows = state.rows.filter(x => x !== r); removeIds([r.date + '|' + r.id], r._who); }
  const rowsFor = (date, section, col) => state.rows.filter(r => r.date === date && r.section === section && (col === undefined || r.col === col));
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

  function itemRow(r, opts = {}) {
    const row = el(`<div class="row${r.status === '⭕' ? ' done' : ''}"></div>`);
    if (!opts.noStatus) {
      const st = el(`<button class="st" title="상태 변경">${r.status || '·'}</button>`);
      st.onclick = () => { const i = STATUSES.indexOf(r.status); updateRow(r, { status: STATUSES[(i + 1) % STATUSES.length] }); render(); };
      row.append(st);
    }
    const tx = el(`<div class="tx" contenteditable="plaintext-only"></div>`); tx.textContent = r.text;
    tx.onblur = () => { const v = tx.textContent.trim(); if (!v) { deleteRow(r); render(); } else if (v !== r.text) updateRow(r, { text: v }); };
    tx.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); tx.blur(); } };
    const del = el(`<button class="del" title="삭제">×</button>`);
    del.onclick = () => { deleteRow(r); render(); };
    row.append(tx, del); return row;
  }
  function addInput(onAdd, ph = '+ 추가 (Enter)') {
    const w = el(`<div class="add"><input placeholder="${ph}"></div>`); const i = w.firstChild;
    i.onkeydown = e => { if (e.key === 'Enter' && i.value.trim()) { onAdd(i.value.trim()); i.value = ''; render(); } };
    return w;
  }
  function itemList(date, section, col, opts = {}) {
    const box = document.createElement('div');
    const rows = rowsFor(date, section, col);
    const key = date + section + col;
    const hide = state.collapse && TASK_KEYS.has(section) && !state.expanded.has(key);
    let hidden = 0;
    rows.forEach(r => { const n = itemRow(r, opts); if (hide && r.status === '⭕') { n.classList.add('collapsed'); hidden++; } box.append(n); });
    if (hidden) { const m = el(`<button class="more">… 완료 ${hidden}건 보기</button>`); m.onclick = () => { state.expanded.add(key); render(); }; box.append(m); }
    box.append(addInput(text => addRow({ date, section, col, text, status: opts.noStatus ? '' : (opts.defaultStatus || '🔷') })));
    return box;
  }
  function taskSection(d, s) {
    const cols = el('<div class="cols"></div>');
    [['L', s.L], ['R', s.R || s.L]].forEach(([col, label]) => {
      const c = el(`<div class="col"><h4>${esc(label)}</h4></div>`); c.append(itemList(d, s.key, col)); cols.append(c);
    });
    return sec(s.L, cols);
  }
  function meetingBlock(d) {
    const t = el('<table class="meet"><tr></tr><tr></tr></table>');
    const [h, b] = t.rows;
    ['월', '화', '수', '목', '금'].forEach((w, i) => {
      h.append(el(`<th class="${i === 0 ? 'mon' : ''}">${w}</th>`));
      const td = document.createElement('td');
      td.append(textarea('tx', cellText(d, '회의', w), v => setCellText(d, '회의', w, v), '')); b.append(td);
    });
    const list = document.createElement('div');
    list.append(el('<h4 style="margin:8px 0 2px;font-size:12px;color:#444">금주 일정</h4>'));
    [...rowsFor(d, '회의', '일정'), ...rowsFor(d, '회의일정')].forEach(r => list.append(itemRow(r, { noStatus: !r.status })));
    list.append(addInput(text => addRow({ date: d, section: '회의', col: '일정', text }), '+ 일정 추가'));
    const wrap = document.createElement('div'); wrap.append(t, list); return wrap;
  }
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
  function renderReport() {
    const d = state.sel, box = $('report'); box.innerHTML = '';
    if (!state.rows.some(r => r.date === d)) {
      box.append(el(`<div class="empty-note">${fmtDate(d)} 보고서가 비어 있습니다.<br><button id="emptyCarry" class="primary">⤵ 직전 근무일 항목 가져오기</button> <button id="emptyNew">빈 보고서 시작</button></div>`));
      $('emptyCarry').onclick = carryForward;
      $('emptyNew').onclick = () => { addRow({ date: d, section: '메모', text: ' ' }); render(); };
      return;
    }
    box.append(el(`<div class="titlebar"><span>업무보고 및 회의록</span><span class="meta">${fmtDate(d)} · ${esc(state.person)}</span></div>`));
    box.append(sec('메모 · 회의록', textarea('memo', cellText(d, '메모', ''), v => setCellText(d, '메모', '', v), '메모')));
    box.append(sec('회의', meetingBlock(d)));
    TASK_SECTIONS.forEach(s => box.append(taskSection(d, s)));
    box.append(sec('원장님 완료', cellGrid(d, '원장님완료', ['월', '화', '수', '목', '금'].map(w => [w, w]), 'grid5', 'text')));
    box.append(sec('원장님 업무리스트업', cellGrid(d, '원장님리스트', [['원개블', '원개블'], ['그외', '그외'], ['릴스촬영', '릴스 촬영 리스트업']], 'grid3', 'list')));
    box.append(sec('원장님 숙제', cellGrid(d, '원장님숙제', [['영어', '영상숙제(영어)'], ['영상', '영상숙제']], 'cols', 'text')));
    const pub = publishingFor(d);
    if (pub) box.append(sec('오늘 발행 (콘텐츠 캘린더)', pub));
    box.querySelectorAll('textarea').forEach(autosize);
  }

  async function carryForward() {
    const d = state.sel;
    let src = state.rows.filter(r => r.date < d).map(r => r.date).sort().pop();
    let srcRows;
    if (src) srcRows = state.rows.filter(r => r.date === src);
    else {
      const j = await api.get({ from: shiftDate(d, -30), to: shiftDate(d, -1) }).catch(e => (toast(e.message), null));
      if (!j) return;
      src = j.rows.map(r => r.date).sort().pop();
      if (!src) return toast('가져올 이전 보고서가 없습니다');
      srcRows = j.rows.filter(r => r.date === src);
    }
    if (!confirm(`${src} 항목을 ${d}(으)로 가져올까요?\n(완료 ⭕ 업무와 타임라인은 제외, 데일리 고정업무는 시작 전으로 초기화)`)) return;
    const copies = srcRows
      .filter(r => r.section !== '타임라인' && !(TASK_KEYS.has(r.section) && r.status === '⭕'))
      .map(r => ({ ...r, id: newId(d), date: d, status: r.section === '데일리고정' ? '🔷' : r.status }));
    state.rows.push(...copies);
    await save(copies);
    render();
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
  $('beCancel').onclick = closeEditor;
  $('beSave').onclick = () => {
    if (!editing) return;
    const text = $('beTitle').value.trim(), start = $('beStart').value, end = $('beEnd').value;
    if (!text) return toast('내용을 입력하세요');
    if (!start || !end || toMin(end) <= toMin(start)) return toast('종료 시각이 시작보다 뒤여야 합니다');
    if (editing.isNew) addRow({ ...editing.r, text, start, end }); else updateRow(editing.r, { text, start, end });
    closeEditor(); renderTimeline(); renderShared();
  };
  $('beDelete').onclick = () => { if (editing && !editing.isNew) deleteRow(editing.r); closeEditor(); renderTimeline(); renderShared(); };
  $('beTitle').onkeydown = e => { if (e.key === 'Enter') $('beSave').click(); if (e.key === 'Escape') closeEditor(); };

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
    const w = el(`<div class="today-pub">${items.length ? items.map(chip).join('') : '<span style="color:#999">발행 예정 없음</span>'}</div>`);
    return w;
  }
  function renderCalendar() {
    const box = $('calendar'); box.innerHTML = '';
    const c = state.calendar;
    if (!c) { box.append(el('<div class="empty-note">캘린더를 불러오는 중…</div>')); return; }
    const y = new Date().getFullYear(), m = c.month;
    box.append(el(`<div class="cal-title">${y}년 ${m}월 콘텐츠 캘린더 <small style="font-weight:400;color:#777">(아르스킨 인스타 관리 시트)</small></div>`));
    const first = new Date(y, m - 1, 1).getDay(), last = new Date(y, m, 0).getDate(), today = iso(new Date());
    const cal = el('<div class="cal"></div>');
    WD.forEach(w => cal.append(el(`<div class="dow">${w}</div>`)));
    for (let i = 0; i < first; i++) cal.append(el('<div></div>'));
    const list = el('<div class="cal-list"></div>');
    for (let d = 1; d <= last; d++) {
      const items = c.days[d] || [];
      const isT = today === `${y}-${pad(m)}-${pad(d)}`;
      cal.append(el(`<div class="day${isT ? ' today' : ''}"><b>${d}</b>${items.map(chip).join('')}</div>`));
      if (items.length) list.append(el(`<div class="d"><b>${m}/${d} (${WD[new Date(y, m - 1, d).getDay()]})</b>${items.map(chip).join('')}</div>`));
    }
    box.append(cal, list);
  }

  /* ---------- print-only layout: 시트처럼 좌/우 항목을 한 줄씩 짝지은 표 (행 단위로만 페이지 분할) ---------- */
  function renderPrint() {
    const d = state.sel, box = $('printReport'); box.innerHTML = '';
    if (!state.rows.some(r => r.date === d)) return;
    const cellHtml = r => r ? `<td>${r.status ? `<span class="pst">${esc(r.status)}</span>` : ''}${esc(r.text)}</td>` : '<td></td>';
    const pairTable = (labels, lists) => {
      const n = Math.max(...lists.map(l => l.length), 1);
      let h = `<table class="pt"><thead><tr>${labels.map(l => `<th>${esc(l)}</th>`).join('')}</tr></thead><tbody>`;
      for (let i = 0; i < n; i++) h += `<tr>${lists.map(l => cellHtml(l[i])).join('')}</tr>`;
      return h + '</tbody></table>';
    };
    const textTable = (labels, texts) => `<table class="pt"><thead><tr>${labels.map(l => `<th>${esc(l)}</th>`).join('')}</tr></thead><tbody><tr>${texts.map(t => `<td class="pre">${esc(t)}</td>`).join('')}</tr></tbody></table>`;
    let h = `<div class="titlebar"><span>업무보고 및 회의록</span><span class="meta">${fmtDate(d)} · ${esc(state.person)}</span></div>`;
    const memo = cellText(d, '메모', '').trim();
    if (memo) h += `<div class="pmemo">${esc(memo)}</div>`;
    h += `<h3>회의</h3>` + textTable(['월', '화', '수', '목', '금'], ['월', '화', '수', '목', '금'].map(w => cellText(d, '회의', w)));
    const sched = [...rowsFor(d, '회의', '일정'), ...rowsFor(d, '회의일정')];
    if (sched.length) h += pairTable(['금주 일정'], [sched]);
    TASK_SECTIONS.forEach(s => h += `<h3>${esc(s.L)}</h3>` + pairTable([s.L, s.R || s.L], [rowsFor(d, s.key, 'L'), rowsFor(d, s.key, 'R')]));
    h += `<h3>원장님 완료</h3>` + textTable(['월', '화', '수', '목', '금'], ['월', '화', '수', '목', '금'].map(w => cellText(d, '원장님완료', w)));
    h += `<h3>원장님 업무리스트업</h3>` + pairTable(['원개블', '그외', '릴스 촬영 리스트업'], ['원개블', '그외', '릴스촬영'].map(c => rowsFor(d, '원장님리스트', c)));
    h += `<h3>원장님 숙제</h3>` + textTable(['영상숙제(영어)', '영상숙제'], ['영어', '영상'].map(c => cellText(d, '원장님숙제', c)));
    box.innerHTML = h;
  }

  /* ---------- shell ---------- */
  function renderDatestrip() {
    const s = $('datestrip'); s.innerHTML = '';
    state.dates.forEach(d => {
      const dt = new Date(d + 'T00:00:00'); const has = state.rows.some(r => r.date === d);
      const b = el(`<button class="${d === state.sel ? 'active' : ''}${has ? '' : ' empty'}"><small>${WD[dt.getDay()]}</small><b>${dt.getDate()}</b></button>`);
      b.title = d; b.onclick = () => { const wk = weekStart(state.sel) !== weekStart(d); state.sel = d; render(); if (wk) loadShared(); };
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
    $('viewLegacy').classList.toggle('hidden', v !== 'legacy');
    if (v === 'legacy' && !$('legacyFrame').src) $('legacyFrame').src = C.LEGACY_URL; // 처음 열 때만 로드
    if (v === 'calendar') renderCalendar();
  }
  function render() { renderDatestrip(); renderShared(); renderReport(); renderTimeline(); renderPrint(); $('btnCollapse').classList.toggle('on', state.collapse); }

  document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => setView(b.dataset.view));
  document.querySelectorAll('[data-pane]').forEach(b => b.onclick = () => {
    document.querySelectorAll('[data-pane]').forEach(x => x.classList.toggle('active', x === b));
    $('report').parentElement.classList.toggle('hidden-m', b.dataset.pane !== 'report');
    $('timeline').classList.toggle('hidden-m', b.dataset.pane !== 'timeline');
  });
  $('btnCarry').onclick = carryForward;
  $('btnCollapse').onclick = () => { state.collapse = !state.collapse; localStorage.collapse = state.collapse ? '1' : '0'; state.expanded.clear(); render(); };
  $('btnPrint').onclick = () => print();
  $('btnReload').onclick = () => load();
  addEventListener('beforeprint', () => { if (state.view !== 'daily') setView('daily'); });
  $('legacyOpen').href = C.LEGACY_URL;

  /* ---------- 공통 캘린더 · 공통 업무 (아르스킨 공통 시트, 모든 사람 보고서 상단에 동일하게 표시) ---------- */
  const SHARED = '공통';
  const weekStart = d => { const x = new Date(d + 'T00:00:00'); x.setDate(x.getDate() - (x.getDay() + 6) % 7); return iso(x); };
  // 옛 배포(v1)는 who 를 무시하고 전성환 시트에 쓰므로, v2 확인 전에는 다른 사람·공통 데이터를 막는다
  let backendOk = null;
  const checkBackend = async () => backendOk ??= await api.get({ action: 'ping' }).then(j => j.v >= 2).catch(() => false);
  async function loadShared() {
    if (!(await checkBackend())) { state.shared = []; return renderShared(); }
    const ws = weekStart(state.sel), from = [ws, state.sel.slice(0, 8) + '01'].sort()[0], to = shiftDate(ws, 6);
    // shortcut: 공통 업무는 이번 달(+이번 주) 범위만 불러온다. 이월이 필요해지면 월 경계 처리 추가.
    try { state.shared = (await api.get({ who: SHARED, from, to: [to, state.sel].sort()[1] })).rows.map(r => ({ ...r, _who: SHARED })); }
    catch (e) { state.shared = []; }
    renderShared();
  }
  function renderShared() {
    const cal = $('sharedcal'), tasks = $('sharedtasks');
    if (!cal) return;
    if (backendOk === false) { cal.innerHTML = '<div class="sc-head"><b>공통 캘린더</b><small>Apps Script를 새 버전으로 재배포하면 켜집니다</small></div>'; tasks.hidden = true; return; }
    tasks.hidden = false;
    const ws = weekStart(state.sel), today = iso(new Date());
    cal.innerHTML = `<div class="sc-head"><b>공통 캘린더</b><small>${ws.slice(5).replace('-', '.')} 주 · 모든 팀원과 연동</small></div>`;
    const grid = el('<div class="sc-week"></div>');
    for (let i = 0; i < 7; i++) {
      const d = shiftDate(ws, i), dt = new Date(d + 'T00:00:00');
      const col = el(`<div class="sc-day${d === today ? ' today' : ''}${d === state.sel ? ' sel' : ''}${i > 4 ? ' wkend' : ''}"><div class="sc-date"><span>${WD[dt.getDay()]}</span><b>${dt.getDate()}</b></div></div>`);
      state.shared.filter(r => r.section === '일정' && r.date === d).sort((a, b) => (a.start || '').localeCompare(b.start || '')).forEach(r => {
        const ev = el(`<button class="sc-ev"><small>${esc(r.start)}</small>${esc(r.text)}</button>`);
        ev.title = `${r.start}~${r.end} ${r.text}${r.col ? ' · ' + r.col : ''}`;
        ev.onclick = () => openEditor(r, ev);
        col.append(ev);
      });
      const add = el('<button class="sc-add" title="일정 추가">+</button>');
      add.onclick = () => openEditor({ date: d, section: '일정', col: state.person, start: '10:00', end: '11:00', text: '', _who: SHARED }, add, true);
      col.append(add); grid.append(col);
    }
    cal.append(grid);
    tasks.innerHTML = '<h3>공통 업무</h3>';
    const list = state.shared.filter(r => r.section === '공통업무');
    list.forEach(r => tasks.append(itemRow(r)));
    tasks.append(addInput(text => addRow({ date: today, section: '공통업무', col: state.person, text, status: '🔷', _who: SHARED })));
  }
  setInterval(() => { if (!document.hidden) loadShared(); }, 60000); // 다른 팀원 변경분 반영
  addEventListener('focus', () => loadShared());

  async function load() {
    state.dates = workDates(C.DAYS); state.sel = state.sel || state.dates[state.dates.length - 1];
    renderPeople(); loadShared();
    $('sheetLink').href = `https://docs.google.com/spreadsheets/d/${personInfo().sheet}/edit`;
    if (state.person !== C.DEFAULT_PERSON && !(await checkBackend())) {
      state.rows = []; renderDatestrip(); $('timeline').innerHTML = ''; $('printReport').innerHTML = '';
      $('report').innerHTML = `<div class="empty-note"><b>${esc(state.person)}</b>님 시트는 연결됐지만 Apps Script가 옛 버전입니다.<br><small>apps-script/Code.gs 를 붙여넣고 새 버전으로 재배포하면 열립니다.</small></div>`;
      return;
    }
    if (!personInfo().sheet) { // 시트 미연결: 다른 사람 데이터를 실수로 보여주지 않도록 요청 자체를 안 보낸다
      state.rows = []; renderDatestrip(); $('timeline').innerHTML = ''; $('printReport').innerHTML = '';
      $('report').innerHTML = `<div class="empty-note"><b>${esc(state.person)}</b>님 일일보고 시트가 아직 연결되지 않았습니다.<br><small>공유 시트 링크를 전달해 주시면 연결됩니다.</small></div>`;
      return;
    }
    const asked = state.person;
    $('report').innerHTML = '<div class="empty-note">불러오는 중…</div>';
    try { const rows = (await api.get({ from: state.dates[0], to: state.dates[state.dates.length - 1] })).rows; if (asked !== state.person) return; state.rows = rows; }
    catch (e) { $('report').innerHTML = `<div class="empty-note">데이터를 불러오지 못했습니다.<br><small>${esc(e.message)}</small><br><small>config.js 의 API_URL / API_KEY 와 Apps Script 배포(액세스: 모든 사용자)를 확인하세요.</small></div>`; return; }
    render();
    api.get({ action: 'calendar' }).then(j => { state.calendar = parseCalendar(j.grid); if (state.view === 'calendar') renderCalendar(); else renderReport(); }).catch(() => {});
  }
  load();
})();
