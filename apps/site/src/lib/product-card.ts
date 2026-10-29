import { assetUrl, getProductBadge, type Product } from "@kamsnab/api-client";
import type { ProductCardData } from "@kamsnab/ui";
import { directusUrl } from "@/lib/directus";

// Лёгкая форма товара для списков (каталог, категории, главная): только то,
// что рисует ProductCard. Полный Product (описание, характеристики) в
// клиентские компоненты не передаём — иначе он целиком уходит в RSC-payload.
export type ProductCardItem = ProductCardData & { slug: string; title: string };

export function toCardProps(product: Product, badge?: string): ProductCardItem {
  return {
    slug: product.slug,
    title: product.title,
    sku: product.sku,
    price: product.price,
    priceNote: product.price_note ?? undefined,
    imageUrl: assetUrl(directusUrl, product.image),
    categoryName: typeof product.category === "object" && product.category ? product.category.name : undefined,
    badge: badge ?? getProductBadge(product)
  };
}
