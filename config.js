// Apps Script 웹앱 URL 과 키. apps-script/Code.gs 를 배포한 뒤 URL 을 바꿔 넣는다.
window.CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbyqCKoqdbT29femqUvt7jdXy1HFBHsjOheofcmslu17-kAmPp7NTCo4silq0uzLG567XA/exec',
  API_KEY: 'arskin',
  LEGACY_URL: 'https://script.google.com/macros/s/AKfycbzmissJaL15pLG8mKdyuQgnygqDaHkuhAJVit02MOofscH-dGKW2wEOSZojUwfZ2olh/exec', // 기존 캘린더 앱
  NAME: '전성환',
  DAYS: 5,            // 당일 기준 보여줄 근무일 수
  TIMELINE: [7, 22],  // 타임라인 시작/끝 시각
};
