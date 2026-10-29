import type { Metadata } from "next";
import type { ReactNode } from "react";

// page.tsx — клиентский ("use client") и не может экспортировать metadata,
// поэтому noindex задаём здесь. Персональная страница без своего контента.
export const metadata: Metadata = {
  title: "Сравнение товаров",
  robots: { index: false, follow: true }
};

export default function CompareLayout({ children }: { children: ReactNode }) {
  return children;
}
