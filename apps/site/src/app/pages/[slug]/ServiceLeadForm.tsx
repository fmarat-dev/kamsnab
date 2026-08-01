"use client";

import { LeadForm, type LeadFormValues } from "@kamsnab/ui";
import { kamsnab } from "@/lib/directus";

export function ServiceLeadForm() {
  async function handleSubmit(values: LeadFormValues) {
    await kamsnab.createLead({ ...values, page_url: window.location.href, source: "site" });
  }

  return <LeadForm submitLabel="Оставить заявку" onSubmit={handleSubmit} />;
}
