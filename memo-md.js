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
  window.MemoMD = { render, inline };
})();
