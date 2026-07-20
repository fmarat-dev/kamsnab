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
    <nav aria-label="Хлебные крошки" className="mb-6 text-sm text-ink-500">
      <ol className="flex flex-wrap items-center gap-1.5">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          return (
            <li key={index} className="flex items-center gap-1.5">
              {index > 0 && <span aria-hidden="true">/</span>}
              {isLast || !item.href ? (
                <span className={isLast ? "text-ink-800" : undefined} aria-current={isLast ? "page" : undefined}>
                  {item.label}
                </span>
              ) : (
                <a href={item.href} className="hover:text-brand-600 hover:underline">
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
