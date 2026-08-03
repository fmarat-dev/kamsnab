import Image from "next/image";

// Обёртка над next/image для ProductCard.renderImage — карточка живёт в
// @kamsnab/ui (используется и в мини-аппах на Vite), поэтому next/image
// туда напрямую не завозим, а подставляем сюда, только на сайте.
export function ProductCardImage({ src, alt, className }: { src: string; alt: string; className: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
      className={className}
    />
  );
}
