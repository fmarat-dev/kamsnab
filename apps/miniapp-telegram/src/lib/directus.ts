import { createKamsnabClient } from "@kamsnab/api-client";

export const directusUrl = import.meta.env.VITE_DIRECTUS_URL ?? "http://localhost:8055";

export const kamsnab = createKamsnabClient(directusUrl);
