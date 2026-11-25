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
  let host, data = null, cur = null, folder = ls('memoFolder') || '', q = '', ed = null, saveT = null, dirty = false, status = '';
  const imgCache = {};
  const newId = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const titleOf = n => (n.title || '').trim() || (n.text || '').split('\n').map(s => s.replace(/^[#>\-*\s\d.[\]x]+/, '').trim()).find(Boolean) || '제목 없음';
  const when = s => { if (!s) return ''; const d = new Date(s), t = new Date(); return d.toDateString() === t.toDateString() ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : `${d.getFullYear() === t.getFullYear() ? '' : d.getFullYear() + '. '}${d.getMonth() + 1}. ${d.getDate()}.`; };
  const fOf = id => data.folders.find(f => f.id === id);

  async function open() {
    host = $('memoHub');
    if (!data) { host.innerHTML = '<div class="mm-loading">메모 불러오는 중…</div>'; try { data = (await call({ op: 'load' })).data; } catch (e) { host.innerHTML = `<div class="mm-loading">메모를 불러오지 못했어요 <small>${esc(e.message)}</small> <button type="button" class="more">다시 시도</button></div>`; host.querySelector('.more').onclick = () => { data = null; open(); }; return; }
      const last = data.notes.find(n => n.id === ls('memoCur')) || [...data.notes].sort((a, b) => b.updated < a.updated ? -1 : 1)[0]; cur = last || null; }
    if (folder && folder !== 'trash' && !fOf(folder)) folder = '';
    paint();
  }
  // 저장: 입력 1초 뒤 자동. 다른 메모로 가거나 화면을 떠날 때 즉시
  function queue() { dirty = true; setStatus('저장 중…'); clearTimeout(saveT); saveT = setTimeout(flush, 1000); }
  async function flush() {
    clearTimeout(saveT); if (!dirty || !cur) return; dirty = false;
    if (ed && ed.isConnected && ed.dataset.id === cur.id) cur.text = window.MemoMD.fromHtml(ed); // 편집 화면을 마크다운으로 저장
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
  async function select(n) { await flush(); cur = n; ls('memoCur', n?.id || ''); paintList(); paintMain(); if (innerWidth < 760 && host.querySelector('.mm.open')) toggleSide(); }
  function newNote() { flush(); const n = { id: newId('n'), title: '', folder: folder && folder !== 'trash' ? folder : '', text: '', updated: new Date().toISOString() }; data.notes.push(n); cur = n; ls('memoCur', n.id); if (folder === 'trash') folder = ''; paintFolders(); paintList(); paintMain(); host.querySelector('.mm-title')?.focus(); }

  const ICON = {
    list: '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="4" width="14" height="12" rx="2"/><path d="M8 4v12"/></svg>',
    del: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 6h12M8 6V4h4v2M6 6l1 10h6l1-10M9 9v5M11 9v5"/></svg>',
  };
  // 서식: 글자 선택 후 누르거나, 줄 맨 앞에서 '# ', '- ', '1. ', '[] ', '> ' 를 치면 바로 바뀐다
  const TOOLS = [['h', '제목', 'H'], ['b', '굵게 (Ctrl+B)', '<b>B</b>'], ['i', '기울임 (Ctrl+I)', '<i>I</i>'], ['s', '취소선', '<s>S</s>'], ['ul', '목록', '•'], ['ol', '번호 목록', '1.'], ['task', '체크박스', '☑'], ['q', '인용', '❝'], ['code', '코드', '&lt;/&gt;'], ['hr', '구분선', '—'], ['tbl', '표', '▦']];
  const cmd = (c, v) => document.execCommand(c, false, v);
  const blockOf = () => { const n = getSelection().anchorNode; let b = n && (n.nodeType === 1 ? n : n.parentElement); while (b && b !== ed && !/^(P|DIV|H[1-6]|LI|BLOCKQUOTE|PRE)$/.test(b.tagName)) b = b.parentElement; return b && b !== ed ? b : null; };
  const checkbox = () => { const c = document.createElement('input'); c.type = 'checkbox'; return c; };
  function makeTask() {
    let li = blockOf(); if (!li || li.tagName !== 'LI') { cmd('insertUnorderedList'); li = blockOf(); }
    if (!li || li.tagName !== 'LI' || li.classList.contains('task')) return;
    li.classList.add('task'); li.prepend(checkbox(), ' ');
    const r = document.createRange(); r.setStart(li, li.childNodes.length); r.collapse(true); getSelection().removeAllRanges(); getSelection().addRange(r);
  }
  function tool(k) {
    ed.focus(); const b = blockOf();
    if (k === 'h') cmd('formatBlock', b && /^H/.test(b.tagName) ? 'p' : 'h2');
    else if (k === 'q') cmd('formatBlock', b?.closest('blockquote') ? 'p' : 'blockquote');
    else if (k === 'b') cmd('bold'); else if (k === 'i') cmd('italic'); else if (k === 's') cmd('strikeThrough');
    else if (k === 'ul') cmd('insertUnorderedList'); else if (k === 'ol') cmd('insertOrderedList'); else if (k === 'task') makeTask();
    else if (k === 'code') { const t = String(getSelection()); cmd('insertHTML', `<code>${esc(t || '코드')}</code>&#8203;`); }
    else if (k === 'hr') cmd('insertHorizontalRule');
    else if (k === 'tbl') cmd('insertHTML', '<table><tbody><tr><th>항목</th><th>내용</th></tr><tr><td><br></td><td><br></td></tr></tbody></table><p><br></p>');
    changed();
  }
  function changed() {
    if (!ed.firstElementChild && !ed.textContent) ed.innerHTML = '<p><br></p>';
    [...ed.childNodes].filter(n => n.nodeType === 3 && n.nodeValue.trim()).forEach(t => { const p = document.createElement('p'); t.replaceWith(p); p.append(t); }); // 맨바깥 글자는 문단으로
    ed.querySelectorAll('li.task').forEach(li => { if (!li.querySelector(':scope > input[type=checkbox]')) li.prepend(checkbox(), ' '); });
    ed.querySelectorAll('li:not(.task) > input[type=checkbox]').forEach(c => c.parentElement.classList.add('task'));
    ed.classList.toggle('empty', !ed.textContent.trim() && !ed.querySelector('img,hr,li,table'));
    queue();
  }
  function shortcut() { // 줄 맨 앞 마크다운 기호 + 띄어쓰기 → 서식
    const sel = getSelection(), tn = sel.anchorNode, b = blockOf(); if (!b || !tn || tn.nodeType !== 3) return;
    let before = tn.nodeValue.slice(0, sel.anchorOffset), prev = tn.previousSibling; // 같은 줄(앞의 목록·줄바꿈 뒤)만 본다
    while (prev && !(prev.nodeType === 1 && /^(BR|UL|OL|P|DIV|H\d|BLOCKQUOTE|PRE|TABLE|HR)$/.test(prev.tagName))) { before = prev.textContent + before; prev = prev.previousSibling; }
    if (tn.parentElement !== b && !/^(P|DIV|LI|H\d)$/.test(tn.parentElement.tagName)) return;
    const m = before.match(/^(#{1,3}|[-*]|1[.)]|>|\[ ?\]|\[x\])[\s ]$/);
    if (!m || tn.nodeValue.slice(0, sel.anchorOffset) !== before) return;
    tn.nodeValue = tn.nodeValue.slice(sel.anchorOffset);
    const c = document.createRange(); if (tn.nodeValue) c.setStart(tn, 0); else { const br = document.createElement('br'); tn.replaceWith(br); c.setStartBefore(br); }
    c.collapse(true); sel.removeAllRanges(); sel.addRange(c);
    const k = m[1];
    if (k[0] === '#') cmd('formatBlock', 'h' + k.length); else if (k === '>') cmd('formatBlock', 'blockquote');
    else if (k === '-' || k === '*') cmd('insertUnorderedList'); else if (/^1/.test(k)) cmd('insertOrderedList');
    else { makeTask(); const cb = blockOf()?.querySelector(':scope > input'); if (k === '[x]' && cb) cb.checked = true; }
  }
  function paintMain() {
    const main = host.querySelector('.mm-main'), side = host.querySelector('.mm').classList.contains('open');
    const listBtn = `<button type="button" class="mm-icon mm-listbtn" aria-expanded="${side}" aria-label="목록 열기·닫기" title="목록">${ICON.list}</button>`;
    if (ed && ed.isConnected && cur && ed.dataset.id === cur.id) cur.text = window.MemoMD.fromHtml(ed); // 다시 그리기 전에 편집 중인 내용 보존
    ed = null;
    if (!cur) { main.innerHTML = `<div class="mm-bar">${listBtn}<span class="mm-grow"></span><button type="button" class="primary mm-new">+ 새 메모</button></div><div class="mm-blank"><p>메모를 고르거나 새로 만들어 보세요.</p><p class="muted">줄 맨 앞에 # (제목), - (목록), [] (체크박스), > (인용)을 치고 띄우면 서식이 바로 바뀌어요. 사진은 붙여넣기·끌어놓기로. 메모는 내 접속코드로만 열려요.</p></div>`; wireBar(main); return; }
    main.innerHTML = `<div class="mm-bar">${listBtn}
        <select class="mm-fsel" aria-label="폴더"><option value="">폴더 없음</option>${data.folders.map(f => `<option value="${esc(f.id)}"${f.id === cur.folder ? ' selected' : ''}>${esc(f.name)}</option>`).join('')}</select>
        <span class="mm-grow"></span><small class="mm-status" aria-live="polite">${esc(status)}</small>
        <button type="button" class="mm-icon mm-del" aria-label="메모 삭제 (휴지통으로)" title="삭제">${ICON.del}</button><button type="button" class="primary mm-new">+ 새 메모</button></div>
      <input class="mm-title" placeholder="제목" maxlength="200" value="${esc(cur.title)}" aria-label="메모 제목">
      <div class="mm-tools" role="toolbar" aria-label="서식">${TOOLS.map(([k, l, g]) => `<button type="button" data-t="${k}" title="${l}" aria-label="${l}">${g}</button>`).join('')}<label class="mm-photo" title="사진 첨부 (붙여넣기·끌어놓기도 돼요)">📷 사진<input type="file" accept="image/*" multiple hidden></label></div>
      <div class="mm-ed mm-view" contenteditable="true" role="textbox" aria-multiline="true" aria-label="메모 본문" data-ph="여기에 바로 적으세요. 줄 맨 앞에 # 제목, - 목록, [] 체크박스" data-id="${esc(cur.id)}"></div>`;
    wireBar(main);
    main.querySelector('.mm-fsel').onchange = e => { cur.folder = e.target.value; queue(); paintFolders(); paintList(); };
    main.querySelector('.mm-title').oninput = e => { cur.title = e.target.value; queue(); const it = host.querySelector(`.mm-item[data-id="${CSS.escape(cur.id)}"] b`); if (it) it.textContent = titleOf(cur); };
    main.querySelector('.mm-title').onkeydown = e => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); ed.focus(); } };
    main.querySelector('.mm-del').onclick = async () => { if (!confirm(`'${titleOf(cur)}' 메모를 휴지통으로 옮길까요? (30일 보관)`)) return; const id = cur.id; clearTimeout(saveT); dirty = false;
      const saved = !!cur.created; data.notes = data.notes.filter(n => n.id !== id); cur = null;
      if (saved) await trashOp('delete', id); paintFolders(); paintList(); paintMain(); };
    ed = main.querySelector('.mm-ed');
    ed.innerHTML = window.MemoMD.render(cur.text) || '<p><br></p>'; // 빈 메모도 문단 안에서 시작해야 '# ' 같은 서식이 먹는다
    ed.querySelectorAll('li.task > label').forEach(l => l.replaceWith(...l.childNodes)); // 글자를 눌러도 체크가 바뀌지 않게
    ed.classList.toggle('empty', !cur.text.trim());
    loadImages(ed);
    try { cmd('defaultParagraphSeparator', 'p'); } catch {}
    ed.oninput = e => { if (e.inputType === 'insertText' && e.data === ' ') shortcut(); changed(); };
    ed.addEventListener('change', e => { if (e.target.matches('input[type=checkbox]')) { e.target.toggleAttribute('checked', e.target.checked); changed(); } });
    ed.onkeydown = e => {
      if (e.key === 'Tab') { const li = blockOf(); if (li?.tagName === 'LI') { e.preventDefault(); cmd(e.shiftKey ? 'outdent' : 'indent'); changed(); } }
      if (e.key === 'Enter' && !e.isComposing && !e.shiftKey) { const li = blockOf(); // 빈 목록 줄에서 엔터 → 목록 끝
        if (li?.tagName === 'LI' && !li.textContent.trim() && !li.querySelector('img')) { e.preventDefault(); li.querySelector(':scope > input')?.remove(); li.classList.remove('task'); cmd(li.parentElement.tagName === 'OL' ? 'insertOrderedList' : 'insertUnorderedList'); changed(); } }
    };
    ed.onpaste = e => { e.preventDefault(); const fs = [...(e.clipboardData?.files || [])].filter(f => f.type.startsWith('image/')); if (fs.length) return upload(fs);
      const t = e.clipboardData.getData('text/plain'); if (!t) return;
      if (/\n/.test(t.trim()) || /^(#{1,6} |[-*] |\d+\. |> |```)/m.test(t)) { cmd('insertHTML', window.MemoMD.render(t)); loadImages(ed); } else cmd('insertText', t); changed(); };
    ed.ondragover = e => { if (e.dataTransfer.types.includes('Files')) e.preventDefault(); };
    ed.ondrop = e => { const fs = [...e.dataTransfer.files].filter(f => f.type.startsWith('image/')); if (fs.length || e.dataTransfer.types.includes('text/html')) { e.preventDefault(); if (fs.length) upload(fs); else cmd('insertText', e.dataTransfer.getData('text/plain')); } };
    ed.onclick = e => { const img = e.target.closest('img.mm-img'); if (img && img.src && !img.classList.contains('loading')) { e.preventDefault(); return viewImage(img.src, img.alt); } const a = e.target.closest('a'); if (a && (e.ctrlKey || e.metaKey)) window.open(a.href, '_blank'); };
    main.querySelectorAll('[data-t]').forEach(b => { b.onmousedown = e => e.preventDefault(); b.onclick = () => tool(b.dataset.t); });
    main.querySelector('.mm-photo input').onchange = e => { upload([...e.target.files]); e.target.value = ''; };
  }
  function wireBar(main) { main.querySelector('.mm-listbtn').onclick = () => { toggleSide(); }; main.querySelectorAll('.mm-new').forEach(b => b.onclick = newNote); }
  // 사진: 긴 변 1600px JPEG 로 줄여 내 Drive 폴더에 올리고, 본문에는 ![사진](memo:파일id) 로 넣는다
  async function shrink(f) {
    if (f.type === 'image/gif' && f.size < 4e6) return { blob: f, mime: 'image/gif' };
    const bmp = await createImageBitmap(f), k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height)), c = document.createElement('canvas');
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k); const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(bmp, 0, 0, c.width, c.height);
    return { blob: await new Promise(r => c.toBlob(r, 'image/jpeg', 0.85)), mime: 'image/jpeg' };
  }
  const b64 = blob => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.onerror = no; r.readAsDataURL(blob); });
  async function upload(files) {
    for (const f of files) {
      if (!f.type.startsWith('image/')) { toast('사진 파일만 올릴 수 있어요'); continue; }
      const key = 'u' + Date.now().toString(36), alt = f.name.replace(/\.[^.]+$/, '').replace(/[\[\]"<>]/g, '') || '사진';
      ed.focus(); cmd('insertHTML', `<img class="mm-img loading" data-up="${key}" alt="${esc(alt)}"><br>`);
      const img = () => ed?.querySelector(`img[data-up="${key}"]`);
      try { const { blob, mime } = await shrink(f), r = await call({ op: 'imgPut', mime, name: f.name, data: await b64(blob) }), u = URL.createObjectURL(blob);
        imgCache[r.id] = Promise.resolve(u); const el = img(); if (el) { el.dataset.memo = r.id; el.removeAttribute('data-up'); el.src = u; el.classList.remove('loading'); } }
      catch (e) { img()?.remove(); toast('사진 올리기 실패: ' + e.message); }
      if (ed) changed();
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
    edgeResize(w, 440, 320, remember);
    bar.onpointerdown = e => {
      if (e.target.closest('button') || innerWidth < 760) return; e.preventDefault();
      const r = { left: parseFloat(w.style.left), top: parseFloat(w.style.top), width: w.offsetWidth }, dx = e.clientX - r.left, dy = e.clientY - r.top; bar.setPointerCapture(e.pointerId); w.classList.add('dragging');
      bar.onpointermove = m => { w.style.left = Math.min(Math.max(8 - r.width + 120, m.clientX - dx), innerWidth - 120) + 'px'; w.style.top = Math.min(Math.max(8, m.clientY - dy), innerHeight - 48) + 'px'; };
      bar.onpointerup = () => { bar.onpointermove = bar.onpointerup = null; w.classList.remove('dragging'); remember(); };
    };
    new ResizeObserver(() => { if (!w.hidden && w.classList.contains('show')) { clearTimeout(w.rt); w.rt = setTimeout(remember, 300); } }).observe(w);
    addEventListener('resize', () => { if (!w.hidden) place(); });
  })();
  // 떠 있는 창 크기 조절: 네 변과 네 모서리 어디서든(휴대폰 전체 화면에서는 숨김)
  function edgeResize(w, minW, minH, onEnd) {
    ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].forEach(d => {
      const h = document.createElement('i'); h.className = 'rz rz-' + d; h.setAttribute('aria-hidden', 'true'); w.append(h);
      h.onpointerdown = e => {
        e.preventDefault(); e.stopPropagation(); h.setPointerCapture(e.pointerId); w.classList.add('resizing');
        const x0 = e.clientX, y0 = e.clientY, L = parseFloat(w.style.left) || w.getBoundingClientRect().left, T = parseFloat(w.style.top) || w.getBoundingClientRect().top, W = w.offsetWidth, H = w.offsetHeight;
        h.onpointermove = m => {
          const dx = m.clientX - x0, dy = m.clientY - y0; let l = L, t = T, ww = W, hh = H;
          if (d.includes('e')) ww = Math.min(innerWidth - L - 4, Math.max(minW, W + dx));
          if (d.includes('s')) hh = Math.min(innerHeight - T - 4, Math.max(minH, H + dy));
          if (d.includes('w')) { ww = Math.max(minW, Math.min(W - dx, L + W - 4)); l = L + W - ww; }
          if (d.includes('n')) { hh = Math.max(minH, Math.min(H - dy, T + H - 4)); t = T + H - hh; }
          Object.assign(w.style, { left: l + 'px', top: t + 'px', width: ww + 'px', height: hh + 'px' });
        };
        h.onpointerup = () => { h.onpointermove = h.onpointerup = null; w.classList.remove('resizing'); onEnd && onEnd(); };
      };
    });
  }
  // 사진 보기: PC는 대시보드 안 떠 있는 창(끌어 옮기기·크기 조절·확대), 휴대폰은 전체 화면
  function viewImage(src, alt) {
    document.querySelector('.iv')?.remove();
    const phone = innerWidth < 760, v = document.createElement('div');
    v.className = 'iv' + (phone ? ' iv-full' : ''); v.setAttribute('role', 'dialog'); v.setAttribute('aria-label', '사진 보기');
    v.innerHTML = `<div class="iv-bar"><b>${esc(alt || '사진')}</b><span class="iv-z">100%</span><button type="button" data-z="-1" aria-label="축소">−</button><button type="button" data-z="1" aria-label="확대">+</button><button type="button" data-z="0" title="창에 맞추기">맞춤</button><a href="${esc(src)}" target="_blank" rel="noopener" download="${esc(alt || 'photo')}.jpg" title="저장" aria-label="사진 저장">⤓</a><button type="button" class="iv-x" aria-label="닫기">✕</button></div><div class="iv-body"><img alt="${esc(alt || '')}"></div>`;
    document.body.append(v);
    const img = v.querySelector('img'), body = v.querySelector('.iv-body'), zl = v.querySelector('.iv-z'); let z = 1, fit = 1;
    const apply = () => { img.style.width = img.naturalWidth * z + 'px'; zl.textContent = Math.round(z * 100) + '%'; v.classList.toggle('zoomed', z > fit + .01); };
    const setZ = (nz, cx, cy) => { const r = body.getBoundingClientRect(), px = (cx ?? r.left + r.width / 2) - r.left + body.scrollLeft, py = (cy ?? r.top + r.height / 2) - r.top + body.scrollTop, k = nz / z;
      z = Math.min(8, Math.max(fit * .5, nz)); apply(); body.scrollLeft = px * k - ((cx ?? r.left + r.width / 2) - r.left); body.scrollTop = py * k - ((cy ?? r.top + r.height / 2) - r.top); };
    const fitNow = () => { const r = body.getBoundingClientRect(); fit = Math.min(1, (r.width - 8) / img.naturalWidth, (r.height - 8) / img.naturalHeight) || 1; z = fit; apply(); };
    img.onload = () => {
      if (!phone) { const W = Math.min(innerWidth - 32, Math.max(420, Math.min(img.naturalWidth + 16, innerWidth * .7))), H = Math.min(innerHeight - 32, Math.max(320, Math.min(img.naturalHeight + 60, innerHeight * .8)));
        Object.assign(v.style, { width: W + 'px', height: H + 'px', left: (innerWidth - W) / 2 + 'px', top: (innerHeight - H) / 2 + 'px' }); }
      requestAnimationFrame(() => { fitNow(); v.classList.add('show'); });
    };
    img.src = src;
    const close = () => { v.remove(); removeEventListener('keydown', key, true); };
    const key = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } else if (e.key === '+' || e.key === '=') setZ(z * 1.25); else if (e.key === '-') setZ(z / 1.25); else if (e.key === '0') fitNow(); };
    addEventListener('keydown', key, true);
    v.querySelector('.iv-x').onclick = close;
    v.querySelectorAll('[data-z]').forEach(b => b.onclick = () => { const d = +b.dataset.z; d ? setZ(z * (d > 0 ? 1.25 : 0.8)) : fitNow(); });
    body.onwheel = e => { if (phone) return; e.preventDefault(); setZ(z * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX, e.clientY); }; // 휠 = 확대·축소
    img.ondblclick = e => z > fit + .01 ? fitNow() : setZ(Math.max(1, fit * 2.5), e.clientX, e.clientY); // 두 번 누르면 확대 ↔ 맞춤
    body.onpointerdown = e => { // 확대된 사진은 끌어서 이동
      if (z <= fit + .01 || e.button) return; const sx = e.clientX, sy = e.clientY, l = body.scrollLeft, t = body.scrollTop; body.setPointerCapture(e.pointerId); v.classList.add('panning');
      body.onpointermove = m => { body.scrollLeft = l - (m.clientX - sx); body.scrollTop = t - (m.clientY - sy); };
      body.onpointerup = () => { body.onpointermove = body.onpointerup = null; v.classList.remove('panning'); };
    };
    if (phone) { body.onclick = e => { if (e.target === body) close(); }; return; } // 휴대폰: 사진 밖을 누르면 닫힘, 확대는 두 번 탭·손가락
    const bar = v.querySelector('.iv-bar');
    bar.onpointerdown = e => { if (e.target.closest('button,a')) return; e.preventDefault(); const dx = e.clientX - parseFloat(v.style.left), dy = e.clientY - parseFloat(v.style.top); bar.setPointerCapture(e.pointerId);
      bar.onpointermove = m => { v.style.left = Math.min(innerWidth - 120, Math.max(8 - v.offsetWidth + 120, m.clientX - dx)) + 'px'; v.style.top = Math.min(innerHeight - 48, Math.max(8, m.clientY - dy)) + 'px'; };
      bar.onpointerup = () => { bar.onpointermove = bar.onpointerup = null; }; };
    edgeResize(v, 320, 240);
    new ResizeObserver(() => { if (v.isConnected && z <= fit + .01) fitNow(); }).observe(v);
  }
  window.MemoHub = { open, leave: flush, toggle: () => setOpen(win().hidden), close: () => setOpen(false) };
})();
