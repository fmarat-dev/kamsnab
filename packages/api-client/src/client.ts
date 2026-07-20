import { createDirectus, rest, readItems, readSingleton } from "@directus/sdk";
import type { KamsnabSchema, Category, Product, Page, Lead, Settings } from "./types";

export function assetUrl(directusUrl: string, fileId: string | null | undefined): string | undefined {
  return fileId ? `${directusUrl}/assets/${fileId}` : undefined;
}

const BEST_PRICE_CATEGORY_SLUG = "vilochnye-pogruzchiki";
const BEST_PRICE_THRESHOLD = 1_000_000;

export function getProductBadge(product: Pick<Product, "category" | "price">): string | undefined {
  const categorySlug = typeof product.category === "object" ? product.category?.slug : undefined;
  if (categorySlug === BEST_PRICE_CATEGORY_SLUG && product.price != null && product.price < BEST_PRICE_THRESHOLD) {
    return "ЛУЧШАЯ ЦЕНА";
  }
  return undefined;
}

export function createKamsnabClient(url: string) {
  const directus = createDirectus<KamsnabSchema>(url).with(rest());

  return {
    directus,

    getCategories(): Promise<Category[]> {
      return directus.request(
        readItems("categories", {
          sort: ["sort"],
          limit: -1
        })
      );
    },

    getProducts(params: { categorySlug?: string; search?: string; limit?: number } = {}): Promise<Product[]> {
      return directus.request(
        readItems("products", {
          filter: {
            status: { _eq: "published" },
            ...(params.categorySlug ? { category: { slug: { _eq: params.categorySlug } } } : {}),
            ...(params.search ? { title: { _icontains: params.search } } : {})
          },
          fields: ["*", { category: ["*"], attributes: ["*"] }],
          sort: ["sort"],
          limit: params.limit ?? -1
        })
      ) as Promise<Product[]>;
    },

    async getProductBySlug(slug: string): Promise<Product | null> {
      const items = await directus.request(
        readItems("products", {
          filter: { slug: { _eq: slug } },
          fields: ["*", { category: ["*"], attributes: ["*"] }],
          limit: 1
        })
      );
      return (items[0] as Product) ?? null;
    },

    async getPageBySlug(slug: string): Promise<Page | null> {
      const items = await directus.request(
        readItems("pages", {
          filter: { slug: { _eq: slug } },
          limit: 1
        })
      );
      return items[0] ?? null;
    },

    getSettings(): Promise<Settings> {
      return directus.request(readSingleton("settings"));
    },

    async getStats(): Promise<{ categories: number; products: number }> {
      const [categoriesRes, productsRes] = await Promise.all([
        fetch(`${url}/items/categories?aggregate[count]=*`).then((r) => r.json()),
        fetch(`${url}/items/products?filter[status][_eq]=published&aggregate[count]=*`).then((r) => r.json())
      ]);
      return {
        categories: Number(categoriesRes.data?.[0]?.count ?? 0),
        products: Number(productsRes.data?.[0]?.count ?? 0)
      };
    },

    async createLead(lead: Lead): Promise<void> {
      // Публичная роль имеет только create на leads, без read — Directus
      // отвечает 204 без тела. SDK's createItem() пытается распарсить тело
      // как JSON и падает на пустом ответе, поэтому здесь сырой fetch.
      const res = await fetch(`${url}/items/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead)
      });
      if (!res.ok) {
        throw new Error(`Failed to create lead: ${res.status}`);
      }
    }
  };
}

export type KamsnabClient = ReturnType<typeof createKamsnabClient>;
