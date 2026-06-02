import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  buildArticleFaqJsonLd,
  buildArticleJsonLd,
  getArticleRouteMetadata,
  getPublishedArticleBySlug,
  getPublicGuideArticles,
  guidePath
} from "@/lib/articles";

type GuideArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getPublicGuideArticles().map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: GuideArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getPublishedArticleBySlug(slug);
  if (!article) return {};

  return getArticleRouteMetadata(article);
}

export default async function GuideArticlePage({ params }: GuideArticlePageProps) {
  const { slug } = await params;
  const article = getPublishedArticleBySlug(slug);
  if (!article) notFound();

  const faqSchema = buildArticleFaqJsonLd(article);

  return (
    <main className="bg-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildArticleJsonLd(article)) }}
      />
      {faqSchema ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      ) : null}

      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <Link href={guidePath()} className="text-sm font-semibold text-primary hover:text-ink">
          Guides
        </Link>
        <p className="mt-6 text-sm font-bold uppercase tracking-wide text-primary">{article.cluster.replace(/-/g, " ")}</p>
        <h1 className="mt-3 text-4xl font-bold text-ink">{article.title}</h1>
        <p className="mt-4 text-lg text-muted">{article.metaDescription}</p>

        <div className="mt-10 space-y-9">
          {article.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-2xl font-bold text-ink">{section.heading}</h2>
              <div className="mt-4 space-y-4 text-base leading-7 text-muted">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        {article.internalLinks.length ? (
          <section className="mt-10 border-t border-line pt-8">
            <h2 className="text-2xl font-bold text-ink">Related directory pages</h2>
            <div className="mt-4 grid gap-3">
              {article.internalLinks.map((link) => (
                <Link
                  key={`${link.href}-${link.label}`}
                  href={link.href}
                  className="rounded-md border border-line bg-white p-4 font-semibold text-ink hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {article.faqs.length ? (
          <section className="mt-10 border-t border-line pt-8">
            <h2 className="text-2xl font-bold text-ink">FAQs</h2>
            <div className="mt-4 space-y-4">
              {article.faqs.map((faq) => (
                <details key={faq.question} className="rounded-md border border-line bg-white p-4">
                  <summary className="cursor-pointer font-bold text-ink">{faq.question}</summary>
                  <p className="mt-3 text-sm leading-6 text-muted">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </main>
  );
}
