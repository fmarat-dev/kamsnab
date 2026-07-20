import { notFound } from "next/navigation";
import Link from "next/link";
import { assetUrl, getProductBadge, type ProductAttribute } from "@kamsnab/api-client";
import { Container, Breadcrumbs, ProductCard } from "@kamsnab/ui";
import { kamsnab, directusUrl } from "@/lib/directus";
import { ProductLeadForm } from "./ProductLeadForm";
import { ProductGallery } from "./ProductGallery";
import { ProductActions } from "./ProductActions";

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

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await kamsnab.getProductBySlug(slug);

  if (!product) notFound();

  const category = typeof product.category === "object" ? product.category : undefined;

  const galleryFileIds = product.gallery && product.gallery.length > 0 ? product.gallery : [product.image];
  const galleryImages = galleryFileIds
    .map((fileId) => assetUrl(directusUrl, fileId))
    .filter((url): url is string => Boolean(url));

  const attributeGroups = product.attributes && product.attributes.length > 0 ? groupAttributes(product.attributes) : [];

  const relatedProducts = category
    ? (await kamsnab.getProducts({ categorySlug: category.slug, limit: 9 }))
        .filter((item) => item.slug !== product.slug)
        .slice(0, 8)
    : [];

  return (
    <Container className="py-10">
      <Breadcrumbs
        items={[
          { label: "Каталог", href: "/catalog" },
          ...(category ? [{ label: category.name, href: `/catalog?category=${category.slug}` }] : []),
          { label: product.title }
        ]}
      />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-4">
          <ProductGallery images={galleryImages} title={product.title} />
          <h1 className="text-3xl font-bold text-ink-800">{product.title}</h1>
          {product.short_description && <p className="text-ink-500">{product.short_description}</p>}
          {product.description && (
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: product.description }} />
          )}

          {attributeGroups.length > 0 && (
            <div className="flex flex-col gap-6">
              <h2 className="text-xl font-bold text-ink-800">Характеристики</h2>
              {attributeGroups.map(([group, attrs]) => (
                <div key={group}>
                  <h3 className="mb-2 font-semibold text-ink-700">{group}</h3>
                  <table className="w-full text-sm">
                    <tbody>
                      {attrs.map((attr) => (
                        <tr key={attr.id} className="border-b border-ink-100">
                          <td className="py-2 pr-4 font-medium text-ink-600">{attr.label}</td>
                          <td className="py-2 text-ink-800">{attr.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-card border border-ink-100 p-5">
              <h3 className="mb-1 font-semibold text-ink-800">Доставка</h3>
              <p className="mb-2 text-sm text-ink-500">
                Доставляем во все регионы РФ либо предоставляем самовывоз со склада в Чебоксарах.
              </p>
              <Link href="/pages/delivery" className="text-sm font-medium text-brand-600 hover:underline">
                Подробнее об условиях доставки →
              </Link>
            </div>
            <div className="rounded-card border border-ink-100 p-5">
              <h3 className="mb-1 font-semibold text-ink-800">Оплата</h3>
              <p className="mb-2 text-sm text-ink-500">
                Лизинг через партнёров, безналичный расчёт для юрлиц, наличные и карта в офисе.
              </p>
              <Link href="/pages/payment" className="text-sm font-medium text-brand-600 hover:underline">
                Подробнее об оплате →
              </Link>
            </div>
          </div>
        </div>

        <aside className="h-fit flex flex-col gap-4 rounded-card border border-ink-100 p-6">
          {product.sku && <p className="text-sm text-ink-400">Артикул: {product.sku}</p>}
          <p className="text-2xl font-bold text-ink-900">
            {product.price != null
              ? `${new Intl.NumberFormat("ru-RU").format(product.price)} ₽`
              : product.price_note ?? "Цена по запросу"}
          </p>
          <ProductActions slug={product.slug} />
          <ProductLeadForm productId={product.id} productTitle={product.title} />
        </aside>
      </div>

      {relatedProducts.length > 0 && (
        <div className="mt-16 flex flex-col gap-6">
          <h2 className="text-2xl font-bold text-ink-800">С этим товаром покупают</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((item) => (
              <ProductCard
                key={item.slug}
                href={`/catalog/${item.slug}`}
                showCompare
                product={{
                  slug: item.slug,
                  title: item.title,
                  sku: item.sku,
                  price: item.price,
                  priceNote: item.price_note ?? undefined,
                  imageUrl: assetUrl(directusUrl, item.image),
                  categoryName: category?.name,
                  badge: getProductBadge(item)
                }}
              />
            ))}
          </div>
        </div>
      )}
    </Container>
  );
}
