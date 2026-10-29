"use client";

import { useEffect, useState, type ReactNode } from "react";

export interface HeaderProps {
  logo: ReactNode;
  phone: string;
  navLinks: { href: string; label: string }[];
  iconLinks?: { href: string; label: string; icon: ReactNode }[];
  ctaHref?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  rates?: { date: string; usd: number; cny: number } | null;
  // Верхняя служебная полоса: адрес и часы работы (слева), курсы ЦБ (справа).
  address?: string;
  workHours?: string;
}

const telHref = (phone: string) => `tel:${phone.replace(/[^+\d]/g, "")}`;
const formatRate = (value: number) =>
  value.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const iconButtonClassName =
  "flex h-11 w-11 items-center justify-center rounded-button text-ink-700 transition-colors hover:bg-ink-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400";

function PhoneIcon({ size = 20 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
    </svg>
  );
}

export function Header({
  logo,
  phone,
  navLinks,
  iconLinks = [],
  ctaHref = "#contact",
  ctaLabel = "Оставить заявку",
  onCtaClick,
  rates,
  address,
  workHours
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Escape закрывает мобильное меню и поиск.
  useEffect(() => {
    if (!menuOpen && !searchOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen, searchOpen]);

  const ctaClassName =
    "inline-flex min-h-[2.75rem] items-center justify-center whitespace-nowrap rounded-button bg-accent-600 px-5 py-3 text-sm font-bold uppercase tracking-caps text-white transition-colors hover:bg-accent-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2";

  const renderCta = (extraClassName = "") =>
    onCtaClick ? (
      <button
        type="button"
        onClick={() => {
          setMenuOpen(false);
          onCtaClick();
        }}
        className={`${ctaClassName} ${extraClassName}`}
      >
        {ctaLabel}
      </button>
    ) : (
      <a href={ctaHref} className={`${ctaClassName} ${extraClassName}`}>
        {ctaLabel}
      </a>
    );

  const utilityText = [address, workHours].filter(Boolean).join(" · ");

  return (
    <>
      {(utilityText || rates || iconLinks.length > 0) && (
        <div className="hidden border-b border-ink-100 bg-ink-50 md:block">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-1.5 text-[13px] text-ink-500">
            <span>{utilityText}</span>
            <div className="flex items-center gap-5">
              {iconLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-1.5 transition-colors hover:text-brand-700 [&_svg]:h-4 [&_svg]:w-4"
                >
                  {link.icon}
                  {link.label}
                </a>
              ))}
              {rates ? (
                <span title={`Курс ЦБ РФ на ${rates.date}`} className="whitespace-nowrap">
                  Курс ЦБ: ¥ {formatRate(rates.cny)} ₽ · $ {formatRate(rates.usd)} ₽
                </span>
              ) : null}
            </div>
          </div>
        </div>
      )}
      <header className="sticky top-0 z-20 border-b border-ink-100 bg-white/95 backdrop-blur [transform:translateZ(0)] will-change-transform">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 pl-4 pr-2 md:h-auto md:gap-6 md:px-4 md:py-3.5">
          <a href="/" className="shrink-0 text-[22px] md:text-[28px]">
            {logo}
          </a>

          <nav aria-label="Основное меню" className="hidden flex-1 flex-wrap items-center gap-x-4 gap-y-1 xl:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="whitespace-nowrap text-[13px] font-semibold uppercase tracking-caps text-ink-800 transition-colors hover:text-brand-700"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1 md:gap-2">
            <button
              type="button"
              aria-label="Поиск по каталогу"
              aria-expanded={searchOpen}
              onClick={() => {
                setSearchOpen((v) => !v);
                setMenuOpen(false);
              }}
              className={iconButtonClassName}
            >
              <SearchIcon />
            </button>
            <a href={telHref(phone)} aria-label={`Позвонить ${phone}`} className={`md:hidden ${iconButtonClassName}`}>
              <PhoneIcon />
            </a>
            <a href={telHref(phone)} className="ml-1 hidden whitespace-nowrap text-base font-bold text-ink-800 hover:text-brand-700 md:block">
              {phone}
            </a>
            {renderCta("ml-1 hidden md:inline-flex")}
            <button
              type="button"
              aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
              aria-expanded={menuOpen}
              aria-controls="site-mobile-menu"
              onClick={() => {
                setMenuOpen((v) => !v);
                setSearchOpen(false);
              }}
              className={`xl:hidden ${iconButtonClassName}`}
            >
              <MenuIcon open={menuOpen} />
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-ink-100 bg-white">
            <form action="/catalog" method="GET" role="search" className="mx-auto flex max-w-6xl gap-2 px-4 py-3">
              <input
                type="search"
                name="search"
                autoFocus
                placeholder="Поиск по каталогу"
                aria-label="Поиск по каталогу"
                className="min-h-[2.75rem] w-full rounded-button border border-ink-200 px-4 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
              <button
                type="submit"
                className="min-h-[2.75rem] rounded-button bg-brand-600 px-5 text-sm font-bold uppercase tracking-caps text-white hover:bg-brand-700"
              >
                Найти
              </button>
            </form>
          </div>
        )}

        {menuOpen && (
          <div id="site-mobile-menu" className="max-h-[calc(100vh-3.5rem)] overflow-y-auto border-t border-ink-100 bg-white xl:hidden">
            <nav aria-label="Мобильное меню" className="mx-auto flex max-w-6xl flex-col px-4 py-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-[3rem] items-center border-b border-ink-100 text-[15px] font-semibold uppercase tracking-caps text-ink-800 hover:text-brand-700"
                >
                  {link.label}
                </a>
              ))}
              {iconLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-[3rem] items-center gap-3 border-b border-ink-100 text-[15px] font-semibold uppercase tracking-caps text-ink-800 hover:text-brand-700"
                >
                  {link.icon}
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 pb-5 pt-3">
              <a href={telHref(phone)} className="flex items-center gap-2 text-lg font-bold text-ink-800">
                <PhoneIcon size={18} />
                {phone}
              </a>
              {renderCta("w-full")}
              {utilityText && <p className="text-[13px] text-ink-500">{utilityText}</p>}
              {rates ? (
                <p className="text-[13px] text-ink-500">
                  Курс ЦБ на {rates.date}: ¥ {formatRate(rates.cny)} ₽ · $ {formatRate(rates.usd)} ₽
                </p>
              ) : null}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
