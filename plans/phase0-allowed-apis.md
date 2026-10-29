# Phase 0: Allowed APIs (собрано 2026-10-29)

Plan: `plans/2026-10-29-seo-and-design.md`. Код не менялся. Next 15.5.22, @directus/sdk 17.0.2, caddy:2-alpine.

Короткий путь к Next: `NEXT=node_modules/.pnpm/next@15.5.22_@opentelemetry+api@1.9.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next`

---

## 1. Next.js 15 Metadata API

**Sources consulted:** `$NEXT/dist/lib/metadata/types/{metadata-interface,metadata-types,alternative-urls-types,twitter-types,opengraph-types}.d.ts`; `$NEXT/dist/build/webpack/plugins/next-types-plugin/index.js`; repo usage in `apps/site/src/app/**`.

**Concrete findings**
- `Metadata` fields (`metadata-interface.d.ts`): `metadataBase?: null | URL` (:63), `title?: null | string | TemplateString` (:85), `description?` (:95), `robots?: null | string | Robots` (:205), `alternates?: null | AlternateURLs` (:222), `openGraph?: null | OpenGraph` (:274), `twitter?: null | Twitter` (:292), `verification?: Verification` (:330).
- `alternates.canonical?: null | string | URL | AlternateLinkDescriptor` (`alternative-urls-types.d.ts:12`). Relative strings resolve against `metadataBase` (already set in `layout.tsx:16` to `siteUrl`). Canonical with query: `alternates: { canonical: \`/catalog/category/${slug}?page=${n}\` }` is a plain string, allowed.
- `Robots` (`metadata-types.d.ts:37-58`): `index?: boolean`, `follow?: boolean`, `noarchive`, `nosnippet`, `noimageindex`, `nocache`, `'max-image-preview'?: 'none'|'standard'|'large'`, `'max-snippet'?: number`, `googleBot?: string | RobotsInfo`. `noindex`/`nofollow` are typed `never` (deprecated) — use `index: false`.
- `twitter.card`: union `'summary' | 'summary_large_image' | 'player' | 'app'` (`twitter-types.d.ts:13-23`); `images?: TwitterImage | TwitterImage[]` (:10). Currently `layout.tsx:32-34` uses `card: "summary"`. `app/twitter-image.tsx` and `app/opengraph-image.tsx` already exist (file-convention images are auto-injected).
- `openGraph.images?: OGImage | OGImage[]`, `OGImage = string | URL | { url: string|URL; alt?; width?; height?; ... }` (`opengraph-types.d.ts:15, 94-101`). Note: setting `openGraph` in a child page REPLACES the parent's `openGraph` object (shallow merge per top-level key) — product page (`catalog/[slug]/page.tsx:29-34`) therefore loses `siteName/locale/type` from layout unless repeated.
- `Verification` (`metadata-types.d.ts:91-99`): `google | yahoo | yandex | me` (+ `other: Record<string, ...>`). Already used: `verification: { yandex: "e5999b584a43210a" }` (`layout.tsx:23`).
- `MetadataRoute.Sitemap` = `SitemapFile` (`metadata-interface.d.ts:554-570`): `{ url: string; lastModified?: string | Date; changeFrequency?: 'always'|'hourly'|'daily'|'weekly'|'monthly'|'yearly'|'never'; priority?: number; alternates?: { languages? }; images?: string[]; videos?: Videos[] }[]`.
- `MetadataRoute.Robots` exists (`:567`), used in `app/robots.ts`.
- `searchParams` in Next 15 is a Promise. Type-plugin check: `searchParams?: Promise<any>` (`next-types-plugin/index.js:124`). Repo pattern already: `type CatalogSearchParams = Promise<{ category?: string; search?: string }>` (`catalog/page.tsx:6`), `await searchParams` (:17). `generateMetadata` receives the same props: `generateMetadata({ params, searchParams }: { params: Promise<{slug:string}>; searchParams: Promise<{ page?: string; search?: string }> })`. Values may be `string | string[] | undefined` at runtime — normalize.

