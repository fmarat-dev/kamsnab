import type { ProductAttribute } from "@kamsnab/api-client";

// Характеристики в порядке из CMS (поле sort), без порядка — в конец.
export function sortAttributes(attributes: ProductAttribute[] | undefined): ProductAttribute[] {
  return [...(attributes ?? [])].sort((a, b) => (a.sort ?? 9999) - (b.sort ?? 9999));
}

// Ключевые для покупателя характеристики — показываем первыми.
const KEY_LABELS = [/грузоподъ[её]мн/i, /высота подъ[её]ма/i, /тип двигателя/i, /аккумулятор|акб/i, /производитель/i];

// Первые N характеристик для короткой таблицы у цены: сначала ключевые,
// затем остальные по порядку из CMS.
export function keyAttributes(attributes: ProductAttribute[] | undefined, limit = 5): ProductAttribute[] {
  const sorted = sortAttributes(attributes);
  const key = KEY_LABELS.flatMap((re) => sorted.filter((attr) => re.test(attr.label)).slice(0, 1));
  const rest = sorted.filter((attr) => !key.includes(attr));
  return [...key, ...rest].slice(0, limit);
}

// Строка «3000 кг · подъём 3000 мм · дизельный» под заголовком товара.
export function specsLine(attributes: ProductAttribute[] | undefined): string | undefined {
  const sorted = sortAttributes(attributes);
  const find = (re: RegExp) => sorted.find((attr) => re.test(attr.label))?.value?.trim();
  const parts = [
    find(/грузоподъ[её]мн/i),
    find(/высота подъ[её]ма/i)?.replace(/^/, "подъём "),
    find(/тип двигателя/i)
  ].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(" · ") : undefined;
}

export function formatRub(price: number | string): string {
  return `${new Intl.NumberFormat("ru-RU").format(Number(price))} ₽`;
}
