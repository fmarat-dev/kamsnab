"use client";

import { LeadForm, type LeadFormValues } from "@kamsnab/ui";
import { submitLead } from "@/lib/leads";

export function ProductLeadForm({ productId, productTitle }: { productId: string; productTitle: string }) {
  async function handleSubmit(values: LeadFormValues) {
    await submitLead(values, { product: productId });
  }

  return <LeadForm productTitle={productTitle} submitLabel="Оставить заявку" onSubmit={handleSubmit} />;
}