**Copy-ready snippet locations**
- Metadata w/ canonical: `apps/site/src/app/catalog/category/[slug]/page.tsx:6-17`.
- Promise searchParams: `apps/site/src/app/catalog/page.tsx:6,16-17`.
- Sitemap: `apps/site/src/app/sitemap.ts:7-32`.

**Gotcha (ISR):** `layout.tsx:40`, `page.tsx:14`, `contacts/page.tsx:12` export `revalidate = 300`. Reading `searchParams` in a page makes that route dynamic (no ISR). `/catalog` already reads searchParams (dynamic). `/catalog/category/[slug]` currently does NOT read searchParams and has no `generateStaticParams`; adding `?page=` via searchParams will make it dynamic too. Alternative that keeps it static: path segment pagination (e.g. `/catalog/category/[slug]/page/[n]`) — decision for Phase 1.

**Confidence:** high (read from installed .d.ts). Gap: did not check runtime merge behaviour in source, stated from Next docs knowledge.

---

## 2. next/font/google — Inter

**Sources:** `$NEXT/dist/compiled/@next/font/dist/google/font-data.json`, `.../google/index.d.ts:6660-6670`, `.../dist/types.d.ts`, `packages/ui/tailwind.preset.cjs:52-55`, `apps/site/tailwind.config.*`.

**Findings**
- Inter subsets: `['cyrillic','cyrillic-ext','greek','greek-ext','latin','latin-ext','vietnamese']`; weights `100..900` + `'variable'`; axes `opsz`, `wght`.
- Signature: `Inter<T extends CssVariable | undefined>(options?: { weight?; style?; display?: 'auto'|'block'|'swap'|'fallback'|'optional'; variable?: T; preload?: boolean; fallback?: string[]; adjustFontFallback?: boolean; subsets?: Array<...>; axes?: 'opsz'[] })` → `NextFontWithVariable` (`{ className; style; variable }`) when `variable` given. `CssVariable = \`--${string}\``.
- Snippet: `const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter", display: "swap" });` then `<html lang="ru" className={inter.variable}>` in `apps/site/src/app/layout.tsx` (currently `<html lang="ru">`, ~:73).
- Tailwind: `packages/ui/tailwind.preset.cjs:52-55` `fontFamily.sans: ["Inter", "-apple-system", ...]`. Change to `["var(--font-inter)", "Inter", "-apple-system", ...]`; miniapps (Vite) have no `--font-inter` → CSS var invalid → falls through? NOTE: an undefined `var()` inside `font-family` makes the whole declaration invalid-at-computed-time (falls back to inherited/initial, NOT to next list item). Safer: define `--font-inter` fallback, e.g. in preset use `"var(--font-inter, Inter)"` or set `:root{--font-inter: Inter}` in miniapp CSS. Verify in Phase 4.
- `next/font` is currently not used anywhere in `apps/site/src` (grep empty).
- Build fetches Google Fonts at build time → Docker build needs outbound network.

**Confidence:** high for API; medium for var() fallback nuance (CSS spec behaviour, verify in browser).

---

## 3. Schema.org for Yandex / Google

**Sources (not fetched this session; from known docs — re-verify in validators):**
- https://yandex.ru/support/webmaster/supported-schemas/goods-prices.html (Product/Offer)
- https://yandex.ru/support/webmaster/supported-schemas/ (list), https://webmaster.yandex.ru/tools/microtest/
- https://developers.google.com/search/docs/appearance/structured-data/product-snippet
- https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
- https://developers.google.com/search/docs/appearance/structured-data/local-business
- https://schema.org/ItemAvailability, https://schema.org/Offer, https://schema.org/PostalAddress, https://schema.org/OpeningHoursSpecification

