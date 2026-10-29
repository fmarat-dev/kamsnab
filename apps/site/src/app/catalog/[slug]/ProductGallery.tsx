"use client";

import { useState } from "react";
import Image from "next/image";

export function ProductGallery({ images, title, badge }: { images: string[]; title: string; badge?: string }) {
  const [active, setActive] = useState(0);

  const badgeEl = badge && (
    <span className="absolute left-3 top-3 z-10 rounded-full bg-brand-700 px-2.5 py-1 text-[11px] font-bold uppercase tracking-label text-white">
      {badge}
    </span>
  );

  if (images.length === 0) {
    return <div className="relative aspect-[4/3] w-full rounded-card bg-ink-50">{badgeEl}</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-card bg-ink-50">
        {badgeEl}
        <Image
          src={images[active]}
          alt={title}
          fill
          // Первое фото — LCP карточки товара.
          priority={active === 0}
          sizes="(min-width: 1152px) 620px, (min-width: 1024px) 54vw, 100vw"
          className="object-contain p-6 mix-blend-multiply"
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, index) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Фото ${index + 1}`}
              aria-pressed={index === active}
              className={`relative h-16 w-16 shrink-0 rounded-tile border bg-ink-50 p-1 ${
                index === active ? "border-brand-600 ring-1 ring-brand-600" : "border-ink-100 hover:border-ink-300"
              }`}
            >
              <Image src={src} alt="" fill sizes="64px" className="object-contain p-1 mix-blend-multiply" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
