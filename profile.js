// 화면 개인 설정을 'PC(브라우저) × 접속 계정'별로: 다른 계정으로 들어오면 앞 계정 설정은 따로 보관하고, 이 계정 설정을 꺼낸다.
// 다른 스크립트보다 먼저 실행된다(설정을 읽기 전에 바꿔 끼우기). 접속 코드·매출 비밀번호 같은 비밀값과 데이터 캐시는 옮기지 않는다.
(() => {
  try {
    const ls = localStorage, code = ls.accessCode; if (!code) return;
    const SECRET = new Set(['accessCode', 'revenueKey', 'revenueAdminKey', 'rvLast']);
    const isUI = k => !SECRET.has(k) && !k.startsWith('c:') && !k.startsWith('profile@@');
    let h = 5381; for (const ch of code) h = ((h << 5) + h + ch.charCodeAt(0)) >>> 0; // 코드를 그대로 쓰지 않고 짧은 해시로
    const acct = h.toString(36), cur = ls['profile@@active'];
    if (cur === acct) return; // 지난번과 같은 계정
    const ui = () => Object.keys(ls).filter(isUI);
    if (cur) { // 앞 계정 설정 보관 → 비우고 → 이 계정 설정 꺼내기
      const snap = {}; ui().forEach(k => { snap[k] = ls[k]; }); ls['profile@@' + cur] = JSON.stringify(snap);
      ui().forEach(k => ls.removeItem(k)); Object.keys(ls).filter(k => k.startsWith('c:')).forEach(k => ls.removeItem(k)); // 데이터 캐시도 계정이 바뀌면 비움
      const mine = JSON.parse(ls['profile@@' + acct] || '{}'); Object.entries(mine).forEach(([k, v]) => { ls[k] = v; });
    } // cur 이 없으면: 이 PC에서 처음 나뉘는 것 → 지금 설정을 이 계정 것으로 삼음
    ls['profile@@active'] = acct;
  } catch (e) { /* 저장소를 못 쓰면 예전처럼 PC 공통 */ }
})();
