import Link from "next/link";
import type { ReactNode } from "react";

export interface HighlightItem {
  image: string;
  title: string;
  text: string;
  href?: string;
}

function HighlightCard({ image, title, text }: Omit<HighlightItem, "href">) {
  return (
    <>
      <div
        role="img"
        aria-label={title}
        className="aspect-[4/3] w-full bg-brand-50 bg-cover bg-center"
        style={{ backgroundImage: `url(${image})` }}
      />
      <div className="flex flex-col gap-2 p-5">
        <p className="font-semibold text-ink-800">{title}</p>
        <p className="text-sm text-ink-500">{text}</p>
      </div>
    </>
  );
}

export function PageHighlights({ items }: { items: HighlightItem[] }) {
  return (
    <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const cardClassName =
          "flex flex-col overflow-hidden rounded-card border border-ink-100 transition-shadow hover:shadow-md";
        const content: ReactNode = <HighlightCard {...item} />;

        return item.href ? (
          <Link key={item.title} href={item.href} className={cardClassName}>
            {content}
          </Link>
        ) : (
          <div key={item.title} className={cardClassName}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
