import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { kamsnab } from "@/lib/directus";
import { Pagination } from "@/components/Pagination";
import { CatalogClient } from "../../CatalogClient";
import { loadCatalogListing, pageTitleSuffix } from "../../catalog-listing";

// Общая логика для /catalog/category/[slug] (страница 1) и
// /catalog/category/[slug]/page/[n]. Пагинация — сегментом пути, а не ?page=,
// чтобы страницы категорий оставались статическими (ISR), а не динамическими.
export function categoryPageHref(slug: string, page: number) {
  return page > 1 ? `/catalog/category/${slug}/page/${page}` : `/catalog/category/${slug}`;
}

export async function categoryMetadata(slug: string, page: number): Promise<Metadata> {
  const categories = await kamsnab.getCategories().catch(() => []);
  const category = categories.find((c) => c.slug === slug);
  if (!category) return {};

  return {
    title: `${category.name}${pageTitleSuffix(page)}`,
    description: `${category.name} — купить в КАМСНАБ. Продажа и обслуживание складской техники, доставка по всей России.`,
    // Каждая страница пагинации канонична сама себе.
    alternates: { canonical: categoryPageHref(category.slug, page) }
  };
}

export async function CategoryListingPage({ slug, page }: { slug: string; page: number }) {
  const categories = await kamsnab.getCategories().catch(() => []);
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const listing = await loadCatalogListing({ categorySlug: slug, page });
  if (page > listing.totalPages) notFound();

  return (
    <CatalogClient
      categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
      products={listing.products}
      categorySlug={slug}
      initialSearchTerm=""
      pagination={
        <Pagination
          currentPage={page}
          totalPages={listing.totalPages}
          hrefForPage={(n) => categoryPageHref(slug, n)}
        />
      }
    />
  );
}
