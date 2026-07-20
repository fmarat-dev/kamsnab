// Наполнение Directus РЕАЛЬНЫМ контентом, перенесённым с текущего
// MODX-сайта (xn--80aad7alg1a.xn--p1ai) по состоянию на дату аудита.
// Каталог на живом сайте пока фактически содержит только 3 электропогрузчика
// с ценами — дизельные/бензиновые/штабелеры представлены как категории без
// наполнения (на сайте их карточки без цен, в HTML закомментированы).
// Telegram/Max контакты менеджера пока не заведены — оставлены пустыми,
// заполнить после регистрации ботов.
//
// Запуск: pnpm --filter @kamsnab/cms content:seed
import { createDirectus, rest, staticToken, createItem, readItems, updateSingleton, uploadFiles } from "@directus/sdk";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.join(__dirname, "source-images");

const url = process.env.PUBLIC_URL ?? "http://localhost:8055";
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

const client = createDirectus(url).with(rest());

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
  const authed = client.with(staticToken(token));

  const fileCache = new Map();
  async function uploadImage(filename, title) {
    if (fileCache.has(filename)) return fileCache.get(filename);
    const buffer = await readFile(path.join(imagesDir, filename));
    const form = new FormData();
    form.append("title", title);
    form.append("file", new Blob([buffer]), filename);
    const file = await authed.request(uploadFiles(form));
    fileCache.set(filename, file.id);
    console.log(`+ file "${filename}" -> ${file.id}`);
    return file.id;
  }

  await authed.request(
    updateSingleton("settings", {
      company_name: "ООО «КАМСНАБ»",
      // На сайте также указан городской номер +7 (8352) 283-285 —
      // схема settings хранит один номер, второй пока некуда деть без
      // расширения схемы, уточнить у заказчика приоритетный контакт.
      phone: "+7 (927) 448-27-58",
      whatsapp: "+79534482758",
      email: "kam-snab@mail.ru",
      address: "г. Чебоксары, ул. Вурнарское шоссе, д.11, офис 2",
      work_hours: "Пн-Пт: 09:00–18:00, Сб-Вс: выходной",
      telegram_manager_username: "",
      max_manager_link: ""
    })
  );
  console.log("+ settings обновлены реальными контактами");

  const existingCategories = await authed.request(readItems("categories", { limit: -1 }));
  const categoryDefs = [
    { name: "Электрические погрузчики", slug: "electric", image: "RX.jpg" },
    { name: "Дизельные погрузчики", slug: "diesel", image: "CPCD.jpg" },
    { name: "Бензиновые погрузчики", slug: "gasoline", image: "K2-_.jpg" },
    { name: "Штабелеры", slug: "stackers", image: "Samokhodnyy-shtabeler-s-platformoy-operatora-OXLIFT-Premium.jpg" },
    { name: "Навесное оборудование", slug: "attachments", image: "multi-pallet-forks.jpg" }
  ];

  const categoryIds = {};
  for (const def of categoryDefs) {
    const found = existingCategories.find((c) => c.slug === def.slug);
    if (found) {
      categoryIds[def.slug] = found.id;
      continue;
    }
    const imageId = await uploadImage(def.image, def.name);
    const created = await authed.request(createItem("categories", { name: def.name, slug: def.slug, image: imageId }));
    categoryIds[def.slug] = created.id;
    console.log(`+ category "${def.name}"`);
  }

  const existingProducts = await authed.request(readItems("products", { limit: -1 }));

  const forklifts = [
    {
      title: "Мини электропогрузчик OXLIFT MPX 1545",
      slug: "oxlift-mpx-1545",
      category: categoryIds.electric,
      price: 1431175,
      price_note: null,
      short_description: "Стоимость доставки уточняйте по телефону.",
      image: "mini_elektropogruzchik_oxlift_mpx1545-1200.jpg",
      attributes: [
        { label: "Грузоподъёмность", value: "1500 кг" },
        { label: "Высота подъёма", value: "4500 мм" }
      ]
    },
    {
      title: "Электрический погрузчик OXLIFT RX 2045",
      slug: "oxlift-rx-2045",
      category: categoryIds.electric,
      price: 1981286,
      price_note: null,
      short_description: "Стоимость доставки уточняйте по телефону.",
      image: "RX.jpg",
      attributes: [
        { label: "Грузоподъёмность", value: "2000 кг" },
        { label: "Высота подъёма", value: "4500 мм" }
      ]
    },
    {
      title: "Электропогрузчик вилочный OXLIFT RX 3045L Li-Ion",
      slug: "oxlift-rx-3045l",
      category: categoryIds.electric,
      price: 2942351,
      price_note: null,
      short_description: "Li-Ion аккумулятор. Стоимость доставки уточняйте по телефону.",
      image: "RX-3045L_1.jpg",
      attributes: [
        { label: "Грузоподъёмность", value: "3000 кг" },
        { label: "Высота подъёма", value: "4500 мм" }
      ]
    }
  ];

  const attachments = [
    { title: "Захват для рулонов", slug: "zahvat-dlya-rulonov", image: "roll-grab.jpg" },
    { title: "Захват для бумажных рулонов", slug: "zahvat-dlya-bumazhnyh-rulonov", image: "paper-roll-gripper.jpg" },
    { title: "Захват для бочек", slug: "zahvat-dlya-bochek", image: "barrel-grab.jpg" },
    { title: "Захват для тюков", slug: "zahvat-dlya-tyukov", image: "bale-grab.jpg" },
    { title: "Захват для картона и коробок", slug: "zahvat-dlya-kartona-i-korobok", image: "cardboard-box-gripper.jpg" },
    { title: "Мультипалетные вилы", slug: "multipaletnye-vily", image: "multi-pallet-forks.jpg" },
    { title: "Ротатор", slug: "rotator", image: "rotator.jpg" },
    { title: "Кран-балка", slug: "kran-balka", image: "overhead-crane.jpg" },
    { title: "Ковши", slug: "kovshi", image: "buckets.jpg" },
    { title: "Отвалы", slug: "otvaly", image: "dumps.jpg" },
    { title: "Удлинитель вил", slug: "udlinitel-vil", image: "fork-extension.jpg" },
    { title: "Монтажная платформа", slug: "montazhnaya-platforma", image: "mounting-platform.jpg" }
  ].map((a) => ({
    ...a,
    category: categoryIds.attachments,
    price: null,
    price_note: "По запросу",
    short_description: null
  }));

  for (const def of [...forklifts, ...attachments]) {
    const found = existingProducts.find((p) => p.slug === def.slug);
    if (found) continue;
    const imageId = await uploadImage(def.image, def.title);
    const { attributes, image, ...productFields } = def;
    const created = await authed.request(
      createItem("products", { ...productFields, image: imageId, status: "published" })
    );
    if (attributes) {
      for (const attr of attributes) {
        await authed.request(createItem("product_attributes", { ...attr, product: created.id }));
      }
    }
    console.log(`+ product "${def.title}"`);
  }

  const existingPages = await authed.request(readItems("pages", { limit: -1 }));
  const pageDefs = [
    {
      slug: "delivery",
      title: "Доставка",
      content:
        "<h2>Доставим технику с ближайшего к вам склада в течение 7 дней</h2>" +
        "<p>Собственная логистическая служба оптимизирует расходы и сроки доставки спецтехники за счёт:</p>" +
        "<ul><li>Профессионального подбора транспорта</li><li>Многолетнего опыта логистов</li>" +
        "<li>Собственного автопарка</li><li>Автоматизированного трекинга</li></ul>" +
        "<p>Оптимизированные маршруты, экономия до 50% на логистике, отправки по всей России ежедневно.</p>"
    },
    {
      slug: "payment",
      title: "Оплата",
      content:
        "<h2>Оплата техники</h2>" +
        "<p>Компания является аккредитованным поставщиком большинства лизинговых компаний России. " +
        "Покупка техники в лизинг доступна для юридических лиц (ИП и ООО) и некоммерческих организаций " +
        "с положительной кредитной историей.</p>" +
        "<ul><li>Приобретение техники в лизинг через официальных партнёров</li>" +
        "<li>Оплата банковским переводом для юридических лиц или НКО</li>" +
        "<li>Оплата наличными или картой в офисе или на складе компании</li></ul>" +
        "<h3>Как проходит лизинговая сделка</h3>" +
        "<ol><li>Выявляем потребность и делаем ценовое предложение</li>" +
        "<li>Передаём заявку в лизинговые компании для нескольких графиков платежей</li>" +
        "<li>После оформления сделки и оплаты отправляем технику на предпродажную подготовку</li>" +
        "<li>Отгружаем выбранным способом — доставка или самовывоз</li></ol>"
    },
    {
      slug: "service",
      title: "Сервис и гарантия",
      content:
        "<h2>Гарантия 12 месяцев или 2000 моточасов</h2>" +
        "<p>На всю технику действует гарантия 12 месяцев или 2000 моточасов — распространяется только на технику, " +
        "продаваемую официальным дистрибьютором или дилером.</p>" +
        "<ul>" +
        "<li><strong>Обращение в сервисный центр</strong> — бесплатное гарантийное обслуживание или ремонт техники</li>" +
        "<li><strong>Выезд сервисной бригады</strong> — плановое ТО или ремонт на месте в течение 5 дней</li>" +
        "<li><strong>Самостоятельное обслуживание</strong> — без потери гарантии, с консультацией сервисных инженеров</li>" +
        "</ul>"
    }
  ];

  for (const def of pageDefs) {
    const found = existingPages.find((p) => p.slug === def.slug);
    if (found) continue;
    await authed.request(createItem("pages", def));
    console.log(`+ page "${def.title}"`);
  }

  console.log("Готово.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
