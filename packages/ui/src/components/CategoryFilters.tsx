"use client";

export interface CategoryOption {
  slug: string;
  name: string;
}

export interface CategoryFiltersProps {
  categories: CategoryOption[];
  activeSlug?: string | null;
  onSelect: (slug: string | null) => void;
}

export function CategoryFilters({ categories, activeSlug, onSelect }: CategoryFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(null)}
        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
          !activeSlug ? "bg-brand-600 text-white" : "bg-ink-50 text-ink-600 hover:bg-ink-100"
        }`}
      >
        Все категории
      </button>
      {categories.map((category) => (
        <button
          key={category.slug}
          onClick={() => onSelect(category.slug)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            activeSlug === category.slug
              ? "bg-brand-600 text-white"
              : "bg-ink-50 text-ink-600 hover:bg-ink-100"
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
