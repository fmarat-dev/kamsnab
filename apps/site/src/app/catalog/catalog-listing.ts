import { kamsnab } from "@/lib/directus";
import { toCardProps, type ProductCardItem } from "@/lib/product-card";

// Сколько товаров на одной странице каталога/категории.
export const CATALOG_PAGE_SIZE = 24;

// Номер страницы из URL: undefined → 1, мусор/0/отрицательные → null (404).
export function parsePageParam(raw: string | string[] | undefined): number | null {
  if (raw === undefined) return 1;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!/^\d+$/.test(value)) return null;
  const page = Number(value);
  return page >= 1 ? page : null;
}

export function pageTitleSuffix(page: number) {
  return page > 1 ? ` — страница ${page}` : "";
}

export interface CatalogListing {
  products: ProductCardItem[];
  total: number;
  totalPages: number;
}

// Одна страница опубликованных товаров (только поля карточки) + общее число
// для пагинации. Номер вне диапазона проверяет вызывающая страница.
export async function loadCatalogListing(params: {
  categorySlug?: string;
  search?: string;
  page: number;
}): Promise<CatalogListing> {
  const filter = { categorySlug: params.categorySlug, search: params.search };
  // Первая страница при сбое CMS показывает пустой список, как раньше. Для
  // страниц 2+ ошибку пробрасываем: иначе total=0 превратится в 404, который
  // ISR закэширует; с ошибкой Next оставит прошлую удачную версию страницы.
  const fallback = <T,>(value: T) => (error: unknown): T => {
    if (params.page > 1) throw error;
    return value;
  };
  const [products, total] = await Promise.all([
    kamsnab
      .getProducts({
        ...filter,
        fields: "card",
        limit: CATALOG_PAGE_SIZE,
        offset: (params.page - 1) * CATALOG_PAGE_SIZE
      })
      .catch(fallback<Awaited<ReturnType<typeof kamsnab.getProducts>>>([])),
    kamsnab.countProducts(filter).catch(fallback(0))
  ]);

  return {
    products: products.map((product) => toCardProps(product)),
    total,
    totalPages: Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE))
  };
}
