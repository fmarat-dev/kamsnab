import { useEffect, useState } from "react";
import WebApp from "@twa-dev/sdk";
import {
  CategoryFilters,
  ProductCard,
  LeadForm,
  Button,
  useCompareSlugs,
  toggleCompareSlug,
  useFavoriteSlugs,
  toggleFavoriteSlug,
  type CategoryOption,
  type LeadFormValues
} from "@kamsnab/ui";
import { assetUrl, getProductBadge, type Product } from "@kamsnab/api-client";
import { kamsnab, directusUrl } from "./lib/directus";

const managerUsername = import.meta.env.VITE_MANAGER_TELEGRAM_USERNAME;

function openManagerChat() {
  WebApp.openTelegramLink(`https://t.me/${managerUsername}`);
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function CompareIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="18" cy="18" r="3" />
      <circle cx="6" cy="6" r="3" />
      <path d="M13 6h3a2 2 0 0 1 2 2v7" />
      <path d="M11 18H8a2 2 0 0 1-2-2V9" />
    </svg>
  );
}

type View = "catalog" | "favorites" | "compare";

export default function App() {
  const [view, setView] = useState<View>("catalog");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeSlug, setActiveSlug] = useState<string | null>("vilochnye-pogruzchiki");
  const [selected, setSelected] = useState<Product | null>(null);
  const [listedProducts, setListedProducts] = useState<Product[]>([]);

  const compareSlugs = useCompareSlugs();
  const favoriteSlugs = useFavoriteSlugs();

  useEffect(() => {
    kamsnab.getCategories().then((items) => setCategories(items.map((c) => ({ slug: c.slug, name: c.name }))));
  }, []);

  useEffect(() => {
    kamsnab.getProducts({ categorySlug: activeSlug ?? undefined }).then(setProducts);
  }, [activeSlug]);

  useEffect(() => {
    if (view === "catalog") return;
    const slugs = view === "favorites" ? favoriteSlugs : compareSlugs;
    if (slugs.length === 0) {
      setListedProducts([]);
      return;
    }
    Promise.all(slugs.map((slug) => kamsnab.getProductBySlug(slug))).then((items) =>
      setListedProducts(items.filter((item): item is Product => item != null))
    );
  }, [view, favoriteSlugs, compareSlugs]);

  async function submitLead(values: LeadFormValues) {
    await kamsnab.createLead({
      ...values,
      product: selected?.id ?? null,
      source: "telegram"
    });
    WebApp.HapticFeedback.notificationOccurred("success");
  }

  if (selected) {
    const imageUrl = assetUrl(directusUrl, selected.image);
    const isFavorite = favoriteSlugs.includes(selected.slug);
    const isCompared = compareSlugs.includes(selected.slug);
    return (
      <div className="flex flex-col gap-4 p-4">
        <button onClick={() => setSelected(null)} className="text-sm text-brand-600">
          ← Назад к каталогу
        </button>
        {imageUrl && (
          <div className="aspect-[4/3] w-full rounded-card bg-ink-50 p-4">
            <img src={imageUrl} alt={selected.title} className="h-full w-full object-contain" />
          </div>
        )}
        <h1 className="text-xl font-bold text-ink-800">{selected.title}</h1>
        {selected.short_description && <p className="text-ink-500">{selected.short_description}</p>}
        <p className="text-2xl font-bold text-ink-900">
          {selected.price != null
            ? `${new Intl.NumberFormat("ru-RU").format(selected.price)} ₽`
            : selected.price_note ?? "Цена по запросу"}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            aria-pressed={isFavorite}
            onClick={() => toggleFavoriteSlug(selected.slug)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-card border px-4 py-3 text-sm font-medium transition-colors ${
              isFavorite
                ? "border-accent-500 bg-accent-50 text-accent-600"
                : "border-ink-200 text-ink-600 hover:border-accent-400 hover:text-accent-600"
            }`}
          >
            <HeartIcon filled={isFavorite} />
            {isFavorite ? "В избранном" : "В избранное"}
          </button>
          <button
            type="button"
            aria-pressed={isCompared}
            onClick={() => toggleCompareSlug(selected.slug)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-card border px-4 py-3 text-sm font-medium transition-colors ${
              isCompared
                ? "border-brand-600 bg-brand-50 text-brand-600"
                : "border-ink-200 text-ink-600 hover:border-brand-400 hover:text-brand-600"
            }`}
          >
            <CompareIcon />
            {isCompared ? "В сравнении" : "Сравнить"}
          </button>
        </div>
        <Button variant="outline" onClick={openManagerChat}>
          Написать менеджеру
        </Button>
        <LeadForm productTitle={selected.title} submitLabel="Оставить заявку" onSubmit={submitLead} />
      </div>
    );
  }

  if (view !== "catalog") {
    const title = view === "favorites" ? "Избранное" : "Сравнение";
    return (
      <div className="flex flex-col gap-4 p-4">
        <button onClick={() => setView("catalog")} className="text-sm text-brand-600">
          ← Назад к каталогу
        </button>
        <h1 className="text-xl font-bold text-ink-800">{title}</h1>
        {listedProducts.length === 0 ? (
          <p className="text-ink-500">Пока пусто.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {listedProducts.map((product) => (
              <ProductCard
                key={product.slug}
                href="#"
                showCompare
                showFavorite
                onSelect={() => setSelected(product)}
                product={{
                  slug: product.slug,
                  title: product.title,
                  price: product.price,
                  priceNote: product.price_note ?? undefined,
                  imageUrl: assetUrl(directusUrl, product.image),
                  badge: getProductBadge(product)
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink-800">Каталог КАМСНАБ</h1>
        <div className="flex gap-2">
          <button
            type="button"
            title="Избранное"
            onClick={() => setView("favorites")}
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 text-ink-500 hover:border-accent-400 hover:text-accent-600"
          >
            <HeartIcon filled={false} />
            {favoriteSlugs.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-semibold text-white">
                {favoriteSlugs.length}
              </span>
            )}
          </button>
          <button
            type="button"
            title="Сравнение"
            onClick={() => setView("compare")}
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 text-ink-500 hover:border-brand-400 hover:text-brand-600"
          >
            <CompareIcon />
            {compareSlugs.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white">
                {compareSlugs.length}
              </span>
            )}
          </button>
        </div>
      </div>
      <CategoryFilters categories={categories} activeSlug={activeSlug} onSelect={setActiveSlug} />
      <div className="grid grid-cols-2 gap-3">
        {products.map((product) => (
          <ProductCard
            key={product.slug}
            href="#"
            showCompare
            showFavorite
            onSelect={() => setSelected(product)}
            product={{
              slug: product.slug,
              title: product.title,
              price: product.price,
              priceNote: product.price_note ?? undefined,
              imageUrl: assetUrl(directusUrl, product.image),
              badge: getProductBadge(product)
            }}
          />
        ))}
      </div>
      <Button variant="outline" onClick={openManagerChat}>
        Написать менеджеру
      </Button>
    </div>
  );
}
