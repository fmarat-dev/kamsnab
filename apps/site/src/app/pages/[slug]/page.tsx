import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { sanitizeRichText } from "@/lib/sanitize";
import { Container, Breadcrumbs } from "@kamsnab/ui";
import { kamsnab } from "@/lib/directus";
import { ServiceLeadForm } from "./ServiceLeadForm";
import { PageHighlights } from "./PageHighlights";
import { pageHighlights } from "./pageHighlights.data";

const HTML_ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&quot;": '"',
  "&#39;": "'",
  "&lt;": "<",
  "&gt;": ">",
  "&laquo;": "«",
  "&raquo;": "»",
  "&mdash;": "—",
  "&ndash;": "–"
};

function htmlToText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, (entity) => HTML_ENTITIES[entity] ?? " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Meta description страницы: первый абзац <p> без заголовков (раньше текст
// склеивался вместе с <h2> — «Гарантия 12 месяцев… На всю технику…»), обрезка
// по границе слова. Отдельного поля seo_description в Directus нет.
function excerptFromHtml(html: string, maxLength = 155): string {
  const firstParagraph = Array.from(html.matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/gi))
    .map((match) => htmlToText(match[1]))
    .find((text) => text.length > 0);
  // Абзацев нет — берём весь текст, но без заголовков.
  const text = firstParagraph ?? htmlToText(html.replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi, " "));
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > maxLength / 2 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.—–-]+$/, "")}…`;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await kamsnab.getPageBySlug(slug);
  if (!page) return {};

  return {
    title: page.title,
    description: excerptFromHtml(page.content),
    alternates: { canonical: `/pages/${page.slug}` }
  };
}

export default async function InfoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await kamsnab.getPageBySlug(slug);

  if (!page) notFound();

  return (
    <Container className="py-10">
      <Breadcrumbs items={[{ label: page.title }]} />
      <h1 className="mb-6 text-3xl font-bold text-ink-800">{page.title}</h1>
      {pageHighlights[slug] && <PageHighlights items={pageHighlights[slug]} />}
      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeRichText(page.content) }} />
      {(slug === "service" || slug === "repair") && (
        <div id="request" className="mt-10 rounded-card border border-ink-100 p-6">
          <h2 className="mb-1 text-xl font-bold text-ink-800">Нужна консультация или выезд специалистов?</h2>
          <p className="mb-4 text-ink-600">Оставьте заявку, и мы свяжемся с вами в ближайшее время.</p>
          <ServiceLeadForm />
        </div>
      )}
    </Container>
  );
}
