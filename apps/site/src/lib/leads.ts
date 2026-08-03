import type { LeadFormValues } from "@kamsnab/ui";
import type { LeadSource } from "@kamsnab/api-client";

interface SubmitLeadOptions {
  product?: string | null;
  source?: LeadSource;
}

// Заявки идут через свой /api/leads (не Directus напрямую) — там honeypot,
// проверка скорости заполнения и лимит по IP. См. app/api/leads/route.ts.
export async function submitLead(values: LeadFormValues, options: SubmitLeadOptions = {}): Promise<void> {
  const res = await fetch("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...values,
      page_url: window.location.href,
      product: options.product ?? null,
      source: options.source ?? "site"
    })
  });
  if (!res.ok) {
    throw new Error(`Failed to submit lead: ${res.status}`);
  }
}
