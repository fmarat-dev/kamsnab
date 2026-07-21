import Link from "next/link";
import { PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { assetUrl, getProductBadge, type Product } from "@kamsnab/api-client";
import { Container, Button, ProductCard } from "@kamsnab/ui";
import { kamsnab, directusUrl } from "@/lib/directus";

const advantages = [
  {
    icon: PackageCheck,
    title: "Широкий ассортимент",
    text: "Более 50 моделей складской техники в наличии"
  },
  {
    icon: ShieldCheck,
    title: "Гарантия качества",
    text: "Сертифицированная техника, гарантия 12 месяцев или 2000 моточасов"
  },
  {
    icon: Truck,
    title: "Доставка",
    text: "Доставим технику с ближайшего склада по всей России в течение 7 дней"
  }
];

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function toCardProps(product: Product, badge?: string) {
  return {
    slug: product.slug,
    title: product.title,
    sku: product.sku,
    price: product.price,
    priceNote: product.price_note ?? undefined,
    imageUrl: assetUrl(directusUrl, product.image),
    categoryName: typeof product.category === "object" && product.category ? product.category.name : undefined,
    badge: badge ?? getProductBadge(product)
  };
}

export default async function HomePage() {
  const [categories, forklifts, promoPool, stats] = await Promise.all([
    kamsnab.getCategories().catch(() => []),
    kamsnab.getProducts({ categorySlug: "vilochnye-pogruzchiki", limit: 8 }).catch(() => []),
    kamsnab.getProducts({ limit: 60 }).catch(() => []),
    kamsnab.getStats().catch(() => ({ categories: 0, products: 0 }))
  ]);

  const forkliftSlugs = new Set(forklifts.map((p) => p.slug));
  const promo = shuffle(promoPool.filter((p) => !forkliftSlugs.has(p.slug))).slice(0, 8);

  return (
    <>
      <section className="bg-ink-700 py-16 text-white sm:py-24">
        <Container className="flex flex-col gap-4">
          <h1 className="text-3xl font-extrabold sm:text-4xl">Складская техника от КАМСНАБ</h1>
          <p className="max-w-2xl text-ink-100">
            Электрические, дизельные и бензиновые погрузчики, штабелеры, ричтраки и навесное
            оборудование. Доставка по РФ, сертификация, гарантия 12 месяцев или 2000 моточасов.
          </p>
          <div className="flex flex-wrap items-center gap-6 pt-2">
            <Link href="/catalog">
              <Button variant="accent">Смотреть каталог</Button>
            </Link>
            {stats.products > 0 && (
              <span className="text-sm text-ink-200">
                <strong className="text-white">{stats.products}+</strong> единиц техники ·{" "}
                <strong className="text-white">{stats.categories}</strong> категорий
              </span>
            )}
          </div>
        </Container>
      </section>

      <section className="border-b border-ink-100 py-12">
        <Container className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {advantages.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex flex-col gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-card bg-brand-50 text-brand-600">
                <Icon size={24} />
              </div>
              <h3 className="font-semibold text-ink-800">{title}</h3>
              <p className="text-sm text-ink-500">{text}</p>
            </div>
          ))}
        </Container>
      </section>

      <section className="py-12">
        <Container className="flex flex-col gap-6">
          <h2 className="text-2xl font-bold text-ink-800">Каталог по категориям</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/catalog?category=${category.slug}`}
                className="group flex flex-col overflow-hidden rounded-card border border-ink-100 bg-white transition-shadow hover:shadow-lg"
              >
                <div className="aspect-square w-full overflow-hidden bg-ink-50 p-6">
                  {category.image ? (
                    <img
                      src={assetUrl(directusUrl, category.image)}
                      alt={category.name}
                      className="h-full w-full object-contain transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-ink-300">Нет фото</div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-semibold text-ink-800">{category.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-ink-50 py-12">
        <Container className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-ink-800">Популярные модели</h2>
            <Link href="/catalog?category=vilochnye-pogruzchiki" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              Все погрузчики →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {forklifts.map((product) => (
              <ProductCard
                key={product.slug}
                href={`/catalog/${product.slug}`}
                showCompare
                showFavorite
                product={toCardProps(product)}
              />
            ))}
            {forklifts.length === 0 && (
              <p className="text-ink-400">Каталог пока пуст — наполните коллекцию products в Directus.</p>
            )}
          </div>
        </Container>
      </section>

      {promo.length > 0 && (
        <section className="py-12">
          <Container className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-ink-800">Спецпредложения</h2>
              <Link href="/catalog" className="text-sm font-medium text-brand-600 hover:text-brand-700">
                Весь каталог →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {promo.map((product) => (
                <ProductCard
                  key={product.slug}
                  href={`/catalog/${product.slug}`}
                  showCompare
                  showFavorite
                  product={toCardProps(product, "Спецпредложение")}
                />
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
