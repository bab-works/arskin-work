// Apps Script 웹앱 URL 과 키. apps-script/Code.gs 를 배포한 뒤 URL 을 바꿔 넣는다.
// (아래 URL 은 요청 시 받은 주소. 해당 배포가 "모든 사용자" 액세스 + Code.gs 내용이 아니면 동작하지 않는다.)
window.CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbzmissJaL15pLG8mKdyuQgnygqDaHkuhAJVit02MOofscH-dGKW2wEOSZojUwfZ2olh/exec',
  API_KEY: 'arskin',
  NAME: '전성환',
  DAYS: 5,            // 당일 기준 보여줄 근무일 수
  TIMELINE: [7, 22],  // 타임라인 시작/끝 시각
};
