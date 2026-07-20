"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Container, Breadcrumbs, ProductCard, useFavoriteSlugs, clearFavoriteSlugs } from "@kamsnab/ui";
import { assetUrl, getProductBadge, type Product } from "@kamsnab/api-client";
import { kamsnab, directusUrl } from "@/lib/directus";

export default function FavoritesPage() {
  const slugs = useFavoriteSlugs();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slugs.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all(slugs.map((slug) => kamsnab.getProductBySlug(slug)))
      .then((items) => setProducts(items.filter((item): item is Product => item != null)))
      .finally(() => setLoading(false));
  }, [slugs]);

  return (
    <Container className="py-10">
      <Breadcrumbs items={[{ label: "Избранное" }]} />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-ink-800">Избранное</h1>
        {products.length > 0 && (
          <button onClick={clearFavoriteSlugs} className="text-sm font-medium text-ink-500 hover:text-accent-600">
            Очистить всё
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-ink-400">Загрузка...</p>
      ) : products.length === 0 ? (
        <p className="text-ink-500">
          В избранном пока пусто. Добавьте товары, нажав на значок сердца в{" "}
          <Link href="/catalog" className="text-brand-600 hover:underline">
            каталоге
          </Link>
          .
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={product.slug}
              href={`/catalog/${product.slug}`}
              showCompare
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
        </div>
      )}
    </Container>
  );
}
