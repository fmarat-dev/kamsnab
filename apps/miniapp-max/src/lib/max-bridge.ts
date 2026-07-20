// Обёртка над официальным MAX Bridge SDK.
// Подключается через <script src="https://st.max.ru/js/max-web-app.js"> в
// index.html и создаёт глобальный window.WebApp — без отдельной
// инициализации (см. типы в ./max-webapp.d.ts и документацию
// https://dev.max.ru/docs/webapps/bridge).
//
// window.WebApp существует только внутри настоящего клиента MAX, поэтому в
// обычном браузере (локальная разработка) методы ниже откатываются на
// стандартные веб-API.

function getWebApp() {
  return typeof window !== "undefined" ? window.WebApp : undefined;
}

export function openManagerChat(link: string) {
  const webApp = getWebApp();
  if (webApp) {
    webApp.openMaxLink(link);
  } else {
    window.open(link, "_blank");
  }
}

export function notifyLeadSuccess() {
  getWebApp()?.HapticFeedback.notificationOccurred("success");
}
