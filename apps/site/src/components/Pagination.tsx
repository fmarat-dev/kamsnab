import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  // Адрес страницы n (1-based). Компонент серверный, поэтому функцию можно
  // передавать — в клиентские компоненты он попадает уже готовой разметкой.
  hrefForPage: (page: number) => string;
}

// Номера вокруг текущей страницы + первая/последняя, пропуски — «…».
function pageItems(current: number, total: number): (number | "gap")[] {
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const items: (number | "gap")[] = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) items.push("gap");
    items.push(page);
  });
  return items;
}

// Обычные <Link> (а не кнопки/бесконечный скролл), чтобы поисковый робот
// прошёл по всем страницам каталога.
export function Pagination({ currentPage, totalPages, hrefForPage }: PaginationProps) {
  if (totalPages <= 1) return null;

  const linkClass =
    "inline-flex min-h-[2.75rem] min-w-[2.75rem] items-center justify-center rounded-button border border-ink-100 px-3 text-sm font-semibold text-ink-700 hover:border-ink-300 hover:bg-ink-50";

  return (
    <nav aria-label="Страницы каталога" className="flex flex-wrap items-center gap-1">
      {currentPage > 1 && (
        <Link href={hrefForPage(currentPage - 1)} rel="prev" className={linkClass}>
          ← Назад
        </Link>
      )}
      {pageItems(currentPage, totalPages).map((item, index) =>
        item === "gap" ? (
          <span key={`gap-${index}`} className="px-2 text-sm text-ink-400">
            …
          </span>
        ) : item === currentPage ? (
          <span
            key={item}
            aria-current="page"
            className="inline-flex min-h-[2.75rem] min-w-[2.75rem] items-center justify-center rounded-button bg-brand-700 px-3 text-sm font-semibold text-white"
          >
            {item}
          </span>
        ) : (
          <Link key={item} href={hrefForPage(item)} className={linkClass}>
            {item}
          </Link>
        )
      )}
      {currentPage < totalPages && (
        <Link href={hrefForPage(currentPage + 1)} rel="next" className={linkClass}>
          Далее →
        </Link>
      )}
    </nav>
  );
}
