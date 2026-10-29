import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { kamsnab } from "@/lib/directus";
import { safeJsonLd, breadcrumbJsonLd } from "@/lib/site";
import { Pagination } from "@/components/Pagination";
import { CatalogClient } from "../../CatalogClient";
import { loadCatalogListing, pageTitleSuffix } from "../../catalog-listing";

// Общая логика для /catalog/category/[slug] (страница 1) и
// /catalog/category/[slug]/page/[n]. Пагинация — сегментом пути, а не ?page=,
// чтобы страницы категорий оставались статическими (ISR), а не динамическими.
export function categoryPageHref(slug: string, page: number) {
  return page > 1 ? `/catalog/category/${slug}/page/${page}` : `/catalog/category/${slug}`;
}

// 1 модель, 2 модели, 5 моделей.
function pluralModels(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "модель";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "модели";
  return "моделей";
}

export async function categoryMetadata(slug: string, page: number): Promise<Metadata> {
  const categories = await kamsnab.getCategories().catch(() => []);
  const category = categories.find((c) => c.slug === slug);
  if (!category) return {};

  // Число моделей — для конкретики в сниппете; при сбое CMS — общий шаблон.
  const total = await kamsnab.countProducts({ categorySlug: slug }).catch(() => 0);
  const description =
    total > 0
      ? `${category.name}: ${total} ${pluralModels(total)} в каталоге КАМСНАБ. Продажа и сервис в Чебоксарах, доставка по России, гарантия.`
      : `${category.name} — купить в КАМСНАБ. Продажа и обслуживание складской техники, доставка по всей России.`;
  // Страницы пагинации канонические сами себе — не дублируем description дословно.
  const pageSuffix = page > 1 ? ` Страница ${page}.` : "";

  return {
    title: `${category.name}${pageTitleSuffix(page)}`,
    description: `${description}${pageSuffix}`,
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

  const breadcrumbs = [{ label: "Каталог", href: "/catalog" }, { label: category.name }];

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd(breadcrumbs)) }}
      />
      <CatalogClient
        categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
        products={listing.products}
        categorySlug={slug}
        initialSearchTerm=""
        intro={`${listing.total > 0 ? `${listing.total} ${pluralModels(listing.total)} в каталоге. ` : ""}Доставка по России с ближайшего склада, гарантия 12 месяцев или 2000 моточасов.`}
        breadcrumbs={breadcrumbs}
        pagination={
          <Pagination
            currentPage={page}
            totalPages={listing.totalPages}
            hrefForPage={(n) => categoryPageHref(slug, n)}
          />
        }
      />
    </>
  );
}
