"use client";

import type { ReactNode } from "react";
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
  // Короткая строка характеристик («2000 кг · подъём 3000 мм»), если есть.
  specs?: string;
}

export interface ProductCardProps {
  product: ProductCardData;
  href: string;
  onSelect?: (slug: string) => void;
  showCompare?: boolean;
  showFavorite?: boolean;
  // Готовый элемент картинки. По умолчанию обычный <img> (нужно в мини-аппах
  // на Vite). На сайте (Next.js) сюда передают <ProductCardImage /> (next/image) —
  // именно элементом, не функцией: функции нельзя передавать из серверных
  // компонентов в клиентские через границу RSC.
  image?: ReactNode;
  // Подпись кнопки внизу карточки. По умолчанию: «Подробнее» при известной
  // цене, «Запросить цену» — когда цены нет. false — скрыть кнопку.
  ctaLabel?: string | false;
}

function formatPrice(price?: number | null, priceNote?: string) {
  if (price == null) return priceNote ?? "Цена по запросу";
  const formatted = new Intl.NumberFormat("ru-RU").format(price);
  return priceNote ? `${priceNote} ${formatted} ₽` : `${formatted} ₽`;
}

export function ProductCard({ product, href, onSelect, showCompare, showFavorite, image, ctaLabel }: ProductCardProps) {
  const compareSlugs = useCompareSlugs();
  const favoriteSlugs = useFavoriteSlugs();
  const isCompared = showCompare ? compareSlugs.includes(product.slug) : false;
  const isFavorite = showFavorite ? favoriteSlugs.includes(product.slug) : false;
  const hasPrice = product.price != null;
  const cta = ctaLabel === false ? null : ctaLabel ?? (hasPrice ? "Подробнее" : "Запросить цену");

  return (
    <a
      href={href}
      onClick={(event) => {
        if (onSelect) {
          event.preventDefault();
          onSelect(product.slug);
        }
      }}
      className="group flex h-full flex-col overflow-hidden rounded-card border border-ink-100 bg-white shadow-card transition-shadow hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink-50">
        {product.badge && (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-brand-700 px-2.5 py-1 text-[11px] font-bold uppercase tracking-label text-white">
            {product.badge}
          </span>
        )}
        {(showCompare || showFavorite) && (
          <div className="absolute right-2 top-2 z-10 flex flex-col gap-1.5">
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
                className={`flex h-11 w-11 items-center justify-center rounded-full shadow-card transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 ${
                  isFavorite
                    ? "bg-accent-600 text-white"
                    : "bg-white text-ink-500 hover:text-accent-600"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
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
                className={`flex h-11 w-11 items-center justify-center rounded-full shadow-card transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                  isCompared
                    ? "bg-brand-600 text-white"
                    : "bg-white text-ink-500 hover:text-brand-600"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
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
          image ? (
            image
          ) : (
            <img
              src={product.imageUrl}
              alt={product.title}
              className="h-full w-full object-contain p-6 mix-blend-multiply transition-transform group-hover:scale-105"
              loading="lazy"
            />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-300">Нет фото</div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 px-5 pb-5 pt-4">
        {product.categoryName && (
          <span className="text-[11px] font-bold uppercase tracking-label text-brand-700">{product.categoryName}</span>
        )}
        {product.specs && <span className="text-[13px] text-ink-400">{product.specs}</span>}
        <h3 className="text-base font-semibold leading-snug text-ink-800 group-hover:text-brand-700">{product.title}</h3>
        {product.sku && <span className="text-xs text-ink-400">Артикул: {product.sku}</span>}
        <p
          className={`mt-auto pt-1 font-display ${
            hasPrice ? "text-price text-ink-900" : "text-xl font-semibold uppercase tracking-caps text-ink-500"
          }`}
        >
          {formatPrice(product.price, product.priceNote)}
        </p>
        {cta && (
          <span
            className={`mt-1 inline-flex min-h-[2.75rem] items-center justify-center rounded-button px-3 text-[13px] font-bold uppercase tracking-caps transition-colors ${
              hasPrice
                ? "border border-ink-200 text-ink-800 group-hover:border-ink-300 group-hover:bg-ink-50"
                : "bg-accent-600 text-white group-hover:bg-accent-700"
            }`}
          >
            {cta}
          </span>
        )}
      </div>
    </a>
  );
}
