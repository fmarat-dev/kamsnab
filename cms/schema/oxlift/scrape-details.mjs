// Дозаполнение карточек товара данными со страниц отдельных товаров на
// oxlift.ru (наш поставщик техники) — в отличие от scrape.mjs, который брал
// только листинги категорий, здесь заходим на карточку каждого товара и
// берём:
//   - таблицу "Характеристики" (product__specifications) целиком — это
//     факты (модель, размеры, вес и т.п.), не подлежат авторскому праву;
//   - НЕ берём тексты "О товаре"/"Описание" с их сайта — вместо этого
//     генерируем свой текст на основе вытащенных характеристик.
//
// Запуск: node schema/oxlift/scrape-details.mjs
import { load } from "cheerio";
import {
  createDirectus,
  rest,
  staticToken,
  readItems,
  createItem,
  updateItem
} from "@directus/sdk";

const SITE = "https://oxlift.ru";
const url = process.env.PUBLIC_URL ?? "http://localhost:8055";
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error("ADMIN_EMAIL / ADMIN_PASSWORD не заданы (см. cms/.env)");
  process.exit(1);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function login() {
  const res = await fetch(`${url}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  const { data } = await res.json();
  return data.access_token;
}

async function fetchProductPage(categorySlug, productSlug) {
  const path = `/catalog/${categorySlug}/${productSlug}/`;
  const res = await fetch(`${SITE}${path}`, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; KamsnabMigration/1.0)" }
  });
  if (!res.ok) return null;
  return res.text();
}

// Таблица "Характеристики" — только факты (label/value), copyright их не
// касается.
function parseSpecs(html) {
  const $ = load(html);
  const specs = [];
  // Разметка таблицы на сайте бывает двух видов (td.specifications_title/
  // specifications_val ИЛИ td.strong/val) — берём просто первые два <td> в
  // строке, без привязки к конкретному классу.
  $("table.product__specifications tr").each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length < 2) return;
    const label = $(cells[0]).text().trim().replace(/:\s*$/, "");
    const value = $(cells[1]).text().trim();
    if (label && value) specs.push({ label, value });
  });
  return specs;
}

const HEADLINE_KEYWORDS = [
  "грузоподъ",
  "высота подъ",
  "мощност",
  "объём ковша",
  "объем ковша",
  "скорост",
  "вес",
  "масса"
];

function pickHeadlineSpecs(specs, count = 3) {
  const byKeyword = specs.filter((s) => HEADLINE_KEYWORDS.some((k) => s.label.toLowerCase().includes(k)));
  const chosen = byKeyword.length > 0 ? byKeyword : specs;
  return chosen.slice(0, count);
}

// Собственный текст на основе фактов из таблицы характеристик — не
// пересказ и не перевод их описания, просто другая подача тех же цифр.
function composeDescription(title, categoryName, specs) {
  const headline = pickHeadlineSpecs(specs);
  const parts = [];
  parts.push(`<p>${title}${categoryName ? ` — ${categoryName.toLowerCase()}` : ""} от КАМСНАБ.</p>`);
  if (headline.length > 0) {
    const items = headline.map((s) => `${s.label.toLowerCase()} — ${s.value}`).join(", ");
    parts.push(`<p>Ключевые параметры: ${items}.</p>`);
  }
  parts.push(
    "<p>Доставляем по всей России, помогаем подобрать комплектацию под задачу и даём гарантию на технику.</p>"
  );
  return parts.join("");
}

async function main() {
  const token = await login();
  const client = createDirectus(url).with(rest()).with(staticToken(token));

  const products = await client.request(
    readItems("products", {
      fields: ["id", "title", "slug", "description", "category.slug", "category.name"],
      limit: -1
    })
  );

  const existingAttrs = await client.request(
    readItems("product_attributes", { fields: ["product"], limit: -1 })
  );
  const attrCountByProduct = new Map();
  for (const a of existingAttrs) {
    attrCountByProduct.set(a.product, (attrCountByProduct.get(a.product) ?? 0) + 1);
  }
  // >=4: у части товаров уже есть 1-2 характеристики от старого regex-
  // разбора short_description — этого мало, дозаполняем. От 4 и выше
  // считаем, что таблица уже полная, пропускаем.
  const productsWithAttrs = new Set(
    [...attrCountByProduct.entries()].filter(([, count]) => count >= 4).map(([id]) => id)
  );

  let processed = 0;
  let skippedHasAttrs = 0;
  let skippedNoCategory = 0;
  let notFound = 0;
  let noSpecsOnPage = 0;
  let failed = 0;

  for (const product of products) {
    if (productsWithAttrs.has(product.id)) {
      skippedHasAttrs += 1;
      continue;
    }
    const category = product.category;
    if (!category?.slug) {
      skippedNoCategory += 1;
      continue;
    }

    let html;
    try {
      html = await fetchProductPage(category.slug, product.slug);
    } catch (err) {
      console.error(`  ! ошибка запроса ${product.slug}:`, err.message);
      failed += 1;
      continue;
    }
    if (!html) {
      notFound += 1;
      await sleep(250);
      continue;
    }

    const specs = parseSpecs(html);
    if (specs.length === 0) {
      noSpecsOnPage += 1;
      await sleep(250);
      continue;
    }

    for (const [index, spec] of specs.entries()) {
      await client.request(
        createItem("product_attributes", {
          product: product.id,
          label: spec.label,
          value: spec.value,
          sort: index
        })
      );
    }

    if (!product.description) {
      await client.request(
        updateItem("products", product.id, {
          description: composeDescription(product.title, category.name, specs)
        })
      );
    }

    processed += 1;
    if (processed % 10 === 0) {
      console.log(`  ... обработано ${processed} (пропущено: уже есть характеристики ${skippedHasAttrs}, без категории ${skippedNoCategory}, не найдено на oxlift ${notFound}, без таблицы ${noSpecsOnPage}, ошибок ${failed})`);
    }

    await sleep(350);
  }

  console.log("\nГотово.");
  console.log(`Обработано: ${processed}`);
  console.log(`Пропущено (уже есть характеристики): ${skippedHasAttrs}`);
  console.log(`Пропущено (без категории): ${skippedNoCategory}`);
  console.log(`Не найдено на oxlift.ru: ${notFound}`);
  console.log(`Найдено, но без таблицы характеристик: ${noSpecsOnPage}`);
  console.log(`Ошибок запроса: ${failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
