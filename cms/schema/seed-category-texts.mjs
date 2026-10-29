// SEO-тексты категорий: создаёт поле categories.seo_text (если его нет) и
// заполняет его из content/category-seo-texts.json — только у категорий,
// где текст пустой, чтобы не затереть правки, сделанные в админке.
// Запуск: PUBLIC_URL=https://cms.kam-snab.ru ADMIN_EMAIL=… ADMIN_PASSWORD=… node schema/seed-category-texts.mjs
import { readFile } from "node:fs/promises";
import {
  createDirectus,
  rest,
  staticToken,
  readFields,
  createField,
  readItems,
  updateItem
} from "@directus/sdk";

const url = process.env.PUBLIC_URL ?? "http://localhost:8055";
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error("ADMIN_EMAIL / ADMIN_PASSWORD не заданы (см. cms/.env)");
  process.exit(1);
}

async function login() {
  const res = await fetch(`${url}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status} ${await res.text()}`);
  const { data } = await res.json();
  return data.access_token;
}

async function main() {
  const authed = createDirectus(url).with(rest()).with(staticToken(await login()));

  // Тот же фильтр по collection, что в seed.mjs: readFields иногда отдаёт поля всех коллекций.
  const fields = await authed.request(readFields("categories"));
  if (!fields.some((f) => f.collection === "categories" && f.field === "seo_text")) {
    await authed.request(
      createField("categories", {
        field: "seo_text",
        type: "text",
        meta: { interface: "input-rich-text-html", note: "SEO-текст под списком товаров" }
      })
    );
    console.log('+ field "categories.seo_text" создано');
  }

  const texts = JSON.parse(await readFile(new URL("../content/category-seo-texts.json", import.meta.url), "utf8"));
  const categories = await authed.request(readItems("categories", { fields: ["id", "slug", "seo_text"], limit: -1 }));

  for (const category of categories) {
    const text = texts[category.slug];
    if (!text) {
      console.log(`- ${category.slug}: текста в JSON нет`);
    } else if (category.seo_text?.trim()) {
      console.log(`- ${category.slug}: текст уже есть, пропускаю`);
    } else {
      await authed.request(updateItem("categories", category.id, { seo_text: text }));
      console.log(`+ ${category.slug}: текст записан`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