**Findings**
- `Product`: `name` required; Google snippet needs one of `offers` / `review` / `aggregateRating`. Recommended: `image`, `description`, `sku`, `brand: { "@type": "Brand", name }`.
- `Offer`: `price` (number or numeric string, dot decimal) + `priceCurrency` ("RUB") required for a valid offer (Yandex and Google). If no price → omit `offers` entirely (or use `priceSpecification`, but still needs price). Optional: `url`, `availability`, `priceValidUntil`, `itemCondition` (`https://schema.org/NewCondition`).
- `availability` enum values (full URLs): `https://schema.org/InStock`, `OutOfStock`, `PreOrder`, `PreSale`, `BackOrder`, `Discontinued`, `InStoreOnly`, `LimitedAvailability`, `OnlineOnly`, `SoldOut`, `MadeToOrder`, `Reserved`.
- `BreadcrumbList`: `itemListElement: ListItem[]`, each `{ "@type": "ListItem", position: 1-based int, name: string, item: absolute URL }`; `item` may be omitted for the last (current) element.
- `LocalBusiness` (or `["Organization","LocalBusiness"]` / subtype `Store`): required `name`, `address` (`PostalAddress`). Recommended `telephone`, `url`, `geo` (`GeoCoordinates` latitude/longitude), `openingHoursSpecification`, `image`/`logo`, `priceRange`.
  - `PostalAddress`: `streetAddress`, `addressLocality`, `addressRegion`, `postalCode`, `addressCountry` ("RU").
  - `OpeningHoursSpecification`: `{ "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday",...,"Friday"], opens: "09:00", closes: "18:00" }`.
- Live data from Directus settings: address `"г. Чебоксары, ул. Вурнарское шоссе, д.11, офис 2"`, work_hours `"Пн-Пт: 09:00–18:00, Сб-Вс: выходной"` (free text — no structured fields; parse or hardcode). Phones: `phone`, `phone_landline`.

**Copy-ready:** `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(x) }} />` at `apps/site/src/app/catalog/[slug]/page.tsx:89-93`; `safeJsonLd` in `apps/site/src/lib/site.ts:6-8`; Organization in `layout.tsx:59-70`; Product JSON-LD `catalog/[slug]/page.tsx:71-87`; breadcrumb items at `catalog/[slug]/page.tsx:~94-98` and `CatalogClient.tsx:54-59`. Note `Breadcrumbs` component prepends `{ label: "Главная", href: "/" }` itself (`packages/ui/src/components/Breadcrumbs.tsx:11`) — the JSON-LD must include "Главная" as position 1 to match.

**Confidence:** medium-high (well-known spec; URLs not re-fetched today). `geo` coordinates unknown — gap.

---

## 4. packages/api-client + live Directus

**Sources:** `packages/api-client/src/{client,types,index}.ts`, `@directus/sdk` 17.0.2 `dist/index.d.ts`, `cms/schema/seed.mjs`, live GET requests to `https://cms.kam-snab.ru` (URL default from `NEXT_PUBLIC_DIRECTUS_URL`, `apps/site/src/lib/directus.ts:3`).

**Exported (index.ts):** `createKamsnabClient`, `assetUrl`, `getProductBadge`, type `KamsnabClient`, all types.
- `assetUrl(directusUrl: string, fileId: string|null|undefined): string|undefined` (client.ts:4)
- `getProductBadge(product: Pick<Product,"category"|"price">): string|undefined` (:11)
- `createKamsnabClient(url)` returns:
  - `directus` (raw SDK client, `createDirectus<KamsnabSchema>(url).with(rest())`) (:20)
  - `getCategories(): Promise<Category[]>` → `readItems("categories", { sort:["sort"], limit:-1 })` (:25-32)
  - `getProducts(params: { categorySlug?: string; search?: string; limit?: number } = {}): Promise<Product[]>` → `readItems("products", { filter: { status:{_eq:"published"}, category:{slug:{_eq}}?, title:{_icontains: search}? }, fields: ["*", { category:["*"], attributes:["*"] }], sort:["sort"], limit: params.limit ?? -1 })` (:34-47). **No offset/page/fields params.** Always fetches all attributes (heavy).
  - `getProductBySlug(slug): Promise<Product|null>` — no status filter (:49-58).
  - `getPageBySlug(slug): Promise<Page|null>` (:60-68)
  - `getSettings(): Promise<Settings>` → `readSingleton("settings")` (:70-72)
  - `getStats(): Promise<{categories:number; products:number}>` — raw fetch `?aggregate[count]=*` (:74-83). This is the only count method; no filter by category.
  - `createLead(lead: Lead): Promise<void>` raw POST (:85-108)
