import { Logo } from "./Logo";

export interface FooterLink {
  href: string;
  label: string;
}

export interface FooterProps {
  companyName: string;
  address: string;
  phone: string;
  phoneLandline?: string;
  email: string;
  workHours?: string;
  // Колонка «Каталог» (обычно — категории). Без неё — ссылка на весь каталог.
  catalogLinks?: FooterLink[];
  // Колонка «Покупателям».
  infoLinks?: FooterLink[];
  // Подпись под логотипом.
  tagline?: string;
}

const defaultCatalogLinks: FooterLink[] = [{ href: "/catalog", label: "Весь каталог" }];

const defaultInfoLinks: FooterLink[] = [
  { href: "/pages/service", label: "Сервис и гарантия" },
  { href: "/pages/payment", label: "Оплата" },
  { href: "/pages/delivery", label: "Доставка" },
  { href: "/contacts", label: "Контакты" }
];

const telHref = (phone: string) => `tel:${phone.replace(/[^+\d]/g, "")}`;

function ColumnTitle({ children }: { children: string }) {
  return <p className="mb-3 text-[13px] font-bold uppercase tracking-logo text-white">{children}</p>;
}

const linkClassName = "transition-colors hover:text-white";

export function Footer({
  companyName,
  address,
  phone,
  phoneLandline,
  email,
  workHours,
  catalogLinks = defaultCatalogLinks,
  infoLinks = defaultInfoLinks,
  tagline = "Складская техника и сервис"
}: FooterProps) {
  return (
    <footer className="bg-ink-800 text-sm text-ink-200">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-2">
          <a href="/" className="mb-1 text-2xl" aria-label="На главную">
            <Logo tone="light" />
          </a>
          <p>{companyName}</p>
          <p className="text-ink-300">{tagline}</p>
        </div>

        <nav aria-label="Каталог">
          <ColumnTitle>Каталог</ColumnTitle>
          <ul className="flex flex-col gap-1.5">
            {catalogLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} className={linkClassName}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Покупателям">
          <ColumnTitle>Покупателям</ColumnTitle>
          <ul className="flex flex-col gap-1.5">
            {infoLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} className={linkClassName}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <ColumnTitle>Контакты</ColumnTitle>
          <ul className="flex flex-col gap-1.5">
            <li>
              <a href={telHref(phone)} className={`font-semibold text-white ${linkClassName}`}>
                {phone}
              </a>
            </li>
            {phoneLandline && (
              <li>
                <a href={telHref(phoneLandline)} className={linkClassName}>
                  {phoneLandline}
                </a>
              </li>
            )}
            <li>
              <a href={`mailto:${email}`} className={linkClassName}>
                {email}
              </a>
            </li>
            <li>{address}</li>
            {workHours && <li className="text-ink-300">{workHours}</li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-700">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-ink-300">
          <p>
            Обращаем ваше внимание на то, что вся представленная на сайте информация носит исключительно
            информационный характер и ни при каких условиях не является публичной офертой определяемой положениями
            Статьи 437(2) Гражданского кодекса Российской Федерации.
          </p>
          <a href="/pages/privacy" className="self-start underline hover:text-white">
            Политика конфиденциальности
          </a>
        </div>
      </div>
    </footer>
  );
}
