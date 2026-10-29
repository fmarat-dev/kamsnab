# План: SEO и редизайн kam-snab.ru

## Primary goal

Человек, который ищет в Яндексе «купить погрузчик / штабелёр / гидравлическую тележку», находит kam-snab.ru выше, чем сейчас, страница каталога открывается быстро даже на телефоне, а сам сайт выглядит как надёжный поставщик техники, которому можно оставить заявку.

«Готово» означает: HTML каталога весит меньше 300 КБ (сейчас 4 МБ); у товаров и категорий корректная структурированная разметка без ошибок в валидаторе Яндекса; `www.kam-snab.ru` перенаправляет на основной домен; главная, каталог и карточка товара перерисованы в едином обновлённом стиле, а Lighthouse на мобильном показывает Performance ≥ 85 и SEO = 100.

---

## Факты, собранные 2026-10-29 (основа для Phase 0)

Живой сайт (curl):

| URL | Код | Размер HTML | Замечание |
|---|---|---|---|
| `/` | 200 | 152 КБ | title/description/canonical/h1 на месте |
| `/catalog` | 200 | **4,0 МБ**, 1,4 с | весь каталог (397 URL в sitemap) сериализуется в RSC-payload |
| `/catalog/category/vilochnye-pogruzchiki` | 200 | **1,1 МБ** | то же самое; description по шаблону, SEO-текста нет |
| карточка товара | 200 | 84 КБ | есть JSON-LD `Product`/`Offer`, нет `BreadcrumbList`, `availability` всегда `InStock`, нет `brand` |
| `/pages/service` | 200 | 36 КБ | meta description склеено из текста страницы вместе с заголовком («Гарантия 12 месяцев… На всю технику…») |
| `http://kam-snab.ru` | 308 → https | | ок |
| `https://www.kam-snab.ru` | **не резолвится** | | нет DNS-записи / редиректа |
| `/robots.txt`, `/sitemap.xml` | 200 | | в sitemap нет `lastmod` |

Код:
- Метаданные: `apps/site/src/app/layout.tsx:15-35` (общие), `generateMetadata` в `catalog/page.tsx:8`, `catalog/category/[slug]/page.tsx:6`, `catalog/[slug]/page.tsx:15`, `pages/[slug]/page.tsx:15`.
- JSON-LD: `Organization` в `layout.tsx:59-70`, `Product` в `catalog/[slug]/page.tsx:71-87`; хелпер `safeJsonLd` в `src/lib/site.ts`.
- Каталог: `catalog/page.tsx` передаёт полный `Product[]` в клиентский `CatalogClient.tsx` (115 строк), где идут фильтрация и поиск.
- Sitemap/robots: `src/app/sitemap.ts`, `src/app/robots.ts`.
- Дизайн-токены: `packages/ui/tailwind.preset.cjs`, общий для сайта и **двух мини-приложений** (Telegram, Max). Шрифт `Inter` указан, но нигде не подключается: `next/font` не используется, поэтому браузер показывает системный шрифт.
- UI-компоненты: `packages/ui/src/components/{Header,Footer,ProductCard,Button,Breadcrumbs,LeadForm,CategoryFilters,Modal}.tsx`, тоже общие с мини-приложениями.
- Главная: `apps/site/src/app/page.tsx`. Hero — сплошной тёмный блок без изображения, затем 3 преимущества, категории, «Популярные модели», «Спецпредложения».
- Инфраструктура: `infra/caddy`, `infra/docker-compose.yml`.
- Стек: Next 15.5, React 18, Tailwind 3.4, lucide-react, Directus CMS.

---

## Phase 0: Сбор документации

**How this serves the primary goal:** без точных API Next 15 (Metadata, next/font, пагинация с searchParams) и требований Яндекса к микроразметке дальнейшие фазы будут гадать и могут сломать индексацию.

Запустить субагентов на сбор фактов (каждый отдаёт источники, точные сигнатуры, места для копирования и оценку уверенности):

1. **Next.js 15 Metadata API**: `Metadata`, `alternates.canonical`, `robots`, `openGraph.images`, `twitter.card`, `MetadataRoute.Sitemap` (`lastModified`), `generateMetadata`. Источник: `node_modules/next/dist/lib/metadata/types/*.d.ts` и документация nextjs.org/docs/app/api-reference/functions/generate-metadata.
2. **next/font/google**: подключение кириллического подмножества (`subsets: ["latin","cyrillic"]`, `variable`) и связка с Tailwind `fontFamily` через CSS-переменную.
3. **Schema.org для Яндекса**: обязательные поля `Product`/`Offer` (price или `priceSpecification`, `availability`), `BreadcrumbList`, `LocalBusiness`/`Store` (`openingHoursSpecification`, `geo`, `address` как `PostalAddress` с `addressLocality`). Источники: yandex.ru/support/webmaster/supported-schemas, schema.org.
4. **Directus SDK в `packages/api-client`**: какие поля отдаёт `getProducts` и можно ли запрашивать `fields` и `limit`/`page`; есть ли у товара `date_updated`, `brand`, `in_stock`; есть ли у категорий поле для SEO-текста. Читать `packages/api-client/src/{client,types}.ts`.
5. **Caddy**: синтаксис редиректа `www` → apex (`redir https://kam-snab.ru{uri} permanent`). Читать `infra/caddy/*`.

