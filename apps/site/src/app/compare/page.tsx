"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Container, Breadcrumbs, useCompareSlugs, removeCompareSlug, clearCompareSlugs } from "@kamsnab/ui";
import { assetUrl, type Product } from "@kamsnab/api-client";
import { kamsnab, directusUrl } from "@/lib/directus";

function formatPrice(product: Product) {
  if (product.price != null) return `${new Intl.NumberFormat("ru-RU").format(product.price)} ₽`;
  return product.price_note ?? "Цена по запросу";
}

export default function ComparePage() {
  const slugs = useCompareSlugs();
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

  const attributeLabels = Array.from(
    new Set(products.flatMap((product) => (product.attributes ?? []).map((attr) => attr.label)))
  );

  return (
    <Container className="py-10">
      <Breadcrumbs items={[{ label: "Сравнение" }]} />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-ink-800">Сравнение товаров</h1>
        {products.length > 0 && (
          <button onClick={clearCompareSlugs} className="text-sm font-medium text-ink-500 hover:text-accent-600">
            Очистить всё
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-ink-400">Загрузка...</p>
      ) : products.length === 0 ? (
        <p className="text-ink-500">
          Список сравнения пуст. Добавьте товары, нажав на значок сравнения на карточке товара в{" "}
          <Link href="/catalog" className="text-brand-600 hover:underline">
            каталоге
          </Link>
          .
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] table-fixed border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-40 border-b border-ink-100 p-3 text-left align-bottom text-ink-400"></th>
                {products.map((product) => {
                  const imageUrl = assetUrl(directusUrl, product.image);
                  return (
                    <th key={product.id} className="border-b border-ink-100 p-3 text-left align-top">
                      <button
                        onClick={() => removeCompareSlug(product.slug)}
                        title="Убрать из сравнения"
                        className="mb-2 text-xs font-medium text-ink-400 hover:text-accent-600"
                      >
                        ✕ Убрать
                      </button>
                      <Link href={`/catalog/${product.slug}`} className="flex flex-col gap-2">
                        <div className="aspect-[4/3] w-full rounded-card bg-ink-50 p-3">
                          {imageUrl ? (
                            <img src={imageUrl} alt={product.title} className="h-full w-full object-contain" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-ink-300">Нет фото</div>
                          )}
                        </div>
                        <span className="font-semibold text-ink-800 hover:text-brand-600">{product.title}</span>
                      </Link>
                      <p className="mt-1 font-bold text-ink-900">{formatPrice(product)}</p>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {attributeLabels.map((label) => (
                <tr key={label} className="odd:bg-ink-50/50">
                  <td className="border-b border-ink-100 p-3 font-medium text-ink-600">{label}</td>
                  {products.map((product) => {
                    const value = product.attributes?.find((attr) => attr.label === label)?.value;
                    return (
                      <td key={product.id} className="border-b border-ink-100 p-3 text-ink-800">
                        {value ?? "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {attributeLabels.length === 0 && (
                <tr>
                  <td colSpan={products.length + 1} className="p-3 text-ink-400">
                    У выбранных товаров нет характеристик для сравнения.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Container>
  );
}
