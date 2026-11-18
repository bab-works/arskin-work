// 메모장용 작은 마크다운 변환기. 먼저 HTML 을 이스케이프하고, 링크는 http(s)·mailto 만, 사진은 memo:파일id 또는 https 만 허용
(() => {
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const safeUrl = u => /^(https?:|mailto:)/i.test(u) ? u : '';
  function inline(src) {
    const keep = []; const hold = h => `\u0000${keep.push(h) - 1}\u0000`;
    let s = esc(src).replace(/`([^`]+)`/g, (_, c) => hold(`<code>${c}</code>`));
    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, u) => {
      u = u.replace(/&amp;/g, '&');
      if (/^memo:[\w-]+$/.test(u)) return hold(`<img class="mm-img" data-memo="${esc(u.slice(5))}" alt="${alt}">`);
      return safeUrl(u) ? hold(`<img class="mm-img" src="${esc(u)}" alt="${alt}" loading="lazy">`) : _;
    });
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => { u = safeUrl(u.replace(/&amp;/g, '&')); return u ? hold(`<a href="${esc(u)}" target="_blank" rel="noopener">${t}</a>`) : _; });
    s = s.replace(/(^|[\s(])(https?:\/\/[^\s<]+[^\s<.,)])/g, (_, p, u) => p + hold(`<a href="${u}" target="_blank" rel="noopener">${u}</a>`));
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/__(.+?)__/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, '$1<em>$2</em>').replace(/~~(.+?)~~/g, '<del>$1</del>').replace(/==(.+?)==/g, '<mark>$1</mark>');
    return s.replace(/\u0000(\d+)\u0000/g, (_, i) => keep[i]);
  }
  // lines 는 원문 줄 번호(data-line)를 체크박스에 달아, 보기 화면에서 눌러 원문 [ ]↔[x] 를 바꿀 수 있게 한다
  function render(md) {
    const L = String(md || '').replace(/\r/g, '').split('\n'), out = []; let i = 0;
    const isTable = j => /\|/.test(L[j] || '') && /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(L[j + 1] || '');
    const cells = s => s.trim().replace(/^\||\|$/g, '').split('|').map(c => inline(c.trim()));
    const LIST = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
    while (i < L.length) {
      const l = L[i];
      if (/^\s*```/.test(l)) { const buf = []; i++; while (i < L.length && !/^\s*```/.test(L[i])) buf.push(L[i++]); i++; out.push(`<pre><code>${esc(buf.join('\n'))}</code></pre>`); continue; }
      if (!l.trim()) { i++; continue; }
      let m = l.match(/^(#{1,6})\s+(.*)$/); if (m) { out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`); i++; continue; }
      if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(l)) { out.push('<hr>'); i++; continue; }
      if (/^\s*>/.test(l)) { const buf = []; while (i < L.length && /^\s*>/.test(L[i])) buf.push(L[i++].replace(/^\s*>\s?/, '')); out.push(`<blockquote>${render(buf.join('\n'))}</blockquote>`); continue; }
      if (isTable(i)) { const head = cells(L[i]); i += 2; const rows = []; while (i < L.length && /\|/.test(L[i]) && L[i].trim()) rows.push(cells(L[i++]));
        out.push(`<div class="mm-tbl"><table><thead><tr>${head.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`); continue; }
      if (LIST.test(l)) { // 들여쓰기(2칸 = 한 단계)로 중첩
        const stack = []; let html = '';
        while (i < L.length && LIST.test(L[i])) {
          const [, sp, mk, body] = L[i].match(LIST), lv = Math.floor(sp.replace(/\t/g, '  ').length / 2), tag = /\d/.test(mk) ? 'ol' : 'ul';
          while (stack.length > lv + 1 || (stack.length === lv + 1 && stack[lv] !== tag)) html += `</li></${stack.pop()}>`;
          if (stack.length === lv + 1) html += '</li>'; else while (stack.length < lv + 1) { stack.push(tag); html += `<${tag}>`; }
          const t = body.match(/^\[([ xX])\]\s*(.*)$/);
          html += t ? `<li class="task"><label><input type="checkbox" data-line="${i}"${t[1] !== ' ' ? ' checked' : ''}> <span>${inline(t[2])}</span></label>` : `<li>${inline(body)}`;
          i++;
        }
        while (stack.length) html += `</li></${stack.pop()}>`;
        out.push(html); continue;
      }
      const buf = []; while (i < L.length && L[i].trim() && !/^(#{1,6}\s|\s*```|\s*>)/.test(L[i]) && !LIST.test(L[i]) && !isTable(i)) buf.push(inline(L[i++]));
      out.push(`<p>${buf.join('<br>')}</p>`);
    }
    return out.join('');
  }
  // 편집 화면(HTML) → 저장용 마크다운. 아는 태그만 옮기고 나머지는 글자만 남긴다(붙여넣은 HTML 도 안전)
  const BLOCK = /^(P|DIV|H[1-6]|UL|OL|LI|BLOCKQUOTE|PRE|HR|TABLE|THEAD|TBODY|TR)$/;
  const wrap = (m, s) => { const x = s.match(/^(\s*)([\s\S]*?)(\s*)$/); return x[2] ? x[1] + m + x[2] + m + x[3] : s; };
  function inl(n) {
    if (n.nodeType === 3) return n.nodeValue.replace(/ /g, ' ').replace(/​/g, '');
    if (n.nodeType !== 1) return '';
    const t = n.tagName, c = () => [...n.childNodes].map(inl).join('');
    if (t === 'BR') return '\n';
    if (t === 'B' || t === 'STRONG') return wrap('**', c());
    if (t === 'I' || t === 'EM') return wrap('*', c());
    if (t === 'S' || t === 'DEL' || t === 'STRIKE') return wrap('~~', c());
    if (t === 'MARK') return wrap('==', c());
    if (t === 'CODE') return n.textContent ? '`' + n.textContent.replace(/`/g, "'") + '`' : '';
    if (t === 'A') { const h = n.getAttribute('href') || ''; return /^(https?:|mailto:)/i.test(h) && c().trim() !== h ? `[${c()}](${h})` : c(); }
    if (t === 'IMG') { const alt = (n.getAttribute('alt') || '사진').replace(/[\[\]]/g, ''); if (n.dataset.memo) return `![${alt}](memo:${n.dataset.memo})`; const src = n.getAttribute('src') || ''; return /^https:/.test(src) ? `![${alt}](${src})` : ''; }
    if (t === 'INPUT' || t === 'SCRIPT' || t === 'STYLE') return '';
    if (BLOCK.test(t)) return c() + '\n';
    return c();
  }
  const line = s => s.replace(/\n+$/, '');
  function list(el, lv) {
    const out = []; let k = 1;
    [...el.children].forEach(li => {
      if (li.tagName === 'UL' || li.tagName === 'OL') { out.push(list(li, lv + 1)); return; }
      const cb = li.querySelector(':scope > input[type=checkbox], :scope > label > input[type=checkbox]');
      const txt = [...li.childNodes].filter(x => !(x.nodeType === 1 && /^(UL|OL)$/.test(x.tagName))).map(inl).join('').replace(/\s*\n\s*/g, ' ').trim();
      out.push('  '.repeat(lv) + (el.tagName === 'OL' ? `${k++}. ` : '- ') + (cb ? `[${cb.checked ? 'x' : ' '}] ` : '') + txt);
      li.querySelectorAll(':scope > ul, :scope > ol').forEach(sub => out.push(list(sub, lv + 1)));
    });
    return out.filter(Boolean).join('\n');
  }
  function blocks(parent) {
    const out = []; let buf = '';
    const push = () => { if (buf.replace(/\n/g, '').trim()) out.push(line(buf).replace(/^\n+/, '')); buf = ''; };
    parent.childNodes.forEach(n => {
      if (n.nodeType !== 1 || !BLOCK.test(n.tagName)) { buf += inl(n); return; }
      push(); const t = n.tagName;
      if (/^H[1-6]$/.test(t)) { const s = inl(n).replace(/\n/g, ' ').trim(); if (s) out.push('#'.repeat(+t[1]) + ' ' + s); }
      else if (t === 'P' || t === 'DIV' || t === 'LI') out.push(...blocks(n));
      else if (t === 'BLOCKQUOTE') { const s = blocks(n).join('\n\n'); if (s.trim()) out.push(s.split('\n').map(l => '> ' + l).join('\n')); }
      else if (t === 'PRE') out.push('```\n' + n.textContent.replace(/\n$/, '') + '\n```');
      else if (t === 'HR') out.push('---');
      else if (t === 'UL' || t === 'OL') { const s = list(n, 0); if (s) out.push(s); }
      else if (t === 'TABLE') { const rows = [...n.querySelectorAll('tr')].map(tr => [...tr.children].map(td => inl(td).replace(/\n/g, ' ').replace(/\|/g, '/').trim()));
        if (rows.length) { const w = Math.max(...rows.map(r => r.length)), f = r => '| ' + Array.from({ length: w }, (_, i) => r[i] || ' ').join(' | ') + ' |'; out.push([f(rows[0]), '|' + ' --- |'.repeat(w), ...rows.slice(1).map(f)].join('\n')); } }
      else out.push(...blocks(n));
    });
    push(); return out;
  }
  const fromHtml = root => blocks(root).join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
  window.MemoMD = { render, inline, fromHtml };
})();
