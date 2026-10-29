import type { Product } from "@kamsnab/api-client";
import { kamsnab, directusUrl } from "@/lib/directus";

// Товар по умолчанию для «Хита продаж» на главной — пока менеджер не выбрал
// свой в Directus (settings.featured_product).
export const DEFAULT_FEATURED_SLUG = "dizelnyy-pogruzchik-oxlift-cpcd-30-ag2";

// settings читаем без явного списка полей (= "*"): Directus вернёт только то,
// что есть и доступно публичной роли. Если поля featured_product ещё нет или
// на него нет прав — его просто не будет в ответе, без 403.
async function featuredSlugFromSettings(): Promise<string | null> {
  const settings = await kamsnab.getSettings().catch(() => null);
  const ref = settings?.featured_product;
  if (!ref) return null;
  if (typeof ref === "object") return ref.slug ?? null;

  try {
    const res = await fetch(`${directusUrl}/items/products/${encodeURIComponent(ref)}?fields=slug`);
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: { slug?: string } };
    return json.data?.slug ?? null;
  } catch {
    return null;
  }
}

// Выбранный в CMS товар; если он не задан, снят с публикации или CMS
// недоступна — товар по умолчанию; если и его нет — null (блок не рисуем).
export async function getFeaturedProduct(): Promise<Product | null> {
  const slug = await featuredSlugFromSettings();
  if (slug) {
    const product = await kamsnab.getProductBySlug(slug).catch(() => null);
    if (product) return product;
  }
  return kamsnab.getProductBySlug(DEFAULT_FEATURED_SLUG).catch(() => null);
}
