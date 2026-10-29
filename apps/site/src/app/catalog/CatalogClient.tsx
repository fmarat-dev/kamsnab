"use client";

import { useEffect, useState, useTransition, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Container,
  Breadcrumbs,
  ProductCard,
  type BreadcrumbItem,
  type CategoryOption
} from "@kamsnab/ui";
import type { ProductCardItem } from "@/lib/product-card";
import { ProductCardImage } from "@/components/ProductCardImage";

interface CatalogContentProps {
  categories: CategoryOption[];
  // Только товары текущей страницы и только поля карточки — весь каталог
  // с описаниями в RSC-payload больше не передаём.
  products: ProductCardItem[];
  // Категория теперь часть URL (/catalog/category/[slug]) — переключение
  // категории всегда полноценная навигация, а не смена локального состояния.
  categorySlug: string | null;
  initialSearchTerm: string;
  // Готовая серверная разметка пагинации (<Pagination />) — обычные ссылки.
  pagination?: ReactNode;
  // Готовые крошки с сервера (по ним же строится BreadcrumbList JSON-LD).
  // Без них — вычисляются из активной категории, как раньше.
  breadcrumbs?: BreadcrumbItem[];
  // Короткий вводный текст под заголовком.
  intro?: string;
}

function searchHref(term: string) {
  const trimmed = term.trim();
  return trimmed ? `/catalog?search=${encodeURIComponent(trimmed)}` : "/catalog";
}

function CatalogContent({
  categories,
  products,
  categorySlug,
  initialSearchTerm,
  pagination,
  breadcrumbs,
  intro
}: CatalogContentProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [isPending, startTransition] = useTransition();

  // Поиск живёт в URL (/catalog?search=...): сервер отдаёт уже отфильтрованную
  // страницу. На /catalog обновляем URL с задержкой по мере ввода; в категории
  // поиск идёт по всему каталогу, поэтому уходим только по Enter.
  useEffect(() => {
    if (categorySlug || searchTerm.trim() === initialSearchTerm.trim()) return;
    const timeout = setTimeout(() => {
      startTransition(() => router.replace(searchHref(searchTerm)));
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // URL сменился снаружи (ссылка, «Назад» в браузере) — подтягиваем поле
  // поиска, не трогая то, что пользователь ещё набирает.
  useEffect(() => {
    setSearchTerm((prev) => (prev.trim() === initialSearchTerm.trim() ? prev : initialSearchTerm));
  }, [initialSearchTerm]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    startTransition(() => router.push(searchHref(searchTerm)));
  }

  const activeCategory = categories.find((c) => c.slug === categorySlug);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const categoryLinkClass = (active: boolean) =>
    `flex min-h-[2.75rem] items-center rounded-button px-3 py-2 text-sm font-medium transition-colors ${
      active ? "bg-brand-50 font-semibold text-brand-700" : "text-ink-600 hover:bg-ink-50 hover:text-ink-800"
    }`;

  return (
    <Container className="flex flex-col gap-6 py-8 sm:py-10">
      <div>
        <Breadcrumbs
          items={
            breadcrumbs ?? [
              ...(activeCategory ? [{ label: "Каталог", href: "/catalog" }] : []),
              { label: activeCategory?.name ?? "Каталог" }
            ]
          }
        />
        <h1 className="font-display text-[1.875rem] font-bold uppercase leading-tight text-ink-800 sm:text-h1">
          {activeCategory?.name ?? "Каталог"}
        </h1>
        {intro && <p className="mt-2 max-w-3xl text-[15px] text-ink-500">{intro}</p>}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
        <aside className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
          <form role="search" onSubmit={handleSubmit}>
            <label htmlFor="catalog-search" className="sr-only">
              Поиск по каталогу
            </label>
            <input
              id="catalog-search"
              type="search"
              name="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Поиск по каталогу"
              className="min-h-[2.75rem] w-full rounded-button border border-ink-200 px-4 py-2 text-base outline-none focus:border-brand-500 sm:text-sm"
            />
          </form>
          <button
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            aria-expanded={filtersOpen}
            aria-controls="catalog-categories"
            className="flex min-h-[2.75rem] items-center justify-between rounded-button border border-ink-200 px-4 text-sm font-bold uppercase tracking-caps text-ink-800 lg:hidden"
          >
            <span>
              Категории
              {activeCategory && <span className="ml-2 font-medium normal-case tracking-normal text-ink-400">· {activeCategory.name}</span>}
            </span>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${filtersOpen ? "rotate-180" : ""}`}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <nav
            id="catalog-categories"
            aria-label="Категории каталога"
            className={`${filtersOpen ? "block" : "hidden"} rounded-card border border-ink-100 p-2 lg:block lg:border-0 lg:p-0`}
          >
            <p className="hidden px-3 pb-2 text-xs font-bold uppercase tracking-label text-ink-400 lg:block">Категории</p>
            <ul className="flex flex-col gap-0.5">
              <li>
                <Link href="/catalog" className={categoryLinkClass(!categorySlug)} aria-current={!categorySlug ? "page" : undefined}>
                  Все категории
                </Link>
              </li>
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/catalog/category/${category.slug}`}
                    className={categoryLinkClass(category.slug === categorySlug)}
                    aria-current={category.slug === categorySlug ? "page" : undefined}
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <div className="flex min-w-0 flex-col gap-6">
          <h2 className="sr-only">Товары</h2>
          {isPending ? (
            <p className="text-ink-400">Загрузка...</p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product, index) => (
                  <ProductCard
                    key={product.slug}
                    href={`/catalog/${product.slug}`}
                    showCompare
                    showFavorite
                    image={
                      product.imageUrl && (
                        <ProductCardImage
                          src={product.imageUrl}
                          alt={product.title}
                          priority={index === 0}
                          className="object-contain transition-transform group-hover:scale-105"
                        />
                      )
                    }
                    product={product}
                  />
                ))}
                {products.length === 0 && (
                  <p className="text-ink-400">
                    Ничего не найдено{initialSearchTerm ? ` по запросу «${initialSearchTerm}»` : ""}.
                  </p>
                )}
              </div>
              {pagination}
            </>
          )}
        </div>
      </div>
    </Container>
  );
}

export function CatalogClient(props: CatalogContentProps) {
  return <CatalogContent {...props} />;
}
