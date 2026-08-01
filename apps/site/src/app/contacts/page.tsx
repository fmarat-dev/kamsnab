import type { Metadata } from "next";
import { Container, Breadcrumbs } from "@kamsnab/ui";
import { kamsnab } from "@/lib/directus";
import { ContactLeadForm } from "./ContactLeadForm";

export const metadata: Metadata = {
  title: "Контакты",
  description: "Контакты КАМСНАБ в Чебоксарах: адрес, телефон, email. Закажите звонок или оставьте заявку.",
  alternates: { canonical: "/contacts" }
};

export default async function ContactsPage() {
  const settings = await kamsnab.getSettings().catch(() => null);

  return (
    <Container className="py-10">
      <Breadcrumbs items={[{ label: "Контакты" }]} />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-ink-800">Контакты</h1>
          <p className="text-ink-600">{settings?.address ?? "г. Чебоксары, ул. Вурнарское шоссе, д.11, офис 2"}</p>
          <a href={`tel:${(settings?.phone ?? "+7 (953) 448-37-58").replace(/[^+\d]/g, "")}`} className="font-semibold text-brand-600">
            {settings?.phone ?? "+7 (953) 448-37-58"}
          </a>
          <a
            href={`tel:${(settings?.phone_landline ?? "+7 (8352) 285-283").replace(/[^+\d]/g, "")}`}
            className="font-semibold text-brand-600"
          >
            {settings?.phone_landline ?? "+7 (8352) 285-283"}
          </a>
          <a href={`mailto:${settings?.email ?? "kam-snab@mail.ru"}`} className="text-ink-600">
            {settings?.email ?? "kam-snab@mail.ru"}
          </a>
          <p className="text-ink-400">{settings?.work_hours ?? "Пн-Пт: 09:00–18:00, Сб-Вс: выходной"}</p>
        </div>
        <div id="contact" className="rounded-card border border-ink-100 p-6">
          <ContactLeadForm />
        </div>
      </div>
    </Container>
  );
}
