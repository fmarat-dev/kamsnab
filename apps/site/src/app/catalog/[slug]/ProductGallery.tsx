"use client";

import { useState } from "react";
import Image from "next/image";

export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return <div className="aspect-[4/3] w-full rounded-card bg-ink-50" />;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/3] w-full rounded-card bg-ink-50 p-6">
        <Image
          src={images[active]}
          alt={title}
          fill
          sizes="(min-width: 1024px) 66vw, 100vw"
          className="object-contain"
          priority
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((src, index) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(index)}
              className={`relative h-16 w-16 shrink-0 rounded-card border p-1 ${
                index === active ? "border-brand-600" : "border-ink-100 hover:border-ink-300"
              }`}
            >
              <Image src={src} alt={`${title} — фото ${index + 1}`} fill sizes="64px" className="object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
