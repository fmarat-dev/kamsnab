export interface CbrRates {
  date: string;
  usd: number;
  cny: number;
}

function extractRate(xml: string, charCode: string): number | null {
  const match = xml.match(
    new RegExp(`<CharCode>${charCode}<\\/CharCode>\\s*<Nominal>(\\d+)<\\/Nominal>[\\s\\S]*?<Value>([\\d,]+)<\\/Value>`)
  );
  if (!match) return null;

  const nominal = Number(match[1]);
  const value = Number(match[2].replace(",", ".")) / nominal;
  return Number.isFinite(value) && value > 0 ? value : null;
}

// Официальный ежедневный курс ЦБ РФ. XML отдаётся в windows-1251, но нас
// интересуют только цифры/латиница в тегах — они ASCII-совместимы, поэтому
// текст читаем как есть без перекодировки.
export async function getCbrRates(): Promise<CbrRates | null> {
  try {
    const res = await fetch("https://www.cbr.ru/scripts/XML_daily.asp", {
      next: { revalidate: 3600 }
    });
    if (!res.ok) return null;

    const xml = await res.text();
    const dateMatch = xml.match(/<ValCurs Date="([\d.]+)"/);
    const usd = extractRate(xml, "USD");
    const cny = extractRate(xml, "CNY");
    if (usd === null || cny === null) return null;

    return { date: dateMatch?.[1] ?? "", usd, cny };
  } catch {
    return null;
  }
}
