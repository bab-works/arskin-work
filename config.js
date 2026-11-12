// Apps Script 웹앱 URL 과 키. apps-script/Code.gs 를 배포한 뒤 URL 을 바꿔 넣는다.
window.CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbyqCKoqdbT29femqUvt7jdXy1HFBHsjOheofcmslu17-kAmPp7NTCo4silq0uzLG567XA/exec',
  API_KEY: 'arskin',
  LEGACY_URL: 'https://script.google.com/macros/s/AKfycbzmissJaL15pLG8mKdyuQgnygqDaHkuhAJVit02MOofscH-dGKW2wEOSZojUwfZ2olh/exec', // 기존 캘린더 앱
  // 일간보고서 하위 메뉴 순서. sheet 가 비어 있으면 "시트 연결 대기"로 표시.
  // 시트 ID 는 apps-script/Code.gs 의 REPORT_SHEETS 에도 같은 이름으로 넣어야 한다.
  PEOPLE: [
    { name: '박선희', sheet: '1uQzBVCdV0h840CFLDAbAXP2riNBSM7iuw0MjmdGgrtQ' },
    { name: '전성환', sheet: '1wx4ttcTh2Wro7xjFLIss6wcEqkAWouM1FYYnuiGIltw' },
    { name: '양욱정', sheet: '1h4kk5Q8EIOrm8T9Gfsb5dSa-xuw6o7usf_K0vLKR1SQ' },
  ],
  DEFAULT_PERSON: '전성환',
  DAYS: 5,            // 당일 기준 보여줄 근무일 수
  TIMELINE: [7, 22],  // 타임라인 시작/끝 시각
};
