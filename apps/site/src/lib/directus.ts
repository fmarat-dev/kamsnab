import { createKamsnabClient } from "@kamsnab/api-client";

export const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL ?? "http://localhost:8055";

export const kamsnab = createKamsnabClient(directusUrl);
