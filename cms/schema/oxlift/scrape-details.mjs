// Дозаполнение карточек товара данными со страниц отдельных товаров на
// oxlift.ru (наш поставщик техники) — в отличие от scrape.mjs, который брал
// только листинги категорий, здесь заходим на карточку каждого товара и
// берём:
//   - таблицу характеристик целиком (факты: модель, размеры, вес и т.п.,
//     не подлежат авторскому праву). На странице их может быть две: короткий
//     список (product__specifications) и более полная "Таблица
//     характеристик:" (specifications-table, 3 колонки с ед. измерения) —
//     берём вторую, если она есть, иначе первую;
//   - НЕ берём тексты "О товаре"/"Описание" с их сайта — вместо этого
//     генерируем свой текст на основе вытащенных характеристик.
//
// Идемпотентно в части "не найдено"/"нет таблицы" (эти товары не трогает),
// но КАЖДЫЙ раз при успешном парсинге переписывает характеристики товара
// набором, полученным на этот запуск — так повторный прогон подхватывает
// более полную таблицу, если в прошлый раз досталась только короткая.
//
// Запуск: node schema/oxlift/scrape-details.mjs
import { load } from "cheerio";
import {
  createDirectus,
  rest,
  staticToken,
  readItems,
  createItem,
  updateItem,
  deleteItems
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

// Полная таблица "Таблица характеристик:" — 3 колонки (Наименование / Ед.
// измерения / Значение).
function parseDetailedSpecs($) {
  const specs = [];
  $("table.specifications-table tbody tr").each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length < 3) return;
    const label = $(cells[0]).text().trim();
    const unit = $(cells[1]).text().trim();
    const rawValue = $(cells[2]).text().trim();
    if (!label || !rawValue) return;
    specs.push({ label, value: unit ? `${rawValue} ${unit}` : rawValue });
  });
  return specs;
}

// Короткий список "Характеристики" — 2 колонки, встречается в двух вариантах
// вёрстки (specifications_title/val ИЛИ strong/val) — берём просто первые
// два <td> в строке, без привязки к конкретному классу.
function parseShortSpecs($) {
  const specs = [];
  $("table.product__specifications tr").each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length < 2) return;
    const label = $(cells[0]).text().trim().replace(/:\s*$/, "");
    const value = $(cells[1]).text().trim();
    if (label && value) specs.push({ label, value });
  });
  return specs;
}

function parseSpecs(html) {
  const $ = load(html);
  const detailed = parseDetailedSpecs($);
  if (detailed.length > 0) return detailed;
  return parseShortSpecs($);
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

  let processed = 0;
  let upgraded = 0;
  let skippedNoCategory = 0;
  let notFound = 0;
  let noSpecsOnPage = 0;
  let failed = 0;

  for (const product of products) {
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

    const existing = await client.request(
      readItems("product_attributes", {
        filter: { product: { _eq: product.id } },
        fields: ["id"],
        limit: -1
      })
    );
    if (existing.length > 0) {
      await client.request(
        deleteItems(
          "product_attributes",
          existing.map((a) => a.id)
        )
      );
      if (existing.length !== specs.length) upgraded += 1;
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
      console.log(
        `  ... обработано ${processed} (обновлено с более полной таблицей: ${upgraded}, без категории ${skippedNoCategory}, не найдено на oxlift ${notFound}, без таблицы ${noSpecsOnPage}, ошибок ${failed})`
      );
    }

    await sleep(350);
  }

  console.log("\nГотово.");
  console.log(`Обработано: ${processed}`);
  console.log(`Из них дозаполнено более полной таблицей: ${upgraded}`);
  console.log(`Пропущено (без категории): ${skippedNoCategory}`);
  console.log(`Не найдено на oxlift.ru: ${notFound}`);
  console.log(`Найдено, но без таблицы характеристик: ${noSpecsOnPage}`);
  console.log(`Ошибок запроса: ${failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
