import { NextResponse, type NextRequest } from "next/server";
import { kamsnab } from "@/lib/directus";
import type { LeadSource } from "@kamsnab/api-client";

export const runtime = "nodejs";

// Заявка не должна доезжать быстрее, чем человек физически успевает
// заполнить форму — боты обычно отправляют её мгновенно после загрузки.
const MIN_FILL_TIME_MS = 2000;

// Простой лимит на IP: сайт на одном сервере/инстансе, Redis тут ни к чему.
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const submissionsByIp = new Map<string, number[]>();

// Без чистки карта растёт на каждый новый IP до перезапуска процесса.
function pruneSubmissions(now: number): void {
  for (const [ip, timestamps] of submissionsByIp) {
    if (timestamps.every((t) => now - t >= RATE_WINDOW_MS)) submissionsByIp.delete(ip);
  }
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  if (submissionsByIp.size > 10_000) pruneSubmissions(now);
  const timestamps = (submissionsByIp.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  timestamps.push(now);
  submissionsByIp.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT;
}

function clientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() ?? "unknown";
}

interface LeadRequestBody {
  name?: unknown;
  phone?: unknown;
  message?: unknown;
  product?: unknown;
  page_url?: unknown;
  source?: unknown;
  website?: unknown;
  renderedAt?: unknown;
}

const LEAD_SOURCES: readonly LeadSource[] = ["site", "telegram", "max"];

function isString(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.length <= maxLength;
}

function isOptionalString(value: unknown, maxLength: number): value is string | null | undefined {
  return value == null || isString(value, maxLength);
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as LeadRequestBody | null;
  if (
    !body ||
    !isString(body.name, 100) ||
    !body.name.trim() ||
    !isString(body.phone, 11) ||
    !/^[78]\d{10}$/.test(body.phone) ||
    !isOptionalString(body.message, 10_000) ||
    !isOptionalString(body.product, 36) ||
    !isOptionalString(body.page_url, 10_000) ||
    (body.source != null && !LEAD_SOURCES.includes(body.source as LeadSource))
  ) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  // Боты либо заполняют honeypot, либо отправляют форму подозрительно быстро.
  // В обоих случаях делаем вид, что всё прошло успешно, не создавая заявку —
  // так бот не понимает, что его отфильтровали.
  const isHoneypotTripped = Boolean(body.website);
  const isTooFast = typeof body.renderedAt !== "number" || Date.now() - body.renderedAt < MIN_FILL_TIME_MS;
  if (isHoneypotTripped || isTooFast) {
    return NextResponse.json({ ok: true });
  }

  const ip = clientIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "too many requests" }, { status: 429 });
  }

  try {
    await kamsnab.createLead({
      name: body.name,
      phone: body.phone,
      message: body.message,
      product: body.product ?? null,
      page_url: body.page_url ?? null,
      source: (body.source as LeadSource | undefined) ?? "site"
    });
  } catch {
    return NextResponse.json({ error: "failed to create lead" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
