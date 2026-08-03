import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import { Heart, GitCompare } from "lucide-react";
import { Footer } from "@kamsnab/ui";
import { kamsnab } from "@/lib/directus";
import { siteUrl, siteName, safeJsonLd } from "@/lib/site";
import { SiteHeader } from "./SiteHeader";
import "./globals.css";

const defaultDescription =
  "Продажа и обслуживание вилочных погрузчиков, штабелёров и складской техники в Чебоксарах. Доставка по всей России.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} — складская техника и погрузчики`,
    template: `%s | ${siteName}`
  },
  description: defaultDescription,
  robots: { index: true, follow: true },
  verification: { yandex: "e5999b584a43210a" },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName,
    url: siteUrl,
    title: `${siteName} — складская техника и погрузчики`,
    description: defaultDescription
  },
  twitter: {
    card: "summary"
  }
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

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings?.company_name ?? siteName,
    url: siteUrl,
    telephone: settings?.phone ?? undefined,
    email: settings?.email ?? undefined,
    address: settings?.address
      ? { "@type": "PostalAddress", streetAddress: settings.address }
      : undefined
  };

  return (
    <html lang="ru">
      <body>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: safeJsonLd(organizationJsonLd) }}
        />
        <Script id="yandex-metrika" strategy="beforeInteractive">
          {`
            (function(m,e,t,r,i,k,a){
                m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                m[i].l=1*new Date();
                for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
                k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
            })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=111277837', 'ym');

            ym(111277837, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});
          `}
        </Script>
        <noscript>
          <div>
            <img src="https://mc.yandex.ru/watch/111277837" style={{ position: "absolute", left: "-9999px" }} alt="" />
          </div>
        </noscript>
        <SiteHeader
          logo={<span className="text-xl font-extrabold text-brand-600">КАМСНАБ</span>}
          phone={settings?.phone ?? "+7 (953) 448-37-58"}
          navLinks={navLinks}
          iconLinks={iconLinks}
        />
        <main>{children}</main>
        <Footer
          companyName={settings?.company_name ?? 'ООО "КАМСНАБ"'}
          address={settings?.address ?? "г. Чебоксары, ул. Вурнарское шоссе, д.11, офис 2"}
          phone={settings?.phone ?? "+7 (953) 448-37-58"}
          phoneLandline={settings?.phone_landline ?? "+7 (8352) 285-283"}
          email={settings?.email ?? "kam-snab@mail.ru"}
          workHours={settings?.work_hours ?? "Пн-Пт: 09:00–18:00, Сб-Вс: выходной"}
        />
      </body>
    </html>
  );
}
