// 개인 메모장: 접속코드 주인만 읽고 쓰는 메모(서버 action 'memo'). 목록 패널은 버튼으로 밀어 열고 닫는다.
(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const COLORS = ['#3182f6', '#1baf7a', '#eda100', '#eb6834', '#e5484d', '#e87ba4', '#6250d6', '#8b95a1'];
  const ls = (k, v) => { try { if (v === undefined) return localStorage[k]; localStorage[k] = v; } catch {} };
  const toast = m => { const t = $('appToast'); if (!t) return alert(m); t.textContent = m; t.classList.remove('hidden'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.add('hidden'), 2600); };
  async function call(body) {
    for (let n = 0; ; n++) {
      try {
        const j = await (await fetch(window.CONFIG.API_URL, { method: 'POST', body: JSON.stringify({ code: ls('accessCode') || '', action: 'memo', ...body }) })).json();
        if (j.error) throw new Error(j.error); return j;
      } catch (e) { if (n < 2 && /Failed to fetch|NetworkError|Load failed/i.test(e.message)) { await new Promise(r => setTimeout(r, 1200 * (n + 1))); continue; } throw e; }
    }
  }
  let host, data = null, cur = null, folder = ls('memoFolder') || '', q = '', mode = 'view', saveT = null, dirty = false, status = '';
  const imgCache = {};
  const newId = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const titleOf = n => (n.title || '').trim() || (n.text || '').split('\n').map(s => s.replace(/^[#>\-*\s\d.[\]x]+/, '').trim()).find(Boolean) || '제목 없음';
  const when = s => { if (!s) return ''; const d = new Date(s), t = new Date(); return d.toDateString() === t.toDateString() ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : `${d.getFullYear() === t.getFullYear() ? '' : d.getFullYear() + '. '}${d.getMonth() + 1}. ${d.getDate()}.`; };
  const fOf = id => data.folders.find(f => f.id === id);

  async function open() {
    host = $('memoHub');
    if (!data) { host.innerHTML = '<div class="mm-loading">메모 불러오는 중…</div>'; try { data = (await call({ op: 'load' })).data; } catch (e) { host.innerHTML = `<div class="mm-loading">메모를 불러오지 못했어요 <small>${esc(e.message)}</small> <button type="button" class="more">다시 시도</button></div>`; host.querySelector('.more').onclick = () => { data = null; open(); }; return; }
      const last = data.notes.find(n => n.id === ls('memoCur')) || [...data.notes].sort((a, b) => b.updated < a.updated ? -1 : 1)[0]; cur = last || null; mode = cur && cur.text ? 'view' : 'edit'; }
    if (folder && folder !== 'trash' && !fOf(folder)) folder = '';
    paint();
  }
  // 저장: 입력 1초 뒤 자동. 다른 메모로 가거나 화면을 떠날 때 즉시
  function queue() { dirty = true; setStatus('저장 중…'); clearTimeout(saveT); saveT = setTimeout(flush, 1000); }
  async function flush() {
    clearTimeout(saveT); if (!dirty || !cur) return; dirty = false;
    try { await saveNote(cur); setStatus('저장됨'); paintList(); }
    catch (e) { dirty = true; setStatus('저장 실패'); toast('메모 저장 실패: ' + e.message); }
  }
  const saveNote = n => call({ op: 'save', note: { id: n.id, title: n.title, folder: n.folder, text: n.text } }).then(r => { n.updated = r.note.updated; n.created = r.note.created; });
  const setStatus = s => { status = s; const el = host?.querySelector('.mm-status'); if (el) el.textContent = s; };
  addEventListener('beforeunload', e => { if (dirty) { flush(); e.preventDefault(); } });
  document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });

  function paint() {
    const openSide = ls('memoSide') === '1';
    host.innerHTML = `<div class="mm${openSide ? ' open' : ''}">
      <aside class="mm-side" aria-label="메모 목록"><div class="mm-side-in">
        <div class="mm-folders"><div class="mm-fhead"><b>폴더</b><button type="button" class="mm-fadd" title="새 폴더">+ 새 폴더</button></div><div class="mm-flist"></div></div>
        <input class="mm-search" type="search" placeholder="메모 검색" aria-label="메모 검색" value="${esc(q)}">
        <div class="mm-list" role="list"></div>
      </div></aside>
      <section class="mm-main"></section></div>`;
    host.querySelector('.mm-fadd').onclick = () => editFolder(null);
    host.querySelector('.mm-main').addEventListener('pointerdown', () => { if (innerWidth < 760 && host.querySelector('.mm.open')) toggleSide(); }, true); // 휴대폰: 목록 밖을 누르면 닫힘
    host.querySelector('.mm-search').oninput = e => { q = e.target.value.trim().toLowerCase(); paintList(); };
    paintFolders(); paintList(); paintMain();
  }
  function toggleSide() { const m = host.querySelector('.mm'), on = !m.classList.contains('open'); m.classList.toggle('open', on); ls('memoSide', on ? '1' : '0'); host.querySelector('.mm-listbtn')?.setAttribute('aria-expanded', on); }
  function paintFolders() {
    const box = host.querySelector('.mm-flist'), cnt = id => data.notes.filter(n => id === '' || n.folder === id).length;
    const item = (id, name, color, extra = '') => `<div class="mm-f${folder === id ? ' on' : ''}" data-f="${esc(id)}" role="button" tabindex="0"><i style="background:${esc(color)}"></i><span>${esc(name)}</span><small>${id === 'trash' ? data.trash.length : cnt(id)}</small>${extra}</div>`;
    box.innerHTML = item('', '전체 메모', '#4e5968') + data.folders.map(f => item(f.id, f.name, f.color, `<button type="button" class="mm-fedit" aria-label="${esc(f.name)} 폴더 편집" title="이름·색 바꾸기">✎</button>`)).join('') + item('trash', '휴지통', '#c4cad1');
    box.querySelectorAll('.mm-f').forEach(el => {
      const pick = () => { folder = el.dataset.f; ls('memoFolder', folder); paintFolders(); paintList(); };
      el.onclick = e => { if (e.target.closest('.mm-fedit')) return editFolder(fOf(el.dataset.f)); pick(); };
      el.onkeydown = e => { if (e.key === 'Enter') pick(); };
      if (el.dataset.f !== 'trash') { // 메모를 폴더로 끌어 놓기
        el.ondragover = e => { if (e.dataTransfer.types.includes('text/memo')) { e.preventDefault(); el.classList.add('drop'); } };
        el.ondragleave = () => el.classList.remove('drop');
        el.ondrop = e => { e.preventDefault(); el.classList.remove('drop'); const n = data.notes.find(x => x.id === e.dataTransfer.getData('text/memo')); if (n) moveTo(n, el.dataset.f); };
      }
    });
  }
  function moveTo(n, f) { n.folder = f; if (n === cur) { dirty = true; flush(); paintMain(); } else saveNote(n).catch(e => toast('이동 실패: ' + e.message)); paintFolders(); paintList(); toast(`'${titleOf(n)}' → ${fOf(f)?.name || '폴더 없음'}`); }
  function paintList() {
    const box = host?.querySelector('.mm-list'); if (!box) return;
    const trash = folder === 'trash', src = trash ? data.trash : data.notes.filter(n => !folder || n.folder === folder);
    const list = src.filter(n => !q || (titleOf(n) + '\n' + n.text).toLowerCase().includes(q)).sort((a, b) => ((trash ? b.deletedAt : b.updated) || '').localeCompare((trash ? a.deletedAt : a.updated) || ''));
    box.innerHTML = list.length ? list.map(n => { const f = fOf(n.folder), snip = (n.text || '').replace(/!\[[^\]]*\]\([^)]*\)/g, '(사진)').replace(/\[[ xX]\]|[#>*`~_|=\-[\]]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
      return `<div class="mm-item${cur && cur.id === n.id && !trash ? ' on' : ''}" role="listitem" data-id="${esc(n.id)}" ${trash ? '' : 'draggable="true"'} tabindex="0"><b>${esc(titleOf(n))}</b><small>${f && !folder ? `<i style="background:${esc(f.color)}"></i>${esc(f.name)} · ` : ''}${when(trash ? n.deletedAt : n.updated)}</small><p>${esc(snip)}</p>${trash ? `<div class="mm-tacts"><button type="button" data-restore>복원</button><button type="button" data-purge class="danger">영구 삭제</button></div>` : ''}</div>`; }).join('')
      : `<p class="mm-empty">${trash ? '휴지통이 비어 있어요. 지운 메모는 30일 보관됩니다.' : q ? '검색 결과가 없어요' : '메모가 없어요'}</p>`;
    box.querySelectorAll('.mm-item').forEach(el => {
      const id = el.dataset.id;
      if (trash) { el.querySelector('[data-restore]').onclick = () => trashOp('restore', id); el.querySelector('[data-purge]').onclick = () => { if (confirm('이 메모를 영구 삭제할까요? 되돌릴 수 없어요.')) trashOp('purge', id); }; return; }
      const go = () => select(data.notes.find(n => n.id === id)); el.onclick = go; el.onkeydown = e => { if (e.key === 'Enter') go(); };
      el.ondragstart = e => { e.dataTransfer.setData('text/memo', id); e.dataTransfer.effectAllowed = 'move'; };
    });
  }
  async function trashOp(op, id) { try { data = (await call({ op, id })).data; if (op === 'restore') toast('메모를 복원했어요'); paintFolders(); paintList(); } catch (e) { toast(e.message); } }
  async function select(n) { await flush(); cur = n; ls('memoCur', n?.id || ''); mode = n && n.text ? 'view' : 'edit'; paintList(); paintMain(); if (innerWidth < 760 && host.querySelector('.mm.open')) toggleSide(); }
  function newNote() { flush(); const n = { id: newId('n'), title: '', folder: folder && folder !== 'trash' ? folder : '', text: '', updated: new Date().toISOString() }; data.notes.push(n); cur = n; ls('memoCur', n.id); mode = 'edit'; if (folder === 'trash') folder = ''; paintFolders(); paintList(); paintMain(); host.querySelector('.mm-title')?.focus(); }

  const TOOLS = [['h', '제목', '## '], ['b', '굵게', '**'], ['i', '기울임', '*'], ['s', '취소선', '~~'], ['ul', '목록', '- '], ['ol', '번호 목록', '1. '], ['task', '체크박스', '- [ ] '], ['q', '인용', '> '], ['code', '코드', '`'], ['hr', '구분선', '\n---\n'], ['tbl', '표', '\n| 항목 | 내용 |\n|---|---|\n|  |  |\n']];
  const TOOL_LABEL = { h: 'H', b: '<b>B</b>', i: '<i>I</i>', s: '<s>S</s>', ul: '•', ol: '1.', task: '☑', q: '❝', code: '&lt;/&gt;', hr: '—', tbl: '▦' };
  function paintMain() {
    const main = host.querySelector('.mm-main'), side = host.querySelector('.mm').classList.contains('open');
    const listBtn = `<button type="button" class="mm-listbtn" aria-expanded="${side}" title="목록 열기·닫기"><svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="4" width="14" height="12" rx="2"/><path d="M8 4v12"/></svg><span>목록</span></button>`;
    if (!cur) { main.innerHTML = `<div class="mm-bar">${listBtn}<span class="mm-grow"></span><button type="button" class="primary mm-new">+ 새 메모</button></div><div class="mm-blank"><p>메모를 고르거나 새로 만들어 보세요.</p><p class="muted">마크다운(# 제목, **굵게**, - 목록, - [ ] 체크)과 사진 붙여넣기를 쓸 수 있어요. 메모는 내 접속코드로만 열려요.</p></div>`; wireBar(main); return; }
    main.innerHTML = `<div class="mm-bar">${listBtn}
        <select class="mm-fsel" aria-label="폴더"><option value="">폴더 없음</option>${data.folders.map(f => `<option value="${esc(f.id)}"${f.id === cur.folder ? ' selected' : ''}>${esc(f.name)}</option>`).join('')}</select>
        <div class="mm-seg" role="group" aria-label="보기 방식"><button type="button" data-mode="edit" aria-pressed="${mode === 'edit'}">편집</button><button type="button" data-mode="view" aria-pressed="${mode === 'view'}">보기</button></div>
        <span class="mm-grow"></span><small class="mm-status" aria-live="polite">${esc(status)}</small>
        <button type="button" class="mm-del" title="휴지통으로">삭제</button><button type="button" class="primary mm-new">+ 새 메모</button></div>
      <input class="mm-title" placeholder="제목" maxlength="200" value="${esc(cur.title)}" aria-label="메모 제목">
      ${mode === 'edit' ? `<div class="mm-tools" role="toolbar" aria-label="서식">${TOOLS.map(([k, l]) => `<button type="button" data-t="${k}" title="${l}" aria-label="${l}">${TOOL_LABEL[k]}</button>`).join('')}<label class="mm-photo" title="사진 첨부 (붙여넣기·끌어놓기도 돼요)">📷 사진<input type="file" accept="image/*" multiple hidden></label></div>
        <textarea class="mm-text" placeholder="여기에 적으세요. 마크다운을 쓸 수 있어요.&#10;# 제목  **굵게**  - 목록  - [ ] 할 일  > 인용" aria-label="메모 본문">${esc(cur.text)}</textarea>`
      : `<article class="mm-view">${cur.text.trim() ? window.MemoMD.render(cur.text) : '<p class="muted">내용이 없어요. 편집을 눌러 적어 보세요.</p>'}</article>`}`;
    wireBar(main);
    main.querySelector('.mm-fsel').onchange = e => { cur.folder = e.target.value; queue(); paintFolders(); paintList(); };
    main.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { mode = b.dataset.mode; paintMain(); if (mode === 'edit') main.querySelector('.mm-text')?.focus(); });
    main.querySelector('.mm-title').oninput = e => { cur.title = e.target.value; queue(); const it = host.querySelector(`.mm-item[data-id="${CSS.escape(cur.id)}"] b`); if (it) it.textContent = titleOf(cur); };
    main.querySelector('.mm-del').onclick = async () => { if (!confirm(`'${titleOf(cur)}' 메모를 휴지통으로 옮길까요? (30일 보관)`)) return; const id = cur.id; clearTimeout(saveT); dirty = false;
      const saved = !!cur.created; data.notes = data.notes.filter(n => n.id !== id); cur = null;
      if (saved) await trashOp('delete', id); paintFolders(); paintList(); paintMain(); };
    const ta = main.querySelector('.mm-text');
    if (ta) {
      const fit = () => { ta.style.height = 'auto'; ta.style.height = Math.max(320, ta.scrollHeight + 4) + 'px'; }; fit();
      ta.oninput = () => { cur.text = ta.value; fit(); queue(); };
      ta.onkeydown = e => {
        if ((e.ctrlKey || e.metaKey) && /^[bi]$/i.test(e.key)) { e.preventDefault(); tool(ta, e.key.toLowerCase()); }
        if (e.key === 'Enter' && !e.isComposing) { // 목록 줄에서 엔터 → 다음 줄도 같은 기호, 빈 항목이면 목록 끝
          const s = ta.selectionStart, line = ta.value.slice(ta.value.lastIndexOf('\n', s - 1) + 1, s), m = line.match(/^(\s*)([-*+] \[[ xX]\] |[-*+] |(\d+)[.)] )(.*)$/);
          if (m) { e.preventDefault(); if (!m[4].trim()) { ta.setRangeText('', s - line.length, s, 'end'); } else { const mk = m[3] ? `${+m[3] + 1}. ` : m[2].replace(/\[[xX]\]/, '[ ]'); ta.setRangeText('\n' + m[1] + mk, s, ta.selectionEnd, 'end'); } ta.oninput(); }
        }
        if (e.key === 'Tab') { e.preventDefault(); const s = ta.selectionStart, st = ta.value.lastIndexOf('\n', s - 1) + 1; if (e.shiftKey) { if (ta.value.startsWith('  ', st)) { ta.setRangeText('', st, st + 2, 'end'); } } else ta.setRangeText('  ', st, st, 'end'); ta.oninput(); }
      };
      ta.onpaste = e => { const fs = [...(e.clipboardData?.files || [])].filter(f => f.type.startsWith('image/')); if (fs.length) { e.preventDefault(); upload(fs, ta); } };
      ta.ondragover = e => { if (e.dataTransfer.types.includes('Files')) e.preventDefault(); };
      ta.ondrop = e => { const fs = [...e.dataTransfer.files].filter(f => f.type.startsWith('image/')); if (fs.length) { e.preventDefault(); upload(fs, ta); } };
      main.querySelectorAll('[data-t]').forEach(b => b.onclick = () => tool(ta, b.dataset.t));
      main.querySelector('.mm-photo input').onchange = e => { upload([...e.target.files], ta); e.target.value = ''; };
    } else {
      const v = main.querySelector('.mm-view');
      v.querySelectorAll('input[data-line]').forEach(cb => cb.onchange = () => { const L = cur.text.split('\n'), i = +cb.dataset.line; L[i] = L[i].replace(/\[([ xX])\]/, cb.checked ? '[x]' : '[ ]'); cur.text = L.join('\n'); queue(); });
      v.ondblclick = e => { if (!e.target.closest('a,input,img')) { mode = 'edit'; paintMain(); } };
      v.querySelectorAll('img.mm-img').forEach(img => { img.onclick = () => window.open(img.src, '_blank'); });
      loadImages(v);
    }
  }
  function wireBar(main) { main.querySelector('.mm-listbtn').onclick = () => { toggleSide(); }; main.querySelectorAll('.mm-new').forEach(b => b.onclick = newNote); }
  function tool(ta, k) {
    const [, , mk] = TOOLS.find(t => t[0] === k), s = ta.selectionStart, e = ta.selectionEnd, sel = ta.value.slice(s, e);
    if (['b', 'i', 's', 'code'].includes(k)) ta.setRangeText(mk + (sel || '글자') + mk, s, e, sel ? 'end' : 'select');
    else if (k === 'hr' || k === 'tbl') ta.setRangeText(mk, s, e, 'end');
    else { const st = ta.value.lastIndexOf('\n', s - 1) + 1, block = ta.value.slice(st, e); ta.setRangeText(block.split('\n').map((l, i) => (k === 'ol' ? `${i + 1}. ` : mk) + l).join('\n'), st, e, 'end'); }
    ta.focus(); ta.oninput();
  }
  // 사진: 긴 변 1600px JPEG 로 줄여 내 Drive 폴더에 올리고, 본문에는 ![사진](memo:파일id) 로 넣는다
  async function shrink(f) {
    if (f.type === 'image/gif' && f.size < 4e6) return { blob: f, mime: 'image/gif' };
    const bmp = await createImageBitmap(f), k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height)), c = document.createElement('canvas');
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k); const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(bmp, 0, 0, c.width, c.height);
    return { blob: await new Promise(r => c.toBlob(r, 'image/jpeg', 0.85)), mime: 'image/jpeg' };
  }
  const b64 = blob => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.onerror = no; r.readAsDataURL(blob); });
  async function upload(files, ta) {
    for (const f of files) {
      if (!f.type.startsWith('image/')) { toast('사진 파일만 올릴 수 있어요'); continue; }
      const tag = `![업로드 중 ${f.name.replace(/[\[\]]/g, '')}…]()`; ta.setRangeText(`\n${tag}\n`, ta.selectionStart, ta.selectionEnd, 'end'); ta.oninput();
      try { const { blob, mime } = await shrink(f), r = await call({ op: 'imgPut', mime, name: f.name, data: await b64(blob) });
        imgCache[r.id] = Promise.resolve(URL.createObjectURL(blob));
        cur.text = cur.text.replace(tag, `![${f.name.replace(/\.[^.]+$/, '').replace(/[\[\]]/g, '') || '사진'}](memo:${r.id})`); }
      catch (e) { cur.text = cur.text.replace(tag, ''); toast('사진 올리기 실패: ' + e.message); }
      if (ta.isConnected) { const p = ta.selectionStart; ta.value = cur.text; ta.selectionStart = ta.selectionEnd = Math.min(p, ta.value.length); }
      queue();
    }
  }
  function loadImages(root) {
    root.querySelectorAll('img[data-memo]').forEach(img => {
      const id = img.dataset.memo; img.classList.add('loading');
      (imgCache[id] ||= call({ op: 'imgGet', id }).then(r => URL.createObjectURL(new Blob([Uint8Array.from(atob(r.data), c => c.charCodeAt(0))], { type: r.mime }))))
        .then(u => { img.src = u; img.classList.remove('loading'); }).catch(() => { delete imgCache[id]; img.classList.remove('loading'); img.alt = '사진을 불러오지 못했어요'; img.classList.add('broken'); });
    });
  }
  function editFolder(f) {
    host.querySelector('.mm-fform')?.remove();
    const form = document.createElement('form'); form.className = 'mm-fform';
    form.innerHTML = `<input name="n" maxlength="40" placeholder="폴더 이름" value="${esc(f?.name || '')}" aria-label="폴더 이름" required><div class="mm-swatch" role="radiogroup" aria-label="폴더 색">${COLORS.map((c, i) => `<label style="--c:${c}"><input type="radio" name="c" value="${c}"${(f ? f.color === c : i === 0) ? ' checked' : ''} aria-label="색 ${i + 1}"></label>`).join('')}</div><div class="mm-facts">${f ? '<button type="button" class="danger" data-del>폴더 삭제</button>' : ''}<button type="button" data-x>취소</button><button class="primary">${f ? '저장' : '만들기'}</button></div>`;
    const anchor = f ? host.querySelector(`.mm-f[data-f="${CSS.escape(f.id)}"]`) : host.querySelector('.mm-flist'); f ? anchor.after(form) : anchor.prepend(form);
    form.n.focus(); form.n.select();
    form.querySelector('[data-x]').onclick = () => form.remove();
    form.onkeydown = e => { if (e.key === 'Escape') form.remove(); };
    form.onsubmit = e => { e.preventDefault(); const name = form.n.value.trim(), color = form.c.value; if (!name) return;
      const list = f ? data.folders.map(x => x.id === f.id ? { ...x, name, color } : x) : [...data.folders, { id: newId('f'), name, color }]; saveFolders(list); };
    form.querySelector('[data-del]')?.addEventListener('click', () => { const n = data.notes.filter(x => x.folder === f.id).length;
      if (confirm(`'${f.name}' 폴더를 지울까요?${n ? ` 안의 메모 ${n}개는 지워지지 않고 '폴더 없음'으로 옮겨져요.` : ''}`)) { if (folder === f.id) folder = ''; saveFolders(data.folders.filter(x => x.id !== f.id)); } });
  }
  async function saveFolders(list) { // 지운 폴더의 메모는 서버와 같은 규칙으로 '폴더 없음'
    const prev = data.folders; data.folders = list; paintFolders();
    try { data.folders = (await call({ op: 'folders', folders: list })).data.folders; data.notes.forEach(n => { if (n.folder && !fOf(n.folder)) n.folder = ''; }); }
    catch (e) { data.folders = prev; toast('폴더 저장 실패: ' + e.message); } paintFolders(); paintList(); paintMain(); }

  // 떠 있는 창: 위 막대를 끌어 옮기고 오른쪽 아래 모서리로 크기 조절. 위치·크기는 이 브라우저에 기억
  const win = () => $('memoFloat');
  const fit = () => { const w = win(), x = Math.min(Math.max(8 - w.offsetWidth + 120, parseFloat(w.style.left) || 8), innerWidth - 120), y = Math.min(Math.max(8, parseFloat(w.style.top) || 8), innerHeight - 48); w.style.left = x + 'px'; w.style.top = y + 'px'; };
  function place() {
    const w = win(); if (innerWidth < 760) { w.removeAttribute('style'); return; }
    let g = null; try { g = JSON.parse(ls('memoWin') || 'null'); } catch {}
    const W = Math.min(g?.w || 780, innerWidth - 16), H = Math.min(g?.h || Math.min(640, innerHeight - 48), innerHeight - 16);
    Object.assign(w.style, { width: W + 'px', height: H + 'px', left: (g ? g.x : innerWidth - W - 24) + 'px', top: (g ? g.y : innerHeight - H - 24) + 'px' }); fit();
  }
  const remember = () => { const w = win(); if (innerWidth < 760 || !w.style.left) return; ls('memoWin', JSON.stringify({ x: Math.round(parseFloat(w.style.left)), y: Math.round(parseFloat(w.style.top)), w: w.offsetWidth, h: w.offsetHeight })); }; // 열고 닫는 애니메이션(transform) 영향 없이
  function setOpen(on) {
    const w = win(); if (on === !w.hidden) return;
    document.querySelectorAll('[data-view="memo"]').forEach(b => { b.classList.toggle('float-on', on); b.setAttribute('aria-expanded', on); });
    if (!on) { flush(); w.classList.remove('show'); setTimeout(() => { if (!w.classList.contains('show')) w.hidden = true; }, 180); return; }
    w.hidden = false; place(); requestAnimationFrame(() => w.classList.add('show')); open();
  }
  (() => {
    const w = win(), bar = w.querySelector('.mm-fbar');
    w.querySelector('.mm-close').onclick = () => setOpen(false);
    bar.onpointerdown = e => {
      if (e.target.closest('button') || innerWidth < 760) return; e.preventDefault();
      const r = { left: parseFloat(w.style.left), top: parseFloat(w.style.top), width: w.offsetWidth }, dx = e.clientX - r.left, dy = e.clientY - r.top; bar.setPointerCapture(e.pointerId); w.classList.add('dragging');
      bar.onpointermove = m => { w.style.left = Math.min(Math.max(8 - r.width + 120, m.clientX - dx), innerWidth - 120) + 'px'; w.style.top = Math.min(Math.max(8, m.clientY - dy), innerHeight - 48) + 'px'; };
      bar.onpointerup = () => { bar.onpointermove = bar.onpointerup = null; w.classList.remove('dragging'); remember(); };
    };
    new ResizeObserver(() => { if (!w.hidden && w.classList.contains('show')) { clearTimeout(w.rt); w.rt = setTimeout(remember, 300); } }).observe(w);
    addEventListener('resize', () => { if (!w.hidden) place(); });
  })();
  window.MemoHub = { open, leave: flush, toggle: () => setOpen(win().hidden), close: () => setOpen(false) };
})();
