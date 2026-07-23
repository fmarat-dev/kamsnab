import type { Metadata } from "next";
import { kamsnab } from "@/lib/directus";
import { CatalogClient } from "./CatalogClient";

export async function generateMetadata({
  searchParams
}: {
  searchParams: Promise<{ category?: string }>;
}): Promise<Metadata> {
  const { category: categorySlug } = await searchParams;

  if (categorySlug) {
    const categories = await kamsnab.getCategories().catch(() => []);
    const category = categories.find((c) => c.slug === categorySlug);
    if (category) {
      const description = `${category.name} — купить в КАМСНАБ. Продажа и обслуживание складской техники, доставка по всей России.`;
      return {
        title: category.name,
        description,
        alternates: { canonical: `/catalog?category=${category.slug}` }
      };
    }
  }

  return {
    title: "Каталог складской техники",
    description: "Весь каталог складской техники КАМСНАБ: вилочные погрузчики, штабелёры, тележки и другое оборудование.",
    alternates: { canonical: "/catalog" }
  };
}

export default function CatalogPage() {
  return <CatalogClient />;
}
