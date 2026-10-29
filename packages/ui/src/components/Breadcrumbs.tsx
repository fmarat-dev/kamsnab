export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const allItems: BreadcrumbItem[] = [{ label: "Главная", href: "/" }, ...items];

  return (
    <nav aria-label="Хлебные крошки" className="mb-6 text-[13px] text-ink-400">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          return (
            <li key={index} className="flex items-center gap-2">
              {index > 0 && (
                <span aria-hidden="true" className="text-ink-300">
                  ›
                </span>
              )}
              {isLast || !item.href ? (
                <span
                  className={isLast ? "font-medium text-ink-700" : undefined}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <a href={item.href} className="transition-colors hover:text-brand-700">
                  {item.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
