"use client";

import type { ReactNode } from "react";

export interface HeaderProps {
  logo: ReactNode;
  phone: string;
  navLinks: { href: string; label: string }[];
  iconLinks?: { href: string; label: string; icon: ReactNode }[];
  ctaHref?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
}

export function Header({
  logo,
  phone,
  navLinks,
  iconLinks = [],
  ctaHref = "#contact",
  ctaLabel = "Заказать звонок",
  onCtaClick
}: HeaderProps) {
  const ctaClassName = "rounded-card bg-accent-500 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-600";

  return (
    <header className="sticky top-0 z-20 [transform:translateZ(0)] will-change-transform border-b border-ink-100 bg-white/95 backdrop-blur">
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
          <a
            href={`tel:${phone.replace(/[^+\d]/g, "")}`}
            title={phone}
            aria-label={phone}
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-green-500 bg-green-50 text-green-600 sm:hidden"
          >
            <span className="absolute inset-0 animate-ping rounded-full bg-green-400 opacity-75" />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="relative"
            >
              <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />
            </svg>
          </a>
          <a href={`tel:${phone.replace(/[^+\d]/g, "")}`} className="hidden text-sm font-semibold text-ink-800 sm:block">
            {phone}
          </a>
          {onCtaClick ? (
            <button type="button" onClick={onCtaClick} className={ctaClassName}>
              {ctaLabel}
            </button>
          ) : (
            <a href={ctaHref} className={ctaClassName}>
              {ctaLabel}
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
