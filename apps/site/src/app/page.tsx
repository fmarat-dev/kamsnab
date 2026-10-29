import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { assetUrl, type Product } from "@kamsnab/api-client";
import { Container, ProductCard, buttonClassName } from "@kamsnab/ui";
import { kamsnab, directusUrl } from "@/lib/directus";
import { ProductCardImage } from "@/components/ProductCardImage";
import { ConsultButton } from "@/components/ConsultButton";
import { CallbackForm } from "@/components/CallbackForm";
import { toCardProps } from "@/lib/product-card";
import { getFeaturedProduct } from "@/lib/featured";
import { formatRub, specsLine } from "@/lib/product-specs";

export const metadata: Metadata = {
  alternates: { canonical: "/" }
};

export const revalidate = 300;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// 1 модель, 2 модели, 5 моделей.
function pluralModels(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "модель";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "модели";
  return "моделей";
}

function priceLabel(product: Pick<Product, "price" | "price_note">) {
  return product.price != null ? formatRub(product.price) : product.price_note ?? "Цена по запросу";
}

const iconProps = {
  "aria-hidden": true,
  width: 28,
  height: 28,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  className: "mt-0.5 shrink-0 text-brand-600"
} as const;

const trustItems: { title: string; text: string; href?: string; icon: ReactNode }[] = [
  {
    title: "Гарантия 12 месяцев",
    text: "или 2000 моточасов",
    icon: (
      <svg {...iconProps}>
        <path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    )
  },
  {
    title: "Доставка по России",
    text: "с ближайшего склада за 7 дней",
    icon: (
      <svg {...iconProps}>
        <path d="M3 7h11v9H3z" />
        <path d="M14 10h4l3 3v3h-7" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="17" cy="18" r="2" />
      </svg>
    )
  },
  {
    title: "Сервис и гарантия",
    text: "Выезд сервисной бригады, ТО и ремонт",
    href: "/pages/service",
    icon: (
      <svg {...iconProps}>
        <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4 2.5-2.5z" />
      </svg>
    )
  },
  {
    title: "Оплата",
    text: "Безналичный расчёт, наличные или карта",
    href: "/pages/payment",
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18" />
      </svg>
    )
  }
];

function SectionHeader({ title, href, linkLabel }: { title: string; href: string; linkLabel: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-2">
      <h2 className="font-display text-[1.75rem] font-bold uppercase leading-tight text-ink-800 sm:text-h2">{title}</h2>
      <Link
        href={href}
        className="text-sm font-bold uppercase tracking-caps text-brand-700 transition-colors hover:text-brand-800"
      >
        {linkLabel}
      </Link>
    </div>
  );
}

function ProductGrid({ products, badge }: { products: Product[]; badge?: string }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => {
        const imageUrl = assetUrl(directusUrl, product.image);
        return (
          <ProductCard
            key={product.slug}
            href={`/catalog/${product.slug}`}
            showCompare
            showFavorite
            image={
              imageUrl && (
                <ProductCardImage
                  src={imageUrl}
                  alt={product.title}
                  className="object-contain transition-transform group-hover:scale-105"
                />
              )
            }
            product={toCardProps(product, badge)}
          />
        );
      })}
    </div>
  );
}

