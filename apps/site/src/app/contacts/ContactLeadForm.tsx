"use client";

import { LeadForm, type LeadFormValues } from "@kamsnab/ui";
import { kamsnab } from "@/lib/directus";

export function ContactLeadForm() {
  async function handleSubmit(values: LeadFormValues) {
    await kamsnab.createLead({ ...values, source: "site" });
  }

  return <LeadForm submitLabel="Заказать звонок" onSubmit={handleSubmit} />;
}