- SDK `Query` supports `fields, filter, search, sort, limit, offset, page, deep, alias` (`index.d.ts:963-973`). **No `meta` option** in typed Query → `readItems` cannot return `filter_count`. For totals use SDK `aggregate("products", { aggregate: { count: "*" }, query: { filter } })` (`index.d.ts:1266-1270, 2024`) or raw fetch like `getStats`. Live check: `?limit=0&meta=filter_count&filter[status][_eq]=published&filter[category][slug][_eq]=vilochnye-pogruzchiki` → `{"meta":{"filter_count":85}}` (works via raw fetch).

**Types (types.ts)**
- `Category { id; name; slug; sort: number|null; image: string|null }` (:1-7) — no description/seo_text.
- `Product { id; title; slug; sku: string|null; category: string|Category|null; price: number|null; price_note: string|null; short_description; description; image; gallery: string[]|null; attributes?: ProductAttribute[]; status; sort }` (:18-33) — **no date_updated, brand, in_stock/availability**.
- `Page { id; slug; title; content }` (:35-40) — no seo_description.
- `Settings` (:56-66): company_name, phone, phone_landline, whatsapp, email, address, work_hours, telegram_manager_username, max_manager_link.

**Live Directus (GET only)** — `/fields/*` is FORBIDDEN for public. Probed with `?fields=X`:
- products: `date_updated`, `date_created`, `brand`, `in_stock`, `availability`, `seo_text` → all "no permission or does not exist". Actual keys of an item: id,title,slug,category,price,price_note,short_description,description,status,sort,image,sku,gallery,attributes. Matches `cms/schema/seed.mjs:136-220` (no such fields were ever created).
- categories: `description`, `seo_text`, `date_updated` → do not exist. Keys: id,name,slug,sort,image.
- pages: `seo_description`, `date_updated` → do not exist.
- Counts: 377 published + 3 draft products (380 total), 13 categories. Sitemap 397 = 7 static + 13 categories + 377 products.
- Public read permission has `permissions: {}` (seed.mjs:~407-416) → drafts are publicly readable; `getProductBySlug` returns drafts → draft product pages are reachable. (Side finding.)
- Many products have `price: null`, `price_note: "По запросу"`, `sku: null`.

**Who uses what**
- miniapp-max `src/App.tsx:13-14,73,77,87,93` and miniapp-telegram `src/App.tsx:14-15,77,81,91,97`: api-client `assetUrl, getProductBadge, Product, createKamsnabClient`; methods `getCategories`, `getProducts({ categorySlug })`, `getProductBySlug`, `createLead`; ui `CategoryFilters, ProductCard, LeadForm, Button, useCompareSlugs, toggleCompareSlug, useFavoriteSlugs, toggleFavoriteSlug, CategoryOption, LeadFormValues`.
- site: `getProducts` in `page.tsx:59-60` (limit 8 / 60), `catalog/page.tsx:27` (search), `catalog/category/[slug]/page.tsx:25`, `catalog/[slug]/page.tsx:66` (limit 9), `sitemap.ts:9`, `CatalogClient.tsx:36-37` (client side); `getStats` `page.tsx:61`; `getSettings` `layout.tsx:57`, `contacts/page.tsx:15`; `getProductBySlug` product page, favorites, compare; `getPageBySlug` pages/[slug]; `createLead` `api/leads/route.ts:61`.
- => Extending `getProducts` params additively (optional `offset`/`page`/`fields`) is safe for miniapps; changing defaults/return type is not.

**Confidence:** high.

---

## 5. Caddy

**Sources:** `infra/caddy/Caddyfile`, `infra/docker-compose.yml:118-127`; https://caddyserver.com/docs/caddyfile/directives/redir, https://caddyserver.com/docs/caddyfile/patterns#redirect-www-subdomain.

