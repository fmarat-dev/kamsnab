import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { parsePageParam } from "../../../../catalog-listing";
import { CategoryListingPage, categoryMetadata } from "../../category-listing";

type CategoryPageParams = Promise<{ slug: string; n: string }>;

// Страницы категорий рендерятся по первому запросу и кешируются (ISR):
// пустой generateStaticParams + revalidate, без сборки всех путей в билде.
export const revalidate = 300;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: CategoryPageParams }): Promise<Metadata> {
  const { slug, n } = await params;
  const page = parsePageParam(n);
  if (page === null) return {};
  return categoryMetadata(slug, page);
}

export default async function CatalogCategoryPagedPage({ params }: { params: CategoryPageParams }) {
  const { slug, n } = await params;
  const page = parsePageParam(n);
  if (page === null) notFound();
  // /page/1 — дубль основной страницы категории.
  if (page === 1) permanentRedirect(`/catalog/category/${slug}`);
  return <CategoryListingPage slug={slug} page={page} />;
}