**Результат Phase 0:** раздел «Allowed APIs» с цитатами плюс список несуществующего, чего не делать (например, `metadata.yandex`: в Next такого поля нет, есть только `verification.yandex`).

---

## Phase 1: Облегчить каталог и категории (главная SEO-проблема)

**How this serves the primary goal:** 4 МБ HTML дают медленный LCP и тяжёлый краулинг. Поисковики режут медленные страницы, а мобильный пользователь уходит раньше, чем увидит товары.

Что сделать:
1. В `catalog/page.tsx` и `catalog/category/[slug]/page.tsx` отображать `Product[]` в лёгкий тип карточки, где есть только то, что рисует `ProductCard`: `slug, title, sku, price, price_note, image, category.name, badge`. Скопировать форму из `toCardProps` в `apps/site/src/app/page.tsx:46-57` и вынести её в `src/lib/product-card.ts`.
2. Серверная пагинация `?page=N` по 24 товара. Запрос к Directus с `limit`/`offset` или `page`: смотреть API из Phase 0, пункт 4. Ссылки «1 2 3 … Далее» делать обычными `<Link>`, чтобы краулер прошёл все страницы.
3. Canonical: `/catalog/category/x?page=2` → canonical на себя (не на первую страницу); `?search=` → `robots: { index: false, follow: true }`.
4. Клиентские фильтры и поиск в `CatalogClient.tsx` оставить, но работать по URL-параметрам, а не по всему массиву в памяти.

Проверка:
- [ ] `curl -s https://<preview>/catalog | wc -c` < 300 000
- [ ] `curl -s https://<preview>/catalog/category/vilochnye-pogruzchiki?page=2` отдаёт 200 и canonical с `?page=2`
- [ ] Все 397 товаров достижимы по ссылкам пагинации (скрипт обходит страницы и считает уникальные `/catalog/<slug>`)
- [ ] `pnpm --filter @kamsnab/site typecheck && pnpm --filter @kamsnab/site build`

Чего не делать: бесконечный скролл без `<Link>` пагинации; canonical всех страниц пагинации на первую; правку `packages/api-client` без проверки, что мини-приложения его тоже используют.

---

## Phase 2: Структурированные данные и метатеги

**How this serves the primary goal:** правильная микроразметка даёт расширенные сниппеты (цена, хлебные крошки, адрес) в выдаче Яндекса и Google, и кликабельность растёт без изменения позиций.

Что сделать (по шаблонам из Phase 0, пункт 3):
1. `BreadcrumbList` JSON-LD на карточке товара и в категориях. Данные брать из тех же `items`, что уходят в `<Breadcrumbs>`. Скопировать паттерн `<script type="application/ld+json">` + `safeJsonLd` из `catalog/[slug]/page.tsx:89-93`.
2. `Product`: добавить `brand`, если поле есть в Directus. `availability` брать из реального поля наличия, при его отсутствии ставить `PreOrder`. Если `price` пуст, `offers` не выводить совсем, а не оставлять `price: undefined`.
3. `Organization` → `["Organization","LocalBusiness"]` с `PostalAddress` (`addressLocality: "Чебоксары"`, `addressCountry: "RU"`), `openingHoursSpecification`, `logo`.
4. Категории: если в Directus есть или будет поле `seo_text`/`description`, выводить его под сеткой товаров и использовать в meta description. Иначе оставить шаблон, но с конкретикой: «N моделей, цены от X ₽».
5. `pages/[slug]`: meta description брать из отдельного поля `seo_description` (или первых 155 символов абзаца без заголовков) вместо склейки.
6. `twitter.card: "summary_large_image"`; `og:image` по умолчанию берётся из `opengraph-image.tsx` (уже есть).
7. `sitemap.ts`: `lastModified` из `date_updated`, страницы пагинации не включать.

Проверка:
- [ ] validator.schema.org и webmaster.yandex.ru/tools/microtest/ без ошибок для главной, категории и товара
- [ ] `curl -s <товар> | grep -c BreadcrumbList` = 1
- [ ] Ни в одном JSON-LD нет `"price":null`

Чего не делать: выдуманные `aggregateRating`/`review` (Яндекс за это штрафует); `availability: InStock` без реальных данных.

---

## Phase 3: Домен и техническое SEO

**How this serves the primary goal:** `www` сейчас вообще не открывается, и люди, набравшие адрес с www, теряются. Дубли и битые адреса размывают вес страниц.

