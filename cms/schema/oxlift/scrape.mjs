// Перенос каталога с oxlift.ru (производитель/поставщик техники, которую
// продаёт КАМСНАБ) в Directus: категории верхнего уровня + все товары с
// ценой, фото, артикулом и (где удаётся распарсить) грузоподъёмностью и
// высотой подъёма. Источник — реальный сайт, HTML снят напрямую (не через
// JS-рендер), поэтому данные только со страниц-листингов (без захода на
// каждую карточку товара).
//
// Запуск: node schema/oxlift/scrape.mjs
import { load } from "cheerio";
import { createDirectus, rest, staticToken, createItem, readItems, updateItem, uploadFiles } from "@directus/sdk";

const SITE = "https://oxlift.ru";
const url = process.env.PUBLIC_URL ?? "http://localhost:8055";
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

const CATEGORIES = [
  { slug: "ruchnye-gidravlicheskie-telezhki", name: "Ручные гидравлические тележки" },
  { slug: "shtabelery", name: "Штабелеры" },
  { slug: "samokhodnye-elektricheskie-telezhki", name: "Самоходные электрические тележки" },
  { slug: "vilochnye-pogruzchiki", name: "Вилочные погрузчики" },
  { slug: "richtraki", name: "Ричтраки" },
  { slug: "vyshki-i-podemniki", name: "Вышки и подъёмники" },
  { slug: "podemnye-stoly", name: "Подъёмные столы" },
  { slug: "tyagachi-i-elektrokary", name: "Тягачи и электрокары" },
  { slug: "kliningovoe-oborudovanie", name: "Клининговое оборудование" },
  { slug: "gruzopodemnoe-oborudovanie", name: "Грузоподъёмное оборудование" },
  { slug: "komplektovshchiki-zakazov-", name: "Комплектовщики заказов" }
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchHtml(path) {
  const res = await fetch(`${SITE}${path}`, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; KamsnabMigration/1.0)" }
  });
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return res.text();
}

function parseCards(html) {
  const $ = load(html);
  const cards = [];
  $(".product-card-new").each((_, el) => {
    const card = $(el);
    const titleLink = card.find("a.product-card-new__title").first();
    const href = titleLink.attr("href");
    const title = (card.find('meta[itemprop="name"]').attr("content") || titleLink.text()).trim();
    const description = (card.find('meta[itemprop="description"]').attr("content") || "").trim();
    const priceText = card.find(".product-card-new__price-value").first().text().trim();
    const price = priceText ? Number(priceText.replace(/[^\d]/g, "")) : null;
    const imgSrc = card.find("img").first().attr("src");
    const sku = (card.find(".product-card-new__code").first().text().match(/\d+/) || [])[0];
    if (!href || !title) return;
    cards.push({ href, title, description, price, imgSrc, sku });
  });
  return cards;
}

function hasNextPage(html, nextPageNum) {
  return html.includes(`PAGEN_1=${nextPageNum}`);
}

async function scrapeCategory(categoryPath) {
  const all = [];
  let page = 1;
  while (true) {
    const path = page === 1 ? `/catalog/${categoryPath}/` : `/catalog/${categoryPath}/?PAGEN_1=${page}`;
    const html = await fetchHtml(path);
    const cards = parseCards(html);
    if (cards.length === 0) break;
    all.push(...cards);
    const goOn = hasNextPage(html, page + 1);
    console.log(`    стр. ${page}: +${cards.length} (всего ${all.length})`);
    if (!goOn) break;
    page += 1;
    await sleep(300);
  }
  // Дедуп по href — категории могут пересекаться при фильтрах.
  const seen = new Set();
  return all.filter((c) => (seen.has(c.href) ? false : (seen.add(c.href), true)));
}

function extractAttributes(description) {
  const attrs = [];
  const capacity = description.match(/грузоподъ[её]мность\s*([\d\s]+)\s*кг/i);
  const height = description.match(/высота подъ[её]ма\s*([\d\s]+)\s*мм/i);
  if (capacity) attrs.push({ label: "Грузоподъёмность", value: `${capacity[1].replace(/\s+/g, "")} кг` });
  if (height) attrs.push({ label: "Высота подъёма", value: `${height[1].replace(/\s+/g, "")} мм` });
  return attrs;
}

function slugify(href) {
  const parts = href.split("/").filter(Boolean);
  return parts[parts.length - 1];
}

async function login() {
  const res = await fetch(`${url}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const { data } = await res.json();
  return data.access_token;
}

async function main() {
  const token = await login();
  const client = createDirectus(url).with(rest()).with(staticToken(token));

  const existingCategories = await client.request(readItems("categories", { limit: -1 }));
  const existingProducts = await client.request(readItems("products", { limit: -1 }));
  const existingSlugs = new Set(existingProducts.map((p) => p.slug));

  let totalNew = 0;

  for (const cat of CATEGORIES) {
    console.log(`\n== ${cat.name} (${cat.slug}) ==`);

    let category = existingCategories.find((c) => c.slug === cat.slug);
    if (!category) {
      category = await client.request(createItem("categories", { name: cat.name, slug: cat.slug }));
      existingCategories.push(category);
      console.log(`  + категория создана`);
    }

    let cards;
    try {
      cards = await scrapeCategory(cat.slug);
    } catch (err) {
      console.error(`  ! ошибка скрапинга ${cat.slug}:`, err.message);
      continue;
    }
    console.log(`  найдено уникальных товаров: ${cards.length}`);

    for (const card of cards) {
      const slug = slugify(card.href);
      if (existingSlugs.has(slug)) continue;

      let imageId = null;
      if (card.imgSrc) {
        try {
          const imgUrl = card.imgSrc.startsWith("http") ? card.imgSrc : `${SITE}${card.imgSrc}`;
          const imgRes = await fetch(imgUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
          if (imgRes.ok) {
            const buffer = Buffer.from(await imgRes.arrayBuffer());
            const filename = imgUrl.split("/").pop().split("?")[0] || `${slug}.jpg`;
            const form = new FormData();
            form.append("title", card.title);
            form.append("file", new Blob([buffer]), filename);
            const file = await client.request(uploadFiles(form));
            imageId = file.id;
          }
        } catch (err) {
          console.error(`    ! фото не загружено (${slug}):`, err.message);
        }
      }

      const created = await client.request(
        createItem("products", {
          title: card.title,
          slug,
          category: category.id,
          price: card.price,
          price_note: card.price ? null : "По запросу",
          short_description: card.description || null,
          image: imageId,
          status: "published"
        })
      );
      existingSlugs.add(slug);
      totalNew += 1;

      // Обложка категории — фото первого товара, если она ещё не задана.
      if (!category.image && imageId) {
        await client.request(updateItem("categories", category.id, { image: imageId }));
        category.image = imageId;
      }

      for (const attr of extractAttributes(card.description)) {
        await client.request(createItem("product_attributes", { ...attr, product: created.id }));
      }

      if (totalNew % 20 === 0) console.log(`  ... импортировано ${totalNew}`);
    }
  }

  console.log(`\nГотово. Новых товаров: ${totalNew}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
