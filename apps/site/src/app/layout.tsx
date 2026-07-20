import type { ReactNode } from "react";
import { Heart, GitCompare } from "lucide-react";
import { Header, Footer } from "@kamsnab/ui";
import { kamsnab } from "@/lib/directus";
import "./globals.css";

export const metadata = {
  title: "КАМСНАБ — складская техника",
  description: "Продажа и обслуживание вилочных погрузчиков и складского оборудования"
};

const navLinks = [
  { href: "/catalog", label: "Каталог" },
  { href: "/pages/service", label: "Сервис и гарантия" },
  { href: "/pages/payment", label: "Оплата" },
  { href: "/pages/delivery", label: "Доставка" },
  { href: "/contacts", label: "Контакты" }
];

const iconLinks = [
  { href: "/compare", label: "Сравнение", icon: <GitCompare size={20} /> },
  { href: "/favorites", label: "Избранное", icon: <Heart size={20} /> }
];

export default async function RootLayout({ children }: { children: ReactNode }) {
  const settings = await kamsnab.getSettings().catch(() => null);

  return (
    <html lang="ru">
      <body>
        <Header
          logo={<span className="text-xl font-extrabold text-brand-600">КАМСНАБ</span>}
          phone={settings?.phone ?? "+7 (___) ___-__-__"}
          navLinks={navLinks}
          iconLinks={iconLinks}
          ctaHref="/contacts"
        />
        <main>{children}</main>
        <Footer
          companyName={settings?.company_name ?? "КАМСНАБ"}
          address={settings?.address ?? "г. Чебоксары"}
          phone={settings?.phone ?? "+7 (___) ___-__-__"}
          phoneLandline={settings?.phone_landline ?? undefined}
          email={settings?.email ?? "info@kamsnab.ru"}
          workHours={settings?.work_hours ?? undefined}
        />
      </body>
    </html>
  );
}
