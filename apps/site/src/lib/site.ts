export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://kam-snab.ru").replace(/\/$/, "");
export const siteName = "КАМСНАБ";

// Экранируем "<", чтобы данные (например, "</script>" в названии товара)
// не могли преждевременно закрыть тег при вставке через dangerouslySetInnerHTML.
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

// Часы работы для LocalBusiness JSON-LD. В Directus work_hours — свободный
// текст («Пн-Пт: 09:00–18:00, Сб-Вс: выходной», дефолт в layout.tsx), структурных
// полей нет, поэтому дублируем его здесь. Поменяли график в CMS — поправьте и тут.
export const openingHoursSpecification = [
  {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: "09:00",
    closes: "18:00"
  }
];

// BreadcrumbList JSON-LD из тех же items, что уходят в <Breadcrumbs>.
// Компонент сам добавляет «Главная» первым пунктом — повторяем это здесь,
// чтобы разметка совпадала с видимыми крошками. У последнего пункта (текущая
// страница) ссылки обычно нет — schema.org это допускает.
export function breadcrumbJsonLd(items: { label: string; href?: string }[]) {
  const allItems = [{ label: "Главная", href: "/" }, ...items];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: allItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: `${siteUrl}${item.href}` } : {})
    }))
  };
}

// Текст для meta description: схлопываем пробелы и переносы строк из CMS и
// обрезаем по границе слова — Яндекс показывает в сниппете ~160 символов.
export function metaDescription(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max / 2 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:—-]+$/, "")}…`;
}
