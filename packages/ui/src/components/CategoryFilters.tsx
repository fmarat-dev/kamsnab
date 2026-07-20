"use client";

export interface CategoryOption {
  slug: string;
  name: string;
}

export interface CategoryFiltersProps {
  categories: CategoryOption[];
  activeSlug?: string | null;
  onSelect: (slug: string | null) => void;
  variant?: "pills" | "dropdown";
}

export function CategoryFilters({ categories, activeSlug, onSelect, variant = "pills" }: CategoryFiltersProps) {
  if (variant === "dropdown") {
    return (
      <select
        value={activeSlug ?? ""}
        onChange={(event) => onSelect(event.target.value || null)}
        className="w-full rounded-card border border-ink-200 bg-white px-4 py-3 text-sm font-medium text-ink-700 outline-none focus:border-brand-500"
      >
        <option value="">Все категории</option>
        {categories.map((category) => (
          <option key={category.slug} value={category.slug}>
            {category.name}
          </option>
        ))}
      </select>
    );
  }

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
