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
          <p className="text-ink-600">{settings?.address ?? "г. Чебоксары"}</p>
          <a href={`tel:${(settings?.phone ?? "").replace(/[^+\d]/g, "")}`} className="font-semibold text-brand-600">
            {settings?.phone ?? "+7 (___) ___-__-__"}
          </a>
          {settings?.phone_landline && (
            <a href={`tel:${settings.phone_landline.replace(/[^+\d]/g, "")}`} className="font-semibold text-brand-600">
              {settings.phone_landline}
            </a>
          )}
          <a href={`mailto:${settings?.email ?? "info@kamsnab.ru"}`} className="text-ink-600">
            {settings?.email ?? "info@kamsnab.ru"}
          </a>
          {settings?.work_hours && <p className="text-ink-400">{settings.work_hours}</p>}
        </div>
        <div id="contact" className="rounded-card border border-ink-100 p-6">
          <ContactLeadForm />
        </div>
      </div>
    </Container>
  );
}
