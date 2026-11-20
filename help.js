// 공지사항 · 사용법 · 건의/제보 창. 새 공지가 있으면 버튼에 점(이 기기에서 본 공지 기준)
(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ls = (k, v) => { try { if (v === undefined) return localStorage[k]; localStorage[k] = v; } catch {} };
  // 공지: 맨 위가 최신. id 는 날짜순으로 커지게(새 공지 점 표시에 씀)
  const NOTICES = [
    { id: '2026-11-20b', date: '11월 20일', title: '연월차 캘린더 한 화면으로', items: [
      '캘린더와 연월차 탭을 합쳤어요. 위에서부터 사람별 카드 → 캘린더 → 등록 → 월별 사용 · 잔여 → 예정·지난 내역 순서예요.',
      '사람별 큰 카드에 남은 연차, 발생·사용·예정 일수, 12개월 사용 칸, 다가오는 휴가가 한눈에 보여요. 카드를 누르면 캘린더에서 그 사람만 보여요(다시 누르면 전체).',
      '월별 사용 표 오른쪽에 「잔여」 칸이 생겼어요(입사일을 넣은 사람만 계산).'] },
    { id: '2026-11-20a', date: '11월 20일', title: '원장님 워크시트 팔로업 리스트', items: [
      '원장님 워크시트에 「팔로업 리스트」 카드가 생겼어요. 일간보고서와 똑같이 하위 업무·진행률·항목별 메모·태그 칩을 써요.',
      '끝나지 않은 팔로업은 다음 날로 이어지고, 완료한 항목은 그날로 끝나요.'] },
    { id: '2026-11-19a', date: '11월 19일', title: '재촉 버튼 문구 수정 · 잔디 자동 재촉 끔', items: [
      '13·15·18시에 잔디로 자동 발송되던 원장님 재촉 메시지를 껐어요.',
      '재촉 버튼은 마케터 계정에만 보여요. 홈의 「문구 수정」으로 버튼 이름과 원장님께 보낼 메시지를 각자 바꿀 수 있어요.',
      '원장님 창 경고와 잔디 알림에는 보낸 사람이 정한 메시지가 그대로 나가요.'] },
    { id: '2026-11-18d', date: '11월 18일', title: '저장 상태 표시 · Ctrl+S 저장', items: [
      '오른쪽 위 인쇄 버튼 옆에 저장 상태가 보여요. 초록 점 「저장됨 14:32」, 파란 점 「저장 중…」, 빨간 「저장 실패 n건」.',
      'Ctrl+S(맥은 ⌘+S)를 누르면 고치던 칸을 확정하고, 실패한 저장을 다시 보내고, 메모까지 바로 저장해요. 브라우저의 「페이지 저장」 창은 뜨지 않아요.',
      '저장 실패가 남아 있거나 저장 중에 창을 닫으려 하면 경고가 떠요.',
      '「이번 주 발행」 카드가 콘텐츠 캘린더 시트뿐 아니라 채널별 실제 발행 글(블로그·인스타 시트의 날짜·링크)도 함께 보여줘요. 캘린더 시트를 안 채운 주에도 나와요.',
      '서버 첫 응답이 늦으면 「서버에 연결하는 중…」이 보이고, 20초가 지나면 기다리지 않고 화면을 열어요.'] },
    { id: '2026-11-18c', date: '11월 18일', title: '공지·사용법·건의 창, 팔로업 하위 업무 순서', items: [
      '사이드바 아래 「공지 · 사용법 · 건의」(휴대폰은 홈 화면 맨 아래)에서 업데이트 소식과 사용법을 보고, 건의·오류 제보를 보낼 수 있어요.',
      '팔로업 하위 업무 왼쪽 손잡이(⋮⋮)를 위아래로 끌면 순서가 바뀌어요. 타임라인으로 끌어 넣기도 그대로 돼요.',
      '팔로업 큰 항목 제목에도 태그(예: Figo) 내용)가 칩으로 보여요. 제목을 누르면 원문 그대로 고칠 수 있어요.'] },
    { id: '2026-11-18a', date: '11월 18일', title: '개인 메모장 · 로그아웃', items: [
      '「메모 · 회의록」이 지금 보던 화면 위에 떠 있는 창으로 열려요. 위 막대를 끌어 옮기고, 오른쪽 아래 모서리로 크기를 바꿔요.',
      '본문을 바로 고치면 돼요. 줄 맨 앞에 # (제목), - (목록), 1. (번호), [] (체크박스), > (인용)을 치고 띄우면 서식이 바뀌어요.',
      '사진은 📷 버튼, 붙여넣기, 끌어놓기로 넣어요. 폴더(이름·색)로 정리하고, 지운 메모는 휴지통에 30일 보관돼요.',
      '메모는 내 접속 코드로만 열려요. 다른 사람에게는 보이지 않아요.',
      '로그아웃: 홈 화면 맨 아래 또는 사이드바 아래.'] },
    { id: '2026-11-17', date: '11월 17일', title: '선순위·후순위, 체험단 타임라인 자동 기입', items: [
      '미스타전 변동업무를 후순위(위)·선순위(아래)로 나눴어요. 끌어서 옮기면 돼요.',
      '체험단)·리얼모델) 업무에 1600 같은 시각이 있으면 미스타전 타임라인에 1시간 블록으로 들어가요. 지운 블록은 다시 생기지 않아요.',
      '완료 목록에 하위 업무가 「상위 항목 -> 하위 항목」으로 나와요. 인쇄에는 메모가 빠지고 하위 업무까지 펼쳐서 나와요.',
      '저장이 잠깐 실패해도 자동으로 다시 시도해요.'] },
    { id: '2026-11-16', date: '11월 16일', title: '연월차 캘린더 통합, 매출 일일마감 업로드', items: [
      '연월차가 「아르스킨 연월차 캘린더」로 합쳐졌고, 입사일로 발생·잔여 연차를 계산해요. 직원 생일도 캘린더에 보여요.',
      '부서는 상담·코디·간호·피부·마케팅 5개로 나눴어요.',
      '매출표에 담당자별 일일마감 파일을 올리면 담당자별로 보관하고 그 달로 합쳐요.',
      '체험단·리얼모델 예약이 그날 변동업무에 자동으로 들어가요.',
      '확인 창이 화면 가운데에 떠요. 중간 폭 화면에서는 사이드바가 아이콘으로 접혀요.'] },
    { id: '2026-11-14', date: '11월 14일', title: '모바일 하단 탭', items: ['휴대폰 하단 탭이 떠 있는 유리 모양으로 바뀌었어요.'] },
    { id: '2026-11-13', date: '11월 13일', title: '대시보드 큰 업데이트', items: [
      '홈 시계·카드, 글자 크기 정리, 사이드바 아이콘 등 디자인을 전체적으로 다듬었어요.',
      '공통 업무를 캘린더로, 하위 업무를 타임라인으로 끌어 넣을 수 있어요. 팔로업 복제·항목별 메모가 생겼어요.',
      '시각은 24시로, 0930이나 14처럼 키보드로 바로 입력해요. 외부 미팅은 홈에 남은 시간이 보여요.',
      '보고서 카드 배치·색 편집, 카드 숨기기, 본문 폭 조절이 생겼어요.',
      '매출 대시보드가 새로 바뀌었어요. 사람별 메뉴 권한은 관리자가 설정에서 정해요.'] },
  ];
  const GUIDE = [
    ['시작하기', ['처음에 받은 접속 코드를 넣으면 이 기기에 기억돼요.', '다른 사람이 쓸 기기라면 홈 화면 맨 아래 또는 사이드바 아래 「로그아웃」을 눌러 주세요.', '사이드바 「메뉴 순서 편집」으로 메뉴 순서를 바꿀 수 있어요.']],
    ['일간보고서', ['고친 내용은 바로 저장돼요. 오른쪽 위 저장 표시가 「저장됨」인지 확인하고, 불안하면 Ctrl+S 로 바로 저장하세요. 「저장 실패」가 보이면 눌러서 다시 보내요.', '각 칸 아래 입력칸에 적고 Enter로 업무를 추가해요.', '왼쪽 상태 아이콘을 누르면 시작 전 → 진행 중 → 완료로 바뀌어요.', '손잡이(⋮⋮)를 끌면 순서와 칸을 옮겨요. 다른 업무 가운데에 0.7초 머무르면 그 업무의 하위 업무로 들어가요.', '「+ 하위 업무」를 넣으면 팔로업 프로젝트가 되고 진행률이 보여요. 하위 업무 손잡이로 순서를 바꾸거나 타임라인에 끌어 넣어요.', '팔로업 말풍선 아이콘으로 항목별 메모를 남겨요.', '오른쪽 위 ☰ 메뉴: 정렬, 완료 접기, 전일 가져오기, 휴지통(14일). 「?」는 단축키 목록이에요.', '아래 「카드 배치 편집」으로 카드 위치·색을 바꾸고, 「본문 폭 조절」로 폭을 맞춰요.']],
    ['타임라인 · 캘린더', ['타임라인 빈 곳을 위아래로 끌면 일정 블록이 생겨요. 업무를 끌어 넣으면 1시간 블록이 돼요.', '시각은 0930, 14처럼 숫자로 입력해요. 외부 미팅에 체크하면 홈에 남은 시간이 보여요.', '공용 캘린더 날짜의 +로 일정을 넣고, 일정을 1초 꾹 눌러 다른 날로 옮겨요. 반복(매주·격주·매월)과 다른 캘린더로 복제도 돼요.']],
    ['메모 · 회의록', ['사이드바(휴대폰은 하단 탭) 「메모」로 떠 있는 창을 열고 닫아요. 뒤 화면은 그대로 써요.', '목록 아이콘으로 목록을 열고 닫아요. 폴더 옆 ✎로 이름·색을 바꾸고, 메모를 폴더로 끌어 정리해요.', '줄 맨 앞 # · - · 1. · [] · > 뒤에 띄어쓰기를 하면 서식이 바뀌어요. Ctrl+B 굵게, Tab 들여쓰기.', '내 접속 코드로만 열리는 개인 메모예요.']],
    ['연월차 · 매출 · 원장님', ['아르스킨 연월차 캘린더 맨 위 사람별 카드에서 남은 연차를 보고, 카드를 누르면 캘린더가 그 사람만 보여줘요. 날짜 +로 연월차를 등록하고, 등록한 칸을 누르면 취소해요.', '월간 매출표는 매출 비밀번호가 필요해요. ☰ 메뉴에서 일일마감 파일을 올려요.', '원장님 워크시트에서 숙제를 확인하고, 홈의 재촉 버튼으로 원장님께 알림을 보내요.']],
  ];
  const latest = NOTICES[0].id, unseen = () => (ls('noticeSeen') || '') < latest;
  const markDots = () => document.querySelectorAll('.help-dot').forEach(d => d.hidden = !unseen());
  const call = async body => { const j = await (await fetch(window.CONFIG.API_URL, { method: 'POST', body: JSON.stringify({ code: ls('accessCode') || '', action: 'feedback', ...body }) })).json(); if (j.error) throw new Error(j.error); return j; };
  const when = s => { const d = new Date(s); return isNaN(d) ? '' : `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  let dlg, tab = 'notice', fb = null;

  function open(t) {
    tab = t || (unseen() ? 'notice' : tab);
    if (!dlg) {
      dlg = document.createElement('dialog'); dlg.className = 'help-dlg'; dlg.setAttribute('aria-labelledby', 'helpT');
      dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); }); // 바깥(배경) 누르면 닫힘
      document.body.append(dlg);
    }
    paint(); if (!dlg.open) dlg.showModal();
  }
  function paint() {
    const TABS = [['notice', '공지사항'], ['guide', '사용법'], ['fb', '건의 · 제보']];
    dlg.innerHTML = `<div class="hp-head"><h2 id="helpT">도움말</h2><div class="hp-tabs" role="tablist">${TABS.map(([k, l]) => `<button type="button" role="tab" aria-selected="${tab === k}" data-tab="${k}">${l}</button>`).join('')}</div><button type="button" class="hp-x" aria-label="닫기">✕</button></div><div class="hp-body" role="tabpanel"></div>`;
    dlg.querySelector('.hp-x').onclick = () => dlg.close();
    dlg.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; paint(); });
    const body = dlg.querySelector('.hp-body');
    if (tab === 'notice') {
      const seen = ls('noticeSeen') || '';
      body.innerHTML = NOTICES.map(n => `<article class="hp-note"><header><time>${esc(n.date)}</time>${n.id > seen ? '<em>NEW</em>' : ''}<b>${esc(n.title)}</b></header><ul>${n.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul></article>`).join('');
      ls('noticeSeen', latest); markDots();
    } else if (tab === 'guide') {
      body.innerHTML = GUIDE.map(([h, items], i) => `<details class="hp-guide"${i === 0 ? ' open' : ''}><summary>${esc(h)}</summary><ul>${items.map(x => `<li>${esc(x)}</li>`).join('')}</ul></details>`).join('') + `<p class="hp-more">찾는 내용이 없으면 「건의 · 제보」 탭에 질문을 남겨 주세요.</p>`;
    } else paintFb(body);
  }
  function paintFb(body) {
    body.innerHTML = `<form class="hp-form"><div class="hp-kinds" role="radiogroup" aria-label="종류">${['건의', '오류 제보', '질문'].map((k, i) => `<label><input type="radio" name="kind" value="${k}"${i ? '' : ' checked'}>${k}</label>`).join('')}</div>
      <textarea name="text" rows="4" maxlength="2000" required placeholder="불편한 점, 바라는 기능, 오류가 난 상황(어느 화면에서 무엇을 눌렀는지)을 적어 주세요."></textarea>
      <div class="hp-send"><small>관리자에게 보내져요. 처리 상황은 아래에서 볼 수 있어요.</small><button class="primary">보내기</button></div></form>
      <h3 class="hp-sub">${fb?.admin ? '받은 건의 · 제보 (전체)' : '내가 보낸 건의 · 제보'}</h3><div class="hp-list">${fb ? '' : '<p class="muted">불러오는 중…</p>'}</div>`;
    const form = body.querySelector('form');
    form.onsubmit = async e => { e.preventDefault(); const btn = form.querySelector('.primary'); btn.disabled = true;
      try { fb = await call({ op: 'add', kind: form.kind.value, text: form.text.value }); form.reset(); toast('보냈어요. 고맙습니다!'); paintList(body); } catch (err) { toast('보내지 못했어요: ' + err.message); } btn.disabled = false; };
    if (fb) paintList(body); else call({ op: 'list' }).then(j => { fb = j; if (dlg.open && tab === 'fb') paintFb(body); }).catch(err => { body.querySelector('.hp-list').innerHTML = `<p class="muted">목록을 불러오지 못했어요 (${esc(err.message)})</p>`; });
  }
  function paintList(body) {
    const box = body.querySelector('.hp-list'), adm = fb.admin;
    box.innerHTML = fb.items.length ? fb.items.map(x => `<article class="hp-fb st-${['접수', '확인 중', '처리됨'].indexOf(x.status)}" data-id="${esc(x.id)}"><header><span class="hp-kind">${esc(x.kind)}</span>${adm ? `<b>${esc(x.who)}</b>` : ''}<time>${when(x.at)}</time><span class="hp-st">${esc(x.status)}</span></header><p>${esc(x.text)}</p>
      ${adm ? `<div class="hp-admin"><select aria-label="상태">${['접수', '확인 중', '처리됨'].map(s => `<option${s === x.status ? ' selected' : ''}>${s}</option>`).join('')}</select><input placeholder="답변 (선택)" value="${esc(x.reply)}" maxlength="1000" aria-label="답변"><button type="button">저장</button></div>` : x.reply ? `<p class="hp-reply"><b>답변</b> ${esc(x.reply)}</p>` : ''}</article>`).join('')
      : '<p class="muted">아직 없어요.</p>';
    if (adm) box.querySelectorAll('.hp-fb').forEach(a => a.querySelector('button').onclick = async () => {
      try { fb = await call({ op: 'reply', id: a.dataset.id, status: a.querySelector('select').value, reply: a.querySelector('input').value }); toast('저장했어요'); paintList(body); } catch (err) { toast(err.message); } });
  }
  const toast = m => { const t = $('appToast'); if (!t) return; t.textContent = m; t.classList.remove('hidden'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.add('hidden'), 2600); };
  window.HelpHub = { open, markDots };
  document.querySelectorAll('[data-help]').forEach(b => b.onclick = () => open());
  markDots();
})();
