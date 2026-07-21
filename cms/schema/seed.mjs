// Идемпотентный сидинг схемы Directus: коллекции, поля, связи, права публичной роли.
// Запуск: pnpm --filter @kamsnab/cms schema:seed  (Directus должен быть поднят и .env заполнен)
import {
  createDirectus,
  rest,
  staticToken,
  readCollections,
  createCollection,
  updateCollection,
  createField,
  readFields,
  createRelation,
  readRelations,
  readPolicies,
  createPolicy,
  createPermission,
  readPermissions,
  readFlows,
  createFlow,
  updateFlow,
  createOperation
} from "@directus/sdk";

const url = process.env.PUBLIC_URL ?? "http://localhost:8055";
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error("ADMIN_EMAIL / ADMIN_PASSWORD не заданы (см. cms/.env)");
  process.exit(1);
}

const client = createDirectus(url).with(rest());

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
  const token = await login();
  const authed = client.with(staticToken(token));

  const existing = await authed.request(readCollections());
  const existingNames = new Set(existing.map((c) => c.collection));

  async function ensureCollection(name, fields, meta = {}) {
    if (existingNames.has(name)) {
      console.log(`- collection "${name}" уже существует, пропускаю`);
      return false;
    }
    await authed.request(
      createCollection({
        collection: name,
        meta: { icon: "box", ...meta },
        schema: {},
        fields
      })
    );
    console.log(`+ collection "${name}" создана`);
    return true;
  }

  async function ensureDisplayTemplate(collection, template) {
    // Отображаемый шаблон для m2o-ссылок и заголовков карточек в админке —
    // чтобы менеджер видел «Название (SKU)» вместо голого UUID, например
    // при просмотре заявки (leads.product).
    await authed.request(updateCollection(collection, { meta: { display_template: template } }));
  }

  async function ensureField(collection, fieldDef) {
    // readFields(collection) наблюдался возвращающим поля ВСЕХ коллекций в
    // этой версии SDK/Directus — поэтому фильтруем ещё и по collection явно.
    const fields = await authed.request(readFields(collection));
    if (fields.some((f) => f.collection === collection && f.field === fieldDef.field)) return false;
    await authed.request(createField(collection, fieldDef));
    console.log(`+ field "${collection}.${fieldDef.field}" создано`);
    return true;
  }

  async function ensureFileRelation(collection, field) {
    const relations = await authed.request(readRelations(collection));
    if (relations.some((r) => r.collection === collection && r.field === field)) return;
    await authed.request(
      createRelation({ collection, field, related_collection: "directus_files" })
    );
  }

  async function ensureImageField(collection, field, meta = {}) {
    const created = await ensureField(collection, {
      field,
      type: "uuid",
      meta: { interface: "file-image", special: ["file"], ...meta }
    });
    if (created) await ensureFileRelation(collection, field);
  }

  const idField = {
    field: "id",
    type: "uuid",
    meta: { hidden: true, readonly: true, interface: "input", special: ["uuid"] },
    schema: { is_primary_key: true, has_auto_increment: false }
  };

  const sortField = {
    field: "sort",
    type: "integer",
    meta: { hidden: true, interface: "input" }
  };

  await ensureCollection("categories", [
    idField,
    { field: "name", type: "string", meta: { interface: "input" }, schema: { is_nullable: false } },
    { field: "slug", type: "string", meta: { interface: "input" }, schema: { is_nullable: false, is_unique: true } },
    sortField
  ]);
  await ensureImageField("categories", "image");

  await ensureCollection("pages", [
    idField,
    { field: "slug", type: "string", meta: { interface: "input" }, schema: { is_nullable: false, is_unique: true } },
    { field: "title", type: "string", meta: { interface: "input" }, schema: { is_nullable: false } },
    { field: "content", type: "text", meta: { interface: "input-rich-text-html" } }
  ]);

  const productsCreated = await ensureCollection("products", [
    idField,
    { field: "title", type: "string", meta: { interface: "input" }, schema: { is_nullable: false } },
    { field: "slug", type: "string", meta: { interface: "input" }, schema: { is_nullable: false, is_unique: true } },
    { field: "category", type: "uuid", meta: { interface: "select-dropdown-m2o", special: ["m2o"] } },
    { field: "price", type: "decimal", meta: { interface: "input" } },
    { field: "price_note", type: "string", meta: { interface: "input" } },
    { field: "short_description", type: "text", meta: { interface: "input-multiline" } },
    { field: "description", type: "text", meta: { interface: "input-rich-text-html" } },
    {
      field: "status",
      type: "string",
      meta: {
        interface: "select-dropdown",
        options: {
          choices: [
            { text: "Опубликован", value: "published" },
            { text: "Черновик", value: "draft" },
            { text: "Архив", value: "archived" }
          ]
        }
      },
      schema: { default_value: "draft" }
    },
    sortField
  ]);

  if (productsCreated) {
    await authed.request(
      createRelation({
        collection: "products",
        field: "category",
        related_collection: "categories"
      })
    );
  }

  await ensureImageField("products", "image");
  await ensureDisplayTemplate("products", "{{title}} ({{sku}})");

  const attributesCreated = await ensureCollection("product_attributes", [
    idField,
    { field: "product", type: "uuid", meta: { interface: "select-dropdown-m2o", special: ["m2o"] } },
    { field: "label", type: "string", meta: { interface: "input" }, schema: { is_nullable: false } },
    { field: "value", type: "string", meta: { interface: "input" }, schema: { is_nullable: false } },
    sortField
  ]);

  if (attributesCreated) {
    // Явно создаём alias-поле o2m на products — createRelation с one_field
    // его не всегда генерирует сама (наблюдалось на Directus 11.17).
    await authed.request(
      createField("products", {
        field: "attributes",
        type: "alias",
        meta: { interface: "list-o2m", special: ["o2m"] }
      })
    );
    await authed.request(
      createRelation({
        collection: "product_attributes",
        field: "product",
        related_collection: "products",
        meta: { one_field: "attributes" }
      })
    );
  }

  const leadsCreated = await ensureCollection("leads", [
    idField,
    { field: "name", type: "string", meta: { interface: "input" }, schema: { is_nullable: false } },
    { field: "phone", type: "string", meta: { interface: "input" }, schema: { is_nullable: false } },
    { field: "message", type: "text", meta: { interface: "input-multiline" } },
    { field: "product", type: "uuid", meta: { interface: "select-dropdown-m2o", special: ["m2o"] } },
    {
      field: "source",
      type: "string",
      meta: {
        interface: "select-dropdown",
        options: {
          choices: [
            { text: "Сайт", value: "site" },
            { text: "Telegram", value: "telegram" },
            { text: "Max", value: "max" }
          ]
        }
      },
      schema: { default_value: "site" }
    },
    {
      field: "status",
      type: "string",
      meta: {
        interface: "select-dropdown",
        options: {
          choices: [
            { text: "Новая", value: "new" },
            { text: "Обработана", value: "processed" }
          ]
        }
      },
      schema: { default_value: "new" }
    },
    { field: "date_created", type: "timestamp", meta: { special: ["date-created"], readonly: true, hidden: true } }
  ]);

  if (leadsCreated) {
    await authed.request(
      createRelation({
        collection: "leads",
        field: "product",
        related_collection: "products"
      })
    );
  }
  await ensureDisplayTemplate("leads", "{{name}} — {{phone}}");

  // --- Уведомление менеджеру на почту при новой заявке ---
  // Само письмо не уйдёт, пока в .env не заполнены EMAIL_TRANSPORT/EMAIL_SMTP_*
  // (см. .env.example) — Directus по умолчанию использует sendmail, которого
  // здесь нет.
  const existingFlows = await authed.request(readFlows());
  let leadEmailFlow = existingFlows.find((f) => f.name === "Заявка создана — письмо менеджеру");

  if (!leadEmailFlow) {
    leadEmailFlow = await authed.request(
      createFlow({
        name: "Заявка создана — письмо менеджеру",
        icon: "mail",
        status: "active",
        trigger: "event",
        accountability: "all",
        options: {
          type: "action",
          scope: ["items.create"],
          collections: ["leads"]
        }
      })
    );

    const operation = await authed.request(
      createOperation({
        name: "Письмо менеджеру",
        key: "send_manager_email",
        type: "mail",
        position_x: 19,
        position_y: 1,
        flow: leadEmailFlow.id,
        options: {
          to: ["kam-snab@mail.ru"],
          subject: "Новая заявка с сайта КАМСНАБ",
          type: "wysiwyg",
          body:
            "<p>Имя: {{$trigger.payload.name}}</p>" +
            "<p>Телефон: {{$trigger.payload.phone}}</p>" +
            "<p>Комментарий: {{$trigger.payload.message}}</p>" +
            "<p>Источник: {{$trigger.payload.source}}</p>" +
            "<p>Товар (ID): {{$trigger.payload.product}}</p>"
        }
      })
    );

    await authed.request(updateFlow(leadEmailFlow.id, { operation: operation.id }));
    console.log('+ flow "Заявка создана — письмо менеджеру" создан');
  } else {
    console.log('- flow "Заявка создана — письмо менеджеру" уже существует, пропускаю');
  }

  await ensureCollection(
    "settings",
    [
      idField,
      { field: "company_name", type: "string", meta: { interface: "input" } },
      { field: "phone", type: "string", meta: { interface: "input" } },
      { field: "whatsapp", type: "string", meta: { interface: "input" } },
      { field: "email", type: "string", meta: { interface: "input" } },
      { field: "address", type: "string", meta: { interface: "input" } },
      { field: "work_hours", type: "string", meta: { interface: "input" } },
      { field: "telegram_manager_username", type: "string", meta: { interface: "input" } },
      { field: "max_manager_link", type: "string", meta: { interface: "input" } }
    ],
    { singleton: true, icon: "settings" }
  );

  // --- Публичный доступ: read-only каталог/страницы/настройки, insert-only заявки ---
  const policies = await authed.request(readPolicies());
  let publicPolicy = policies.find((p) => p.name === "Kamsnab Public Access");

  if (!publicPolicy) {
    publicPolicy = await authed.request(
      createPolicy({
        name: "Kamsnab Public Access",
        icon: "public",
        enforce_tfa: false,
        admin_access: false,
        app_access: false
      })
    );
    console.log('+ policy "Kamsnab Public Access" создана');
  }

  // Публичный доступ в Directus 11 задаётся строкой в directus_access с role: null
  // (нет отдельной сущности "Public role" — привязка политики к анонимному доступу идёт через эту таблицу).
  const accessRes = await fetch(`${url}/access`, { headers: { Authorization: `Bearer ${token}` } });
  const { data: access } = await accessRes.json();
  const alreadyLinked = access.some((a) => a.policy === publicPolicy.id && a.role === null);

  if (!alreadyLinked) {
    await fetch(`${url}/access`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ policy: publicPolicy.id, role: null })
    });
    console.log('+ policy "Kamsnab Public Access" привязана к анонимному (Public) доступу');
  }

  const readOnlyCollections = [
    "categories",
    "products",
    "product_attributes",
    "pages",
    "settings",
    // Публичный доступ к самим файлам (фото товаров/категорий) — без этого
    // /assets/<id> отдаёт 403, даже если ссылающееся поле читаемо.
    "directus_files"
  ];
  const existingPermissions = await authed.request(readPermissions());

  for (const collection of readOnlyCollections) {
    const already = existingPermissions.some(
      (p) => p.collection === collection && p.action === "read" && p.policy === publicPolicy.id
    );
    if (already) continue;
    await authed.request(
      createPermission({
        policy: publicPolicy.id,
        collection,
        action: "read",
        fields: ["*"],
        permissions: {}
      })
    );
  }

  const leadCreateExists = existingPermissions.some(
    (p) => p.collection === "leads" && p.action === "create" && p.policy === publicPolicy.id
  );
  if (!leadCreateExists) {
    await authed.request(
      createPermission({
        policy: publicPolicy.id,
        collection: "leads",
        action: "create",
        fields: ["name", "phone", "message", "product", "source"],
        permissions: {}
      })
    );
  }

  console.log("Готово.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
