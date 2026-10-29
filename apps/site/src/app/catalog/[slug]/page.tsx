import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { sanitizeRichText } from "@/lib/sanitize";
import { assetUrl, getProductBadge, type ProductAttribute } from "@kamsnab/api-client";
import { Container, Breadcrumbs, ProductCard } from "@kamsnab/ui";
import { toCardProps } from "@/lib/product-card";
import { formatRub, keyAttributes, sortAttributes, specsLine } from "@/lib/product-specs";
import { kamsnab, directusUrl } from "@/lib/directus";
import { ProductCardImage } from "@/components/ProductCardImage";
import { siteUrl, safeJsonLd, breadcrumbJsonLd } from "@/lib/site";
import { ProductGallery } from "./ProductGallery";
import { ProductActions } from "./ProductActions";
import { ProductTabs, ProductTabLink } from "./ProductTabs";
import { ProductQuoteButtons, ProductStickyBar } from "./ProductQuote";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await kamsnab.getProductBySlug(slug);
  if (!product) return {};

  const category = typeof product.category === "object" ? product.category : undefined;
  const description =
    product.short_description ??
    `${product.title}${category ? ` — ${category.name}` : ""}. Продажа и доставка в КАМСНАБ.`;
  const imageUrl = assetUrl(directusUrl, product.image);

  return {
    title: product.title,
    description,
    alternates: { canonical: `/catalog/${product.slug}` },
    openGraph: {
      title: product.title,
      description,
      url: `${siteUrl}/catalog/${product.slug}`,
      images: imageUrl ? [{ url: imageUrl }] : undefined
    }
  };
}

function groupAttributes(attributes: ProductAttribute[]) {
  const groups = new Map<string, ProductAttribute[]>();
  for (const attr of attributes) {
    const key = attr.group ?? "Общие характеристики";
    const list = groups.get(key) ?? [];
    list.push(attr);
    groups.set(key, list);
  }
  return Array.from(groups.entries());
}

const DEFAULT_PHONE = "+7 (953) 448-37-58";

