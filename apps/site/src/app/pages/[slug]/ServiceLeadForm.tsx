"use client";

import { LeadForm, type LeadFormValues } from "@kamsnab/ui";
import { submitLead } from "@/lib/leads";

export function ServiceLeadForm() {
  async function handleSubmit(values: LeadFormValues) {
    await submitLead(values);
  }

  return <LeadForm submitLabel="Оставить заявку" onSubmit={handleSubmit} />;
}