Что сделать:
1. DNS: A/AAAA-запись `www` → тот же IP (делает владелец у регистратора, в плане это ручной шаг).
2. `infra/caddy`: блок `www.kam-snab.ru { redir https://kam-snab.ru{uri} permanent }`, синтаксис из Phase 0, пункт 5.
3. Проверить, что страницы `/favorites` и `/compare` отдают `robots: noindex` в meta (robots.txt без meta не мешает индексации по внешним ссылкам).
4. Добавить в Вебмастере регион «Чебоксары» и отправить sitemap. Это ручной шаг, вывести инструкцией в итоговом отчёте.

Проверка:
- [ ] `curl -sI https://www.kam-snab.ru/catalog` → `308` и `Location: https://kam-snab.ru/catalog`
- [ ] `curl -s https://kam-snab.ru/compare | grep noindex`

---

## Phase 4: Дизайн-система (токены, шрифт, базовые компоненты)

**How this serves the primary goal:** сайт с системным шрифтом и плоскими блоками выглядит как шаблон, и это снижает доверие и конверсию в заявку. Сначала нужна основа, иначе страницы будут перерисованы вразнобой.

Перед началом загрузить навык `frontend-design:frontend-design` и договориться с владельцем о направлении: промышленный, надёжный, «как у дилера техники». Показать 2 варианта hero и карточки товара в виде макетов.

Что сделать:
1. Подключить Inter через `next/font/google` в `layout.tsx` с `subsets: ["latin","cyrillic"]` и `variable: "--font-inter"`. В `tailwind.preset.cjs` поставить `fontFamily.sans: ["var(--font-inter)", …]`. Мини-приложения получат fallback и не сломаются.
2. Токены: сохранить бренд-синий и красный CTA. Добавить шкалу теней и радиусов, а также типографическую шкалу (`text-display`, `text-h1`…).
3. Компоненты в `packages/ui`: `Button` (размеры, состояния focus-visible), `ProductCard` (единая высота, цена крупно, бейдж, «Запросить цену», когда цены нет), `Header` (липкий, телефон и CTA «Оставить заявку» на мобильном), `Footer` (колонки: каталог, услуги, контакты, реквизиты).

Проверка:
- [ ] В DevTools вычисленный `font-family` на `body` = Inter
- [ ] `pnpm build` проходит для сайта **и** обоих мини-приложений (`pnpm -r build`)
- [ ] Скриншоты Header и ProductCard на 375 px и 1280 px до и после

Чего не делать: менять цвета бренда без согласования; ломать API пропсов `packages/ui` (их используют мини-приложения).

---

## Phase 5: Перерисовка ключевых страниц

**How this serves the primary goal:** главная, каталог и карточка дают основную часть входов из поиска и заявок, поэтому именно на них улучшение заметно пользователю.

Что сделать:
1. **Главная** (`page.tsx`): hero с фото техники и двумя CTA («Каталог», «Получить консультацию»), полоса доверия (гарантия, доставка, сервис, «N моделей»), категории крупными плитками, блок «Как мы работаем» (3–4 шага), форма заявки внизу. SEO-текст о компании в Чебоксарах (Яндексу важна региональная привязка).
2. **Каталог/категория**: фильтры сайдбаром на десктопе и выезжающей панелью на мобильном, сортировка, пагинация из Phase 1, SEO-текст категории внизу.
3. **Карточка товара**: цена и CTA видны без прокрутки (на мобильном липкая нижняя панель «Позвонить / Заявка»), характеристики таблицей, преимущества (гарантия/доставка) рядом с ценой.
4. Использовать `next/image` с правильным `sizes` и `priority` для LCP-изображения hero и галереи.

Проверка:
- [ ] Lighthouse mobile на `/`, `/catalog`, одной карточке: Performance ≥ 85, Accessibility ≥ 95, SEO = 100
- [ ] Нет горизонтального скролла на 360 px
- [ ] Отправка заявки с главной и из карточки доходит (`/api/leads`)
- [ ] Скриншоты до и после приложены к отчёту

---

## Phase 6: Финальная проверка

**How this serves the primary goal:** подтверждает, что пользователь из поиска действительно получает быстрый и правильно размеченный сайт, а не что «код написан».

1. `pnpm -r typecheck && pnpm -r build`
2. Повторить таблицу curl-проверок из раздела «Факты» на проде и сравнить размеры и коды.
3. Валидаторы микроразметки (Яндекс + schema.org) на 3 типах страниц.
4. Lighthouse mobile на 3 страницах, цифры в отчёт.
5. grep на антипаттерны: `grep -rn '"InStock"' apps/site/src` (должно быть только условное), `grep -rn 'aggregateRating' apps/site/src` (пусто).
6. Через 1–2 недели проверить в Вебмастере: число страниц в поиске, ошибки микроразметки, «Качество сайта».

## Не сейчас

Блог и статейный контент · переписывание названий товаров из Title Case (это задача контента в Directus) · мультиязычность · миграция на Tailwind 4 / React 19 · редизайн мини-приложений (они получат только общие токены)
