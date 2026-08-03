import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { kamsnab } from "@/lib/directus";
import { CatalogClient } from "./CatalogClient";

type CatalogSearchParams = Promise<{ category?: string; search?: string }>;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Каталог складской техники",
    description: "Весь каталог складской техники КАМСНАБ: вилочные погрузчики, штабелёры, тележки и другое оборудование.",
    alternates: { canonical: "/catalog" }
  };
}

export default async function CatalogPage({ searchParams }: { searchParams: CatalogSearchParams }) {
  const { category: categorySlug, search } = await searchParams;

  // Старый адрес категории (?category=slug) — теперь у категорий свой путь,
  // редиректим постоянно, чтобы не потерять уже проиндексированные ссылки.
  if (categorySlug) {
    permanentRedirect(`/catalog/category/${categorySlug}`);
  }

  const [categories, products] = await Promise.all([
    kamsnab.getCategories().catch(() => []),
    kamsnab.getProducts({ search }).catch(() => [])
  ]);

  return (
    <CatalogClient
      initialCategories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
      initialProducts={products}
      categorySlug={null}
      initialSearchTerm={search ?? ""}
    />
  );
}
