import type { Metadata } from "next";
import { CategoryListingPage, categoryMetadata } from "./category-listing";

// Страницы категорий рендерятся по первому запросу и кешируются (ISR):
// пустой generateStaticParams + revalidate, без сборки всех путей в билде.
export const revalidate = 300;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return categoryMetadata(slug, 1);
}

export default async function CatalogCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <CategoryListingPage slug={slug} page={1} />;
}
