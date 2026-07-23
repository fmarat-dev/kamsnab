import type { MetadataRoute } from "next";
import { kamsnab } from "@/lib/directus";
import { siteUrl } from "@/lib/site";

const staticPages = ["", "/catalog", "/contacts", "/pages/service", "/pages/payment", "/pages/delivery", "/pages/privacy"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    kamsnab.getProducts().catch(() => []),
    kamsnab.getCategories().catch(() => [])
  ]);

  const staticEntries = staticPages.map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.6
  }));

  const categoryEntries = categories.map((category) => ({
    url: `${siteUrl}/catalog?category=${category.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.6
  }));

  const productEntries = products.map((product) => ({
    url: `${siteUrl}/catalog/${product.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.8
  }));

  return [...staticEntries, ...categoryEntries, ...productEntries];
}
