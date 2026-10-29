"use client";

import { useEffect, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Container, Breadcrumbs, CategoryFilters, ProductCard, type CategoryOption } from "@kamsnab/ui";
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
}

function searchHref(term: string) {
  const trimmed = term.trim();
  return trimmed ? `/catalog?search=${encodeURIComponent(trimmed)}` : "/catalog";
}

function CatalogContent({ categories, products, categorySlug, initialSearchTerm, pagination }: CatalogContentProps) {
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

  function handleSelectCategory(slug: string | null) {
    router.push(slug ? `/catalog/category/${slug}` : "/catalog");
  }

  return (
    <Container className="flex flex-col gap-6 py-10">
      <Breadcrumbs
        items={[
          ...(activeCategory ? [{ label: "Каталог", href: "/catalog" }] : []),
          { label: activeCategory?.name ?? "Каталог" }
        ]}
      />
      <h1 className="text-2xl font-bold text-ink-800">{activeCategory?.name ?? "Каталог"}</h1>
      <form role="search" onSubmit={handleSubmit} className="w-full max-w-sm">
        <input
          type="search"
          name="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Поиск по каталогу"
          className="w-full rounded-card border border-ink-200 px-4 py-2 text-sm outline-none focus:border-brand-500"
        />
      </form>
      <CategoryFilters categories={categories} activeSlug={categorySlug} onSelect={handleSelectCategory} />
      {isPending ? (
        <p className="text-ink-400">Загрузка...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
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
    </Container>
  );
}

export function CatalogClient(props: CatalogContentProps) {
  return <CatalogContent {...props} />;
}