**Findings**
- Current `infra/caddy/Caddyfile:1-3`: `kam-snab.ru { reverse_proxy site:3000 }`; also `tg.`, `max.`, `cms.` blocks (:5-15). No www block. Image `caddy:2-alpine`, mounted `./caddy:/etc/caddy`.
- Syntax: `redir [<matcher>] <to> [<code>]`; `<code>`: `temporary` (302, default), `permanent` (**301**), `html`, or explicit 3xx number.
- **Plan's check expects 308**, but `permanent` yields 301. For 308 write:
  ```
  www.kam-snab.ru {
  	redir https://kam-snab.ru{uri} 308
  }
  ```
  (Either is fine for SEO; just align the check.)
- `www` currently has no DNS record; Caddy will fail ACME for `www.kam-snab.ru` until DNS exists (other sites unaffected, it retries). Add DNS first.

**Confidence:** high.

---

## 6. CatalogClient, /favorites, /compare

**CatalogClient** (`apps/site/src/app/catalog/CatalogClient.tsx`, 115 lines):
- Props `CatalogContentProps { initialCategories: CategoryOption[]; initialProducts: Product[]; categorySlug: string|null; initialSearchTerm: string }` (:10-17).
- Search: local `searchTerm` state; on change (skips first render) debounced 300ms → client-side `kamsnab.getProducts({ categorySlug, search })` direct to Directus from the browser (:29-44). URL is NOT updated with search.
- Category: `router.push('/catalog/category/'+slug | '/catalog')` (:48-50) via `CategoryFilters`.
- No in-memory filtering; it just renders the full `products` array mapped into `ProductCard` props (:73-101). The full `Product[]` (with description + attributes) goes into RSC payload → the 4 MB.
- Card mapping to reuse: `:90-100` (slug, title, sku, price, priceNote, imageUrl, categoryName, badge).
- `/catalog?category=x` → `permanentRedirect` (`catalog/page.tsx:21-23`).

**/favorites & /compare** (`app/favorites/page.tsx:1`, `app/compare/page.tsx:1`): both are `"use client"` pages → cannot export `metadata`. They inherit layout `robots: { index: true, follow: true }` (`layout.tsx:22`). Live: `curl https://kam-snab.ru/compare` → `<meta name="robots" content="index, follow"/>`. robots.txt disallows them (`robots.ts:10`). Fix path: add `app/favorites/layout.tsx` / `app/compare/layout.tsx` (server) exporting `metadata = { robots: { index: false, follow: true } }`. Note: while robots.txt Disallow stays, crawlers can't see the noindex meta — consider removing them from Disallow.

---

## Anti-patterns / things that do NOT exist

- `metadata.yandex` — no such field; only `verification.yandex` (already set).
- `robots: { noindex: true }` — typed `never`/deprecated; use `index: false`.
- `twitter.card: "large"` etc. — only `summary | summary_large_image | player | app`.
- `getProducts({ page, offset, fields })` — NOT supported today; must be added (optional params) or use a new method.
- `readItems(..., { meta: "filter_count" })` — not in SDK typed Query; use `aggregate()` or raw fetch.
- `getStats()` per category — doesn't exist; only global counts.
- `Product.date_updated`, `Product.brand`, `Product.in_stock` / `availability`, `Category.description` / `seo_text`, `Page.seo_description`, any `date_updated` — DO NOT EXIST in Directus (verified live). Sitemap `lastModified` from `date_updated` is impossible without adding the field (Directus `date-updated` special field) + public read permission; brand only derivable from title (e.g. "OXLIFT") — not reliable.
- `availability: InStock` hardcoded (`catalog/[slug]/page.tsx:85`) — no data backs it.
- `offers.price: undefined` when price null — leads to Offer without price (invalid); many products have null price.
- `export const metadata` in a `"use client"` file — not allowed; use a sibling server `layout.tsx`.
- `redir ... permanent` does NOT give 308 (gives 301).
- `fontFamily.sans: ["var(--font-inter)", ...]` without a fallback definition in miniapps — undefined var invalidates the declaration.
- `aggregateRating` / `review` without real reviews — do not add.
