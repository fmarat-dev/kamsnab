export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://kam-snab.ru").replace(/\/$/, "");
export const siteName = "КАМСНАБ";

// Экранируем "<", чтобы данные (например, "</script>" в названии товара)
// не могли преждевременно закрыть тег при вставке через dangerouslySetInnerHTML.
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
