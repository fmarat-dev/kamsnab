"use client";

import { useCompareSlugs, toggleCompareSlug } from "../lib/compare";
import { useFavoriteSlugs, toggleFavoriteSlug } from "../lib/favorites";

export interface ProductCardData {
  slug: string;
  title: string;
  sku?: string | null;
  imageUrl?: string;
  categoryName?: string;
  price?: number | null;
  priceNote?: string;
  badge?: string;
}

export interface ProductCardProps {
  product: ProductCardData;
  href: string;
  onSelect?: (slug: string) => void;
  showCompare?: boolean;
  showFavorite?: boolean;
}

function formatPrice(price?: number | null, priceNote?: string) {
  if (price == null) return priceNote ?? "Цена по запросу";
  const formatted = new Intl.NumberFormat("ru-RU").format(price);
  return priceNote ? `${priceNote} ${formatted} ₽` : `${formatted} ₽`;
}

export function ProductCard({ product, href, onSelect, showCompare, showFavorite }: ProductCardProps) {
  const compareSlugs = useCompareSlugs();
  const favoriteSlugs = useFavoriteSlugs();
  const isCompared = showCompare ? compareSlugs.includes(product.slug) : false;
  const isFavorite = showFavorite ? favoriteSlugs.includes(product.slug) : false;

  return (
    <a
      href={href}
      onClick={(event) => {
        if (onSelect) {
          event.preventDefault();
          onSelect(product.slug);
        }
      }}
      className="group flex flex-col overflow-hidden rounded-card border border-ink-100 bg-white transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink-50 p-4">
        {product.badge && (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-accent-500 px-3 py-1 text-xs font-semibold text-white">
            {product.badge}
          </span>
        )}
        {(showCompare || showFavorite) && (
          <div className="absolute right-3 top-3 z-10 flex gap-2">
            {showFavorite && (
              <button
                type="button"
                aria-pressed={isFavorite}
                title={isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  toggleFavoriteSlug(product.slug);
                }}
                className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                  isFavorite
                    ? "border-accent-500 bg-accent-500 text-white"
                    : "border-ink-200 bg-white/90 text-ink-500 hover:border-accent-400 hover:text-accent-600"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill={isFavorite ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            )}
            {showCompare && (
              <button
                type="button"
                aria-pressed={isCompared}
                title={isCompared ? "Убрать из сравнения" : "Добавить к сравнению"}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  toggleCompareSlug(product.slug);
                }}
                className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                  isCompared
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-ink-200 bg-white/90 text-ink-500 hover:border-brand-400 hover:text-brand-600"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="18" cy="18" r="3" />
                  <circle cx="6" cy="6" r="3" />
                  <path d="M13 6h3a2 2 0 0 1 2 2v7" />
                  <path d="M11 18H8a2 2 0 0 1-2-2V9" />
                </svg>
              </button>
            )}
          </div>
        )}
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            className="h-full w-full object-contain transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-300">Нет фото</div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        {product.categoryName && (
          <span className="text-xs font-medium uppercase tracking-wide text-brand-600">
            {product.categoryName}
          </span>
        )}
        <h3 className="font-semibold text-ink-800">{product.title}</h3>
        {product.sku && <span className="text-xs text-ink-400">Артикул: {product.sku}</span>}
        <p className="mt-auto pt-2 text-lg font-bold text-ink-900">
          {formatPrice(product.price, product.priceNote)}
        </p>
      </div>
    </a>
  );
}