const benefits = [
  "Гарантия 12 месяцев или 2000 моточасов",
  "Доставка по России с ближайшего склада за 7 дней",
  "Самовывоз со склада в Чебоксарах"
];

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await kamsnab.getProductBySlug(slug);

  if (!product) notFound();

  const category = typeof product.category === "object" ? product.category : undefined;

  const galleryFileIds = product.gallery && product.gallery.length > 0 ? product.gallery : [product.image];
  const galleryImages = galleryFileIds
    .map((fileId) => assetUrl(directusUrl, fileId))
    .filter((url): url is string => Boolean(url));

  const attributeGroups =
    product.attributes && product.attributes.length > 0 ? groupAttributes(sortAttributes(product.attributes)) : [];
  const mainAttributes = keyAttributes(product.attributes, 5);
  const specs = specsLine(product.attributes);

  const [related, settings] = await Promise.all([
    category
      ? kamsnab.getProducts({ categorySlug: category.slug, limit: 9, fields: "card" }).catch(() => [])
      : Promise.resolve([]),
    kamsnab.getSettings().catch(() => null)
  ]);
  const relatedProducts = related.filter((item) => item.slug !== product.slug).slice(0, 8);
  const phone = settings?.phone || DEFAULT_PHONE;

  const breadcrumbItems = [
    { label: "Каталог", href: "/catalog" },
    ...(category ? [{ label: category.name, href: `/catalog/category/${category.slug}` }] : []),
    { label: product.title }
  ];

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    sku: product.sku ?? undefined,
    description: product.short_description ?? undefined,
    image: galleryImages.length > 0 ? galleryImages : undefined,
    category: category?.name,
    // Offer без цены невалиден для Яндекса и Google — у товаров «по запросу»
    // offers не выводим совсем.
    ...(product.price != null
      ? {
          offers: {
            "@type": "Offer",
            url: `${siteUrl}/catalog/${product.slug}`,
            priceCurrency: "RUB",
            price: product.price,
            // Поля наличия в Directus нет. InStock для товаров с ценой — временное
            // решение до решения владельца (добавить поле наличия или PreOrder).
            availability: "https://schema.org/InStock"
          }
        }
      : {})
  };

  return (
    <div>
      <Container className="pb-12 pt-6 sm:pt-8">
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: safeJsonLd(productJsonLd) }}
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd(breadcrumbItems)) }}
        />
        <Breadcrumbs items={breadcrumbItems} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-10">
          <div className="lg:sticky lg:top-4 lg:self-start">
            <ProductGallery images={galleryImages} title={product.title} badge={getProductBadge(product)} />
          </div>

          <div className="flex flex-col gap-4">
            {category && (
              <Link
                href={`/catalog/category/${category.slug}`}
                className="text-xs font-bold uppercase tracking-label text-brand-700 hover:text-brand-800"
              >
                {category.name}
              </Link>
            )}
            <h1 className="font-display text-2xl font-semibold uppercase leading-[1.15] text-ink-800 sm:text-[2rem]">
              {product.title}
            </h1>
            {(specs || product.sku) && (
              <div className="flex flex-col gap-1 text-sm text-ink-400">
                {specs && <span>{specs}</span>}
                {product.sku && <span>Артикул: {product.sku}</span>}
              </div>
            )}

            <div className="flex flex-col gap-4 lg:rounded-card lg:border lg:border-ink-100 lg:p-6 lg:shadow-card">
              <p
                className={`font-display font-semibold leading-none ${
                  product.price != null ? "text-[2.125rem] text-ink-900" : "text-2xl uppercase tracking-caps text-ink-500"
                }`}
              >
                {product.price != null ? formatRub(product.price) : product.price_note ?? "Цена по запросу"}
              </p>
              <div className="hidden lg:block">
                <ProductQuoteButtons productId={product.id} productTitle={product.title} phone={phone} />
              </div>
              <ul className="flex flex-col gap-2 text-sm text-ink-600">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2">
                    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mt-px shrink-0 text-brand-600">
                      <path d="M5 12l5 5L20 7" />
                    </svg>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            {mainAttributes.length > 0 && (
              <div className="flex flex-col gap-2">
                <dl className="overflow-hidden rounded-card border border-ink-100">
                  {mainAttributes.map((attr) => (
                    <div
                      key={attr.id}
                      className="flex justify-between gap-4 border-b border-ink-100 px-3.5 py-3 text-sm last:border-b-0"
                    >
                      <dt className="text-ink-400">{attr.label}</dt>
                      <dd className="text-right font-semibold text-ink-800">{attr.value}</dd>
                    </div>
                  ))}
                </dl>
                <ProductTabLink
                  tab="parameters"
                  className="inline-flex min-h-[2.75rem] items-center self-start text-[13px] font-bold uppercase tracking-caps text-brand-700 hover:text-brand-800"
                >
                  Все характеристики →
                </ProductTabLink>
              </div>
            )}

            <ProductActions slug={product.slug} />
          </div>
        </div>

        <div className="mt-10 lg:mt-14 lg:max-w-4xl">
          <ProductTabs
            tabs={[
              {
                id: "product",
                label: "О товаре",
                content: (
                  <p className="text-ink-600">
                    {product.short_description ?? "Информация о товаре уточняется у менеджера."}
                  </p>
                )
              },
              {
                id: "info",
                label: "Описание",
                content: product.description ? (
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: sanitizeRichText(product.description) }}
                  />
                ) : (
                  <p className="text-ink-400">Подробное описание уточняется у менеджера.</p>
                )
              },
              {
                id: "parameters",
                label: "Характеристики",
                content:
                  attributeGroups.length > 0 ? (
                    <div className="flex flex-col gap-6">
                      {attributeGroups.map(([group, attrs]) => (
                        <div key={group}>
                          {group !== "Общие характеристики" && (
                            <h3 className="mb-2 font-display text-h3 uppercase text-ink-800">{group}</h3>
                          )}
                          <table className="w-full text-sm">
                            <tbody>
                              {attrs.map((attr) => (
                                <tr key={attr.id} className="border-b border-ink-100 last:border-b-0 odd:bg-ink-50">
                                  <th scope="row" className="w-1/2 px-3 py-2.5 text-left font-normal text-ink-500">
                                    {attr.label}
                                  </th>
                                  <td className="px-3 py-2.5 font-medium text-ink-800">{attr.value}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-ink-400">Характеристики уточняются у менеджера.</p>
                  )
              },
              {
                id: "delivery",
                label: "Доставка",
                content: (
                  <div>
                    <p className="mb-2 text-ink-600">
                      Доставляем во все регионы РФ либо предоставляем самовывоз со склада в Чебоксарах.
                    </p>
                    <Link href="/pages/delivery" className="text-sm font-medium text-brand-700 hover:underline">
                      Подробнее об условиях доставки →
                    </Link>
                  </div>
                )
              },
              {
                id: "pay",
                label: "Оплата",
                content: (
                  <div>
                    <p className="mb-2 text-ink-600">
                      Лизинг через партнёров, безналичный расчёт для юрлиц, наличные и карта в офисе.
                    </p>
                    <Link href="/pages/payment" className="text-sm font-medium text-brand-700 hover:underline">
                      Подробнее об оплате →
                    </Link>
                  </div>
                )
              }
            ]}
          />
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-16 flex flex-col gap-6">
            <h2 className="font-display text-[1.75rem] font-bold uppercase leading-tight text-ink-800 sm:text-h2">
              С этим товаром покупают
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((item) => {
                const imageUrl = assetUrl(directusUrl, item.image);
                return (
                  <ProductCard
                    key={item.slug}
                    href={`/catalog/${item.slug}`}
                    showCompare
                    showFavorite
                    image={
                      imageUrl && (
                        <ProductCardImage
                          src={imageUrl}
                          alt={item.title}
                          className="object-contain transition-transform group-hover:scale-105"
                        />
                      )
                    }
                    product={toCardProps(item)}
                  />
                );
              })}
            </div>
          </div>
        )}
      </Container>
      <ProductStickyBar productId={product.id} productTitle={product.title} phone={phone} />
    </div>
  );
}
