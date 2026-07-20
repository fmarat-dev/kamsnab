// Типы для глобального объекта window.WebApp, который создаёт официальный
// MAX Bridge SDK (подключён в index.html через <script src="https://st.max.ru/js/max-web-app.js">).
// Описаны только методы, которые реально используются в этом приложении.
// Источник: https://dev.max.ru/docs/webapps/bridge

export {};

type HapticImpactStyle = "soft" | "light" | "medium" | "heavy" | "rigid";
type HapticNotificationType = "error" | "success" | "warning";

interface MaxHapticFeedback {
  impactOccurred(style: HapticImpactStyle, disableVibrationFallback?: boolean): void;
  notificationOccurred(type: HapticNotificationType, disableVibrationFallback?: boolean): void;
  selectionChanged(disableVibrationFallback?: boolean): void;
}

interface MaxWebApp {
  initData: string;
  initDataUnsafe: unknown;
  /** Открыть произвольный URL во внешнем браузере. */
  openLink(url: string): void;
  /** Открыть deeplink max.ru (например, чат) внутри самого MAX. */
  openMaxLink(url: string): void;
  getViewportSize(): Promise<{ height: string; width: string }>;
  HapticFeedback: MaxHapticFeedback;
}

declare global {
  interface Window {
    WebApp?: MaxWebApp;
  }
}