export default async function HomePage() {
  const [categories, forklifts, promoPool, stats, featured] = await Promise.all([
    kamsnab.getCategories().catch(() => []),
    kamsnab.getProducts({ categorySlug: "vilochnye-pogruzchiki", limit: 8, fields: "card" }).catch(() => []),
    kamsnab.getProducts({ limit: 60, fields: "card" }).catch(() => []),
    kamsnab.getStats().catch(() => ({ categories: 0, products: 0 })),
    getFeaturedProduct()
  ]);

  // Число моделей в плитке категории — по запросу на категорию (limit=0), при
  // сбое просто не показываем.
  const categoryCounts = await Promise.all(
    categories.map((category) => kamsnab.countProducts({ categorySlug: category.slug }).catch(() => null))
  );

  // Две маленькие карточки витрины: погрузчики, кроме «Хита»; для разнообразия
  // сначала не дизельные (хит по умолчанию — дизельный).
  const showcase = forklifts
    .filter((product) => product.slug !== featured?.slug && product.price != null)
    .sort((a, b) => Number(/дизел/i.test(a.title)) - Number(/дизел/i.test(b.title)))
    .slice(0, 2);

  const forkliftSlugs = new Set(forklifts.map((p) => p.slug));
  const promo = shuffle(promoPool.filter((p) => !forkliftSlugs.has(p.slug))).slice(0, 8);

  const featuredImage = featured ? assetUrl(directusUrl, featured.image) : undefined;
  const featuredSpecs = featured ? specsLine(featured.attributes) : undefined;

  const heroStats = [
    ...(stats.products > 0 ? [{ value: String(stats.products), label: "моделей в каталоге" }] : []),
    { value: "12 мес", label: "гарантия" },
    { value: "7 дней", label: "доставка по РФ" }
  ];

  return (
    <>
      <section className="bg-gradient-to-b from-brand-50 to-white">
        <Container className="grid grid-cols-1 items-center gap-10 py-10 sm:py-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12 lg:py-16">
          <div className="flex flex-col gap-5">
            <span className="text-xs font-semibold uppercase tracking-eyebrow text-brand-700 sm:text-[13px]">
              Складская техника · Чебоксары · вся Россия
            </span>
            <h1 className="font-display text-[2.125rem] font-bold uppercase leading-[1.06] tracking-[0.01em] text-ink-800 sm:text-5xl lg:text-display">
              Погрузчики и складская техника <span className="text-brand-600">с доставкой по России</span>
            </h1>
            <p className="max-w-[540px] text-base leading-relaxed text-ink-500 sm:text-lg">
              Электрические, дизельные и бензиновые погрузчики, штабелёры, ричтраки и навесное оборудование.
              Подберём модель под ваш склад, доставим с ближайшего склада за 7 дней, обслужим по гарантии.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link href="/catalog" className={`${buttonClassName("accent", "lg")} w-full sm:w-auto`}>
                Смотреть каталог
              </Link>
              <ConsultButton className="w-full sm:w-auto" />
            </div>
            <dl className="grid grid-cols-3 gap-3 pt-3 sm:flex sm:flex-wrap sm:gap-x-9 sm:gap-y-4">
              {heroStats.map((stat) => (
                <div key={stat.label} className="flex flex-col-reverse justify-end">
                  <dt className="mt-1.5 text-[11px] uppercase leading-snug tracking-label text-ink-400 sm:text-xs">{stat.label}</dt>
                  <dd className="font-display text-[1.75rem] font-semibold leading-none text-ink-800 sm:text-[2.375rem]">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {featured && (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <Link
                href={`/catalog/${featured.slug}`}
                className="group col-span-2 flex items-center gap-4 rounded-showcase bg-white p-4 shadow-card-hover transition-shadow hover:shadow-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 sm:gap-5 sm:p-6"
              >
                <div className="relative h-28 w-28 shrink-0 sm:h-40 sm:w-40">
                  {featuredImage && (
                    <Image
                      src={featuredImage}
                      alt={featured.title}
                      fill
                      priority
                      sizes="160px"
                      className="object-contain"
                    />
                  )}
                </div>
                <div className="flex min-w-0 flex-col gap-1.5 sm:gap-2">
                  <span className="text-xs font-bold uppercase tracking-label text-brand-700">Хит продаж</span>
                  <span className="text-[15px] font-semibold leading-snug text-ink-800 group-hover:text-brand-700 sm:text-[17px]">
                    {featured.title}
                  </span>
                  {featuredSpecs && <span className="text-[13px] text-ink-400">{featuredSpecs}</span>}
                  <span className="font-display text-2xl font-semibold text-ink-900 sm:text-[1.875rem]">
                    {priceLabel(featured)}
                  </span>
                </div>
              </Link>
              {showcase.map((product) => {
                const imageUrl = assetUrl(directusUrl, product.image);
                return (
                  <Link
                    key={product.slug}
                    href={`/catalog/${product.slug}`}
                    className="group flex min-w-0 flex-col gap-2 rounded-showcase bg-white p-3 shadow-raised transition-shadow hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 sm:p-4"
                  >
                    <div className="relative h-24 w-full sm:h-[7.5rem]">
                      {imageUrl && (
                        <Image
                          src={imageUrl}
                          alt={product.title}
                          fill
                          sizes="(min-width: 1024px) 220px, 45vw"
                          className="object-contain"
                        />
                      )}
                    </div>
                    <span className="line-clamp-2 text-sm font-semibold leading-snug text-ink-800 group-hover:text-brand-700">
                      {product.title}
                    </span>
                    <span className="mt-auto font-display text-xl font-semibold text-ink-900 sm:text-[1.375rem]">
                      {priceLabel(product)}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </Container>
      </section>

      <section className="border-y border-ink-100">
        <Container className="grid grid-cols-1 gap-6 py-7 sm:grid-cols-2 lg:grid-cols-4">
          {trustItems.map((item) => {
            const body = (
              <>
                {item.icon}
                <span className="flex flex-col">
                  <span className="font-display text-[17px] font-semibold uppercase tracking-[0.03em] text-ink-800 group-hover:text-brand-700">
                    {item.title}
                  </span>
                  <span className="text-sm text-ink-400">{item.text}</span>
                </span>
              </>
            );
            return item.href ? (
              <Link
                key={item.title}
                href={item.href}
                className="group flex items-start gap-3.5 rounded-tile focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
              >
                {body}
              </Link>
            ) : (
              <div key={item.title} className="flex items-start gap-3.5">
                {body}
              </div>
            );
          })}
        </Container>
      </section>

      {categories.length > 0 && (
        <section>
          <Container className="flex flex-col gap-6 pb-8 pt-12 sm:pt-16">
            <SectionHeader title="Каталог техники" href="/catalog" linkLabel="Весь каталог →" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category, index) => {
                const count = categoryCounts[index];
                return (
                  <Link
                    key={category.slug}
                    href={`/catalog/category/${category.slug}`}
                    className="group flex items-center gap-3 rounded-card border border-ink-100 bg-white p-3 transition-shadow sm:gap-4 sm:p-4 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                  >
                    <div className="relative h-16 w-16 shrink-0 sm:h-[88px] sm:w-[88px] overflow-hidden rounded-tile bg-ink-50">
                      {category.image && (
                        <Image
                          src={assetUrl(directusUrl, category.image)!}
                          alt=""
                          fill
                          sizes="(min-width: 640px) 88px, 64px"
                          className="object-contain p-1.5 mix-blend-multiply"
                        />
                      )}
                    </div>
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="font-display text-[17px] font-semibold uppercase leading-tight text-ink-800 group-hover:text-brand-700 sm:text-h3">
                        {category.name}
                      </span>
                      {count != null && count > 0 && (
                        <span className="text-[13px] text-ink-400 sm:text-sm">
                          {count} {pluralModels(count)}
                        </span>
                      )}
                    </span>
                  </Link>
                );
              })}
            </div>
          </Container>
        </section>
      )}

      <section>
        <Container className="flex flex-col gap-6 pb-12 pt-8 sm:pb-16">
          <SectionHeader title="Популярные погрузчики" href="/catalog/category/vilochnye-pogruzchiki" linkLabel="Все погрузчики →" />
          {forklifts.length > 0 ? (
            <ProductGrid products={forklifts} />
          ) : (
            <p className="text-ink-400">Каталог пока пуст — наполните коллекцию products в Directus.</p>
          )}
        </Container>
      </section>

      {promo.length > 0 && (
        <section className="bg-ink-50">
          <Container className="flex flex-col gap-6 py-12 sm:py-16">
            <SectionHeader title="Спецпредложения" href="/catalog" linkLabel="Весь каталог →" />
            <ProductGrid products={promo} badge="Спецпредложение" />
          </Container>
        </section>
      )}

      <section className="bg-brand-700 text-white">
        <Container className="grid grid-cols-1 items-center gap-8 py-12 sm:py-14 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <h2 className="font-display text-[1.75rem] font-bold uppercase leading-tight sm:text-4xl">
              Не знаете, какая модель нужна?
            </h2>
            <p className="text-base text-brand-100 sm:text-[17px]">
              Оставьте телефон — перезвоним и подберём технику под ваш склад и бюджет.
            </p>
          </div>
          <CallbackForm />
        </Container>
      </section>
    </>
  );
}
