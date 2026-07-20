import type { ReactNode } from "react";

export interface HeaderProps {
  logo: ReactNode;
  phone: string;
  navLinks: { href: string; label: string }[];
  iconLinks?: { href: string; label: string; icon: ReactNode }[];
  ctaHref?: string;
}

export function Header({ logo, phone, navLinks, iconLinks = [], ctaHref = "#contact" }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-ink-100 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-6xl border-b border-ink-100 px-4 py-2">
        <nav className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-base font-medium text-ink-600">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-brand-600">
              {link.label}
            </a>
          ))}
          {iconLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              title={link.label}
              aria-label={link.label}
              className="hover:text-brand-600"
            >
              {link.icon}
            </a>
          ))}
        </nav>
      </div>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-3">
        <a href="/" className="shrink-0">
          {logo}
        </a>
        <form action="/catalog" method="GET" className="hidden max-w-xs flex-1 sm:block">
          <input
            type="search"
            name="search"
            placeholder="Поиск по каталогу"
            className="w-full rounded-full border border-ink-200 px-4 py-2 text-sm outline-none focus:border-brand-500"
          />
        </form>
        <div className="flex items-center gap-4">
          <a href={`tel:${phone.replace(/[^+\d]/g, "")}`} className="hidden text-sm font-semibold text-ink-800 sm:block">
            {phone}
          </a>
          <a
            href={ctaHref}
            className="rounded-card bg-accent-500 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-600"
          >
            Заказать звонок
          </a>
        </div>
      </div>
    </header>
  );
}
