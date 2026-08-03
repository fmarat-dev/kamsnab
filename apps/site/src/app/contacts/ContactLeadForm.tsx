"use client";

import { LeadForm, type LeadFormValues } from "@kamsnab/ui";
import { submitLead } from "@/lib/leads";

export function ContactLeadForm() {
  async function handleSubmit(values: LeadFormValues) {
    await submitLead(values);
  }

  return <LeadForm submitLabel="Заказать звонок" onSubmit={handleSubmit} />;
}
