export interface CnyRate {
  value: number;
  date: string;
}

// Официальный ежедневный курс ЦБ РФ. XML отдаётся в windows-1251, но нас
// интересуют только цифры/латиница в тегах — они ASCII-совместимы, поэтому
// текст читаем как есть без перекодировки.
export async function getCnyRate(): Promise<CnyRate | null> {
  try {
    const res = await fetch("https://www.cbr.ru/scripts/XML_daily.asp", {
      next: { revalidate: 3600 }
    });
    if (!res.ok) return null;

    const xml = await res.text();
    const dateMatch = xml.match(/<ValCurs Date="([\d.]+)"/);
    const cnyMatch = xml.match(
      /<CharCode>CNY<\/CharCode>\s*<Nominal>(\d+)<\/Nominal>[\s\S]*?<Value>([\d,]+)<\/Value>/
    );
    if (!cnyMatch) return null;

    const nominal = Number(cnyMatch[1]);
    const value = Number(cnyMatch[2].replace(",", ".")) / nominal;
    if (!Number.isFinite(value) || value <= 0) return null;

    return { value, date: dateMatch?.[1] ?? "" };
  } catch {
    return null;
  }
}
