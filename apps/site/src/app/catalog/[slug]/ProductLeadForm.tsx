"use client";

import { LeadForm, type LeadFormValues } from "@kamsnab/ui";
import { kamsnab } from "@/lib/directus";

export function ProductLeadForm({ productId, productTitle }: { productId: string; productTitle: string }) {
  async function handleSubmit(values: LeadFormValues) {
    await kamsnab.createLead({
      ...values,
      product: productId,
      source: "site"
    });
  }

  return <LeadForm productTitle={productTitle} submitLabel="Оставить заявку" onSubmit={handleSubmit} />;
}
