"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Container, Breadcrumbs, CategoryFilters, ProductCard, type CategoryOption } from "@kamsnab/ui";
import { assetUrl, getProductBadge, type Product } from "@kamsnab/api-client";
import { kamsnab, directusUrl } from "@/lib/directus";

function CatalogContent() {
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeSlug, setActiveSlug] = useState<string | null>(searchParams.get("category"));
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") ?? "");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    kamsnab
      .getCategories()
      .then((items) => setCategories(items.map((c) => ({ slug: c.slug, name: c.name }))))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => {
      kamsnab
        .getProducts({ categorySlug: activeSlug ?? undefined, search: searchTerm.trim() || undefined })
        .then(setProducts)
        .catch(() => setProducts([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [activeSlug, searchTerm]);

  return (
    <Container className="flex flex-col gap-6 py-10">
      <Breadcrumbs items={[{ label: "Каталог" }]} />
      <h1 className="text-2xl font-bold text-ink-800">Каталог</h1>
      <input
        type="search"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        placeholder="Поиск по каталогу"
        className="w-full max-w-sm rounded-card border border-ink-200 px-4 py-2 text-sm outline-none focus:border-brand-500"
      />
      <CategoryFilters categories={categories} activeSlug={activeSlug} onSelect={setActiveSlug} />
      {loading ? (
        <p className="text-ink-400">Загрузка...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={product.slug}
              href={`/catalog/${product.slug}`}
              showCompare
              showFavorite
              product={{
                slug: product.slug,
                title: product.title,
                sku: product.sku,
                price: product.price,
                priceNote: product.price_note ?? undefined,
                imageUrl: assetUrl(directusUrl, product.image),
                categoryName:
                  typeof product.category === "object" && product.category ? product.category.name : undefined,
                badge: getProductBadge(product)
              }}
            />
          ))}
          {products.length === 0 && (
            <p className="text-ink-400">Ничего не найдено{searchTerm ? ` по запросу «${searchTerm}»` : ""}.</p>
          )}
        </div>
      )}
    </Container>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={null}>
      <CatalogContent />
    </Suspense>
  );
}
