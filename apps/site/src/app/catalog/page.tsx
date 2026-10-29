import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { kamsnab } from "@/lib/directus";
import { Pagination } from "@/components/Pagination";
import { CatalogClient } from "./CatalogClient";
import { loadCatalogListing, pageTitleSuffix, parsePageParam } from "./catalog-listing";

type CatalogSearchParams = Promise<{
  category?: string | string[];
  search?: string | string[];
  page?: string | string[];
}>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function catalogHref(page: number, search?: string) {
  const query = new URLSearchParams();
  if (search) query.set("search", search);
  if (page > 1) query.set("page", String(page));
  const qs = query.toString();
  return qs ? `/catalog?${qs}` : "/catalog";
}

export async function generateMetadata({ searchParams }: { searchParams: CatalogSearchParams }): Promise<Metadata> {
  const params = await searchParams;
  const search = firstValue(params.search)?.trim();
  const page = parsePageParam(params.page) ?? 1;

  const base = {
    title: `Каталог складской техники${pageTitleSuffix(page)}`,
    description: "Весь каталог складской техники КАМСНАБ: вилочные погрузчики, штабелёры, тележки и другое оборудование."
  };

  // Результаты поиска не индексируем, но ссылки на товары пусть робот видит.
  if (search) {
    return { ...base, robots: { index: false, follow: true } };
  }

  // Каждая страница пагинации канонична сама себе (не первой странице).
  return { ...base, alternates: { canonical: catalogHref(page) } };
}

export default async function CatalogPage({ searchParams }: { searchParams: CatalogSearchParams }) {
  const params = await searchParams;
  const categorySlug = firstValue(params.category);
  const search = firstValue(params.search)?.trim() || undefined;

  // Старый адрес категории (?category=slug) — теперь у категорий свой путь,
  // редиректим постоянно, чтобы не потерять уже проиндексированные ссылки.
  if (categorySlug) {
    permanentRedirect(`/catalog/category/${categorySlug}`);
  }

  const page = parsePageParam(params.page);
  if (page === null) notFound();
  // ?page=1 — дубль первой страницы.
  if (firstValue(params.page) !== undefined && page === 1) {
    permanentRedirect(catalogHref(1, search));
  }

  const [categories, listing] = await Promise.all([
    kamsnab.getCategories().catch(() => []),
    loadCatalogListing({ search, page })
  ]);
  if (page > listing.totalPages) notFound();

  return (
    <CatalogClient
      categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
      products={listing.products}
      categorySlug={null}
      initialSearchTerm={search ?? ""}
      intro={
        search
          ? `Найдено: ${listing.total}.`
          : "Вилочные погрузчики, штабелёры, ричтраки, тележки и навесное оборудование. Доставка по России с ближайшего склада, гарантия 12 месяцев или 2000 моточасов."
      }
      pagination={
        <Pagination
          currentPage={page}
          totalPages={listing.totalPages}
          hrefForPage={(n) => catalogHref(n, search)}
        />
      }
    />
  );
}
