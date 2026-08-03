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

function isRateLimited(ip: string): boolean {
  const now = Date.now();
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
  name?: string;
  phone?: string;
  message?: string;
  product?: string | null;
  page_url?: string | null;
  source?: LeadSource;
  website?: string;
  renderedAt?: number;
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as LeadRequestBody | null;
  if (!body || !body.name || !body.phone) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  // Боты либо заполняют honeypot, либо отправляют форму подозрительно быстро.
  // В обоих случаях делаем вид, что всё прошло успешно, не создавая заявку —
  // так бот не понимает, что его отфильтровали.
  const isHoneypotTripped = Boolean(body.website);
  const isTooFast = !body.renderedAt || Date.now() - body.renderedAt < MIN_FILL_TIME_MS;
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
      source: body.source ?? "site"
    });
  } catch {
    return NextResponse.json({ error: "failed to create lead" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
