import { notFound } from "next/navigation";
import { Container, Breadcrumbs } from "@kamsnab/ui";
import { kamsnab } from "@/lib/directus";
import { ServiceLeadForm } from "./ServiceLeadForm";
import { PageHighlights } from "./PageHighlights";
import { pageHighlights } from "./pageHighlights.data";

export default async function InfoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await kamsnab.getPageBySlug(slug);

  if (!page) notFound();

  return (
    <Container className="py-10">
      <Breadcrumbs items={[{ label: page.title }]} />
      <h1 className="mb-6 text-3xl font-bold text-ink-800">{page.title}</h1>
      {pageHighlights[slug] && <PageHighlights items={pageHighlights[slug]} />}
      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: page.content }} />
      {slug === "service" && (
        <div id="request" className="mt-10 rounded-card border border-ink-100 p-6">
          <h2 className="mb-1 text-xl font-bold text-ink-800">Нужна консультация или выезд специалистов?</h2>
          <p className="mb-4 text-ink-600">Оставьте заявку, и мы свяжемся с вами в ближайшее время.</p>
          <ServiceLeadForm />
        </div>
      )}
    </Container>
  );
}
