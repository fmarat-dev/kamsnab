import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { kamsnab } from "@/lib/directus";
import { CatalogClient } from "../../CatalogClient";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const categories = await kamsnab.getCategories().catch(() => []);
  const category = categories.find((c) => c.slug === slug);
  if (!category) return {};

  return {
    title: category.name,
    description: `${category.name} — купить в КАМСНАБ. Продажа и обслуживание складской техники, доставка по всей России.`,
    alternates: { canonical: `/catalog/category/${category.slug}` }
  };
}

export default async function CatalogCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const categories = await kamsnab.getCategories().catch(() => []);
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const products = await kamsnab.getProducts({ categorySlug: slug }).catch(() => []);

  return (
    <CatalogClient
      initialCategories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
      initialProducts={products}
      categorySlug={slug}
      initialSearchTerm=""
    />
  );
}
