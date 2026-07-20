"use client";

import Link from "next/link";
import { Heart, GitCompare } from "lucide-react";
import {
  useFavoriteSlugs,
  toggleFavoriteSlug,
  useCompareSlugs,
  toggleCompareSlug
} from "@kamsnab/ui";

export function ProductActions({ slug }: { slug: string }) {
  const favoriteSlugs = useFavoriteSlugs();
  const compareSlugs = useCompareSlugs();
  const isFavorite = favoriteSlugs.includes(slug);
  const isCompared = compareSlugs.includes(slug);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => toggleFavoriteSlug(slug)}
          aria-pressed={isFavorite}
          className={`flex flex-1 items-center justify-center gap-2 rounded-card border px-4 py-3 text-sm font-medium transition-colors ${
            isFavorite
              ? "border-accent-500 bg-accent-50 text-accent-600"
              : "border-ink-200 text-ink-600 hover:border-accent-400 hover:text-accent-600"
          }`}
        >
          <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
          {isFavorite ? "В избранном" : "В избранное"}
        </button>
        <button
          type="button"
          onClick={() => toggleCompareSlug(slug)}
          aria-pressed={isCompared}
          className={`flex flex-1 items-center justify-center gap-2 rounded-card border px-4 py-3 text-sm font-medium transition-colors ${
            isCompared
              ? "border-brand-600 bg-brand-50 text-brand-600"
              : "border-ink-200 text-ink-600 hover:border-brand-400 hover:text-brand-600"
          }`}
        >
          <GitCompare size={18} />
          {isCompared ? "В сравнении" : "Сравнить"}
        </button>
      </div>
      {favoriteSlugs.length > 0 && (
        <Link href="/favorites" className="text-xs text-ink-400 hover:text-brand-600 hover:underline">
          В избранном: {favoriteSlugs.length} {favoriteSlugs.length === 1 ? "товар" : "товара"}
        </Link>
      )}
    </div>
  );
}
