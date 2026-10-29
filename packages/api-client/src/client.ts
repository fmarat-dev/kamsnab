import { createDirectus, rest, readItems, readSingleton } from "@directus/sdk";
import type { QueryFilter } from "@directus/sdk";
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

// Поля, которые нужны карточке товара в списке (см. ProductCardData в @kamsnab/ui
// и getProductBadge — ему нужен category.slug).
const PRODUCT_CARD_FIELDS = [
  "id",
  "title",
  "slug",
  "sku",
  "price",
  "price_note",
  "image",
  "sort",
  "status",
  { category: ["id", "name", "slug"] }
] as const;

function productsFilter(params: { categorySlug?: string; search?: string }): QueryFilter<KamsnabSchema, Product> {
  return {
    status: { _eq: "published" as const },
    ...(params.categorySlug ? { category: { slug: { _eq: params.categorySlug } } } : {}),
    ...(params.search ? { title: { _icontains: params.search } } : {})
  };
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

    // offset/fields — необязательные (добавлены для пагинации каталога на сайте);
    // мини-приложения вызывают getProducts({ categorySlug }) как раньше.
    // fields: "card" — только поля для карточки товара (без описаний и
    // характеристик), чтобы не тащить лишнее в HTML/RSC-payload.
    getProducts(
      params: {
        categorySlug?: string;
        search?: string;
        limit?: number;
        offset?: number;
        fields?: "full" | "card";
      } = {}
    ): Promise<Product[]> {
      return directus.request(
        readItems("products", {
          filter: productsFilter(params),
          fields: params.fields === "card" ? PRODUCT_CARD_FIELDS : ["*", { category: ["*"], attributes: ["*"] }],
          // id — вторичный ключ: у товаров sort часто пуст, без него порядок
          // между запросами с offset нестабилен и пагинация теряет товары.
          sort: ["sort", "id"],
          limit: params.limit ?? -1,
          ...(params.offset ? { offset: params.offset } : {})
        })
      ) as Promise<Product[]>;
    },

    // Количество опубликованных товаров с теми же фильтрами, что у getProducts
    // (для пагинации). typed Query SDK не умеет meta=filter_count — сырой fetch,
    // как в getStats.
    async countProducts(params: { categorySlug?: string; search?: string } = {}): Promise<number> {
      const query = new URLSearchParams({ limit: "0", meta: "filter_count" });
      query.set("filter", JSON.stringify(productsFilter(params)));
      const res = await fetch(`${url}/items/products?${query.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to count products: ${res.status}`);
      }
      const json = await res.json();
      return Number(json.meta?.filter_count ?? 0);
    },

    // Только опубликованные: черновики не должны открываться на сайте
    // (публичная роль Directus их читает).
    async getProductBySlug(slug: string): Promise<Product | null> {
      const items = await directus.request(
        readItems("products", {
          filter: { slug: { _eq: slug }, status: { _eq: "published" } },
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
      return directus.request(readSingleton("settings")) as Promise<Settings>;
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
      // Поля из публичной формы попадают в HTML-письмо менеджеру без
      // экранирования (шаблон Directus Flow) — вырезаем теги здесь, чтобы
      // посетитель не мог вставить разметку/скрипты в письмо.
      const stripTags = (value: string) => value.replace(/<[^>]*>/g, "");
      const sanitized: Lead = {
        ...lead,
        name: stripTags(lead.name),
        message: lead.message ? stripTags(lead.message) : lead.message,
        page_url: lead.page_url && /^https?:\/\//.test(lead.page_url) ? stripTags(lead.page_url) : null
      };

      // Публичная роль имеет только create на leads, без read — Directus
      // отвечает 204 без тела. SDK's createItem() пытается распарсить тело
      // как JSON и падает на пустом ответе, поэтому здесь сырой fetch.
      const res = await fetch(`${url}/items/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sanitized)
      });
      if (!res.ok) {
        throw new Error(`Failed to create lead: ${res.status}`);
      }
    }
  };
}

export type KamsnabClient = ReturnType<typeof createKamsnabClient>;
