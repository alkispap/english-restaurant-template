import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BarChart3, CheckCircle2 } from "lucide-react";
import type {
  ArticleComparisonTable as ArticleComparisonTableModel,
  ArticleContent,
  ArticleCtaBlock,
  ArticleDataBlock as ArticleDataBlockModel,
  ArticleVisualBlock as ArticleVisualBlockModel
} from "@/lib/article-types";
import { buildArticleFaqJsonLd, buildArticleJsonLd, guidePath } from "@/lib/articles";

type GuideArticleContentProps = {
  article: ArticleContent;
  preview?: boolean;
};

export function GuideArticleContent({ article, preview = false }: GuideArticleContentProps) {
  const faqSchema = buildArticleFaqJsonLd(article);

  return (
    <main className="bg-page">
      {!preview ? (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(buildArticleJsonLd(article)) }}
          />
          {faqSchema ? (
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
          ) : null}
        </>
      ) : null}

      <article>
        <header className="border-b border-line bg-white">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
            <Link href={guidePath()} className="text-sm font-semibold text-primary hover:text-ink">
              Guides
            </Link>
            {preview ? (
              <div className="mt-5 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                Draft preview only. This page is not linked in the public guides index.
              </div>
            ) : null}
            <p className="mt-6 text-sm font-bold uppercase tracking-wide text-primary">{article.cluster.replace(/-/g, " ")}</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-bold text-ink sm:text-5xl">{article.title}</h1>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold text-muted">
              <span>Published: {article.publishedAt ? formatArticleDate(article.publishedAt) : "Publication pending"}</span>
              <span>Updated: {formatArticleDate(article.updatedAt || article.publishedAt)}</span>
            </div>
            <p className="mt-5 max-w-4xl text-xl font-semibold leading-8 text-ink">{article.answer}</p>

            {article.keyFacts?.length ? (
              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {article.keyFacts.slice(0, 3).map((fact) => (
                  <div key={`${fact.label}-${fact.value}`} className="rounded-md border border-line bg-page p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted">{fact.label}</p>
                    <p className="mt-2 text-xl font-bold text-ink">{fact.value}</p>
                    {fact.detail ? <p className="mt-2 text-sm leading-6 text-muted">{fact.detail}</p> : null}
                  </div>
                ))}
              </div>
            ) : null}

            {article.heroImage ? (
              <figure className="mt-8 overflow-hidden rounded-lg border border-line bg-surface shadow-soft">
                <div className="relative aspect-[16/9] bg-orange-50">
                  <Image
                    src={article.heroImage.src}
                    alt={article.heroImage.alt}
                    fill
                    priority
                    sizes="(min-width: 1024px) 1024px, 100vw"
                    className="object-cover"
                    unoptimized={article.heroImage.src.endsWith(".svg")}
                  />
                </div>
                {article.heroImage.caption ? <figcaption className="px-4 py-3 text-sm text-muted">{article.heroImage.caption}</figcaption> : null}
              </figure>
            ) : null}

            {article.ctaBlocks?.[0] ? <ArticleCta block={article.ctaBlocks[0]} /> : null}
          </div>
        </header>

        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:px-8">
          <div className="min-w-0">
            <div className="space-y-9">
              {article.sections.map((section, index) => (
                <section key={section.heading}>
                  <h2 className="text-2xl font-bold text-ink">{section.heading}</h2>
                  <div className="mt-4 space-y-4 text-base leading-7 text-muted">
                    {section.body.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>

                  {index === 1 && article.visualBlocks?.[0] ? <ArticleVisualBlock block={article.visualBlocks[0]} /> : null}
                  {index === 2 && article.comparisonTables?.[0] ? <ArticleComparisonTable table={article.comparisonTables[0]} /> : null}
                  {index === 3 && article.dataBlocks?.[0] ? <ArticleDataBlock block={article.dataBlocks[0]} /> : null}
                  {index === 4 && article.ctaBlocks?.[1] ? <ArticleCta block={article.ctaBlocks[1]} /> : null}
                </section>
              ))}
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            {article.dataBlocks?.[0] ? (
              <div className="rounded-md border border-line bg-white p-4 shadow-soft">
                <p className="text-xs font-bold uppercase tracking-wide text-primary">Local signals</p>
                <div className="mt-3 space-y-3">
                  {article.dataBlocks[0].items.slice(0, 3).map((item) => (
                    <div key={`${item.label}-${item.value}`}>
                      <p className="text-sm font-bold text-ink">{item.value}</p>
                      <p className="text-xs leading-5 text-muted">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {article.internalLinks.length ? (
              <div className="rounded-md border border-line bg-white p-4 shadow-soft">
                <p className="text-xs font-bold uppercase tracking-wide text-primary">Next step</p>
                <div className="mt-3 grid gap-2">
                  {article.internalLinks.slice(0, 4).map((link) => (
                    <Link key={`${link.href}-${link.label}`} href={link.href} className="text-sm font-semibold text-ink hover:text-primary">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>
        </div>

        {article.internalLinks.length ? (
          <section className="mx-auto max-w-6xl border-t border-line px-4 py-8 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-ink">Related Indian Restaurant Directory Pages</h2>
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
          <section className="mx-auto max-w-6xl border-t border-line px-4 py-8 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-ink">Indian Food and Restaurant FAQs</h2>
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

        {article.researchSources.length ? (
          <section className="mx-auto max-w-6xl border-t border-line px-4 py-8 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-ink">Sources for This Indian Restaurant Guide</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {article.researchSources.slice(0, 6).map((source) => (
                <a key={`${source.url}-${source.title}`} href={source.url} className="rounded-md border border-line bg-white p-4 hover:border-primary">
                  <p className="font-semibold text-ink">{source.title}</p>
                  {source.note ? <p className="mt-2 text-sm leading-6 text-muted">{source.note}</p> : null}
                </a>
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </main>
  );
}

function formatArticleDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function ArticleVisualBlock({ block }: { block: ArticleVisualBlockModel }) {
  const isSvg = block.image.src.endsWith(".svg");

  return (
    <figure className="mt-6 overflow-hidden rounded-md border border-line bg-white shadow-soft">
      <div className="relative aspect-[16/9] bg-orange-50">
        {isSvg ? (
          // SVG article diagrams are project-owned assets and should render directly.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={block.image.src} alt={block.image.alt} className="h-full w-full object-cover" />
        ) : (
          <Image
            src={block.image.src}
            alt={block.image.alt}
            fill
            sizes="(min-width: 1024px) 720px, 100vw"
            className="object-cover"
          />
        )}
      </div>
      <figcaption className="px-4 py-3">
        <p className="font-bold text-ink">{block.title}</p>
        {block.body ? <p className="mt-1 text-sm leading-6 text-muted">{block.body}</p> : null}
        {block.image.caption ? <p className="mt-1 text-xs text-muted">{block.image.caption}</p> : null}
      </figcaption>
    </figure>
  );
}

function ArticleDataBlock({ block }: { block: ArticleDataBlockModel }) {
  return (
    <div className="mt-6 rounded-md border border-line bg-white p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <BarChart3 className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden />
        <div>
          <h3 className="text-xl font-bold text-ink">{block.title}</h3>
          {block.description ? <p className="mt-1 text-sm leading-6 text-muted">{block.description}</p> : null}
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {block.items.map((item) => (
          <div key={`${item.label}-${item.value}`} className="rounded-md border border-line bg-page p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-ink">{item.value}</p>
            <MetricBar value={item.value} />
            {item.detail ? <p className="mt-2 text-sm leading-6 text-muted">{item.detail}</p> : null}
          </div>
        ))}
      </div>
      {block.sourceLabel ? <p className="mt-4 text-xs font-semibold text-muted">{block.sourceLabel}</p> : null}
    </div>
  );
}

function ArticleComparisonTable({ table }: { table: ArticleComparisonTableModel }) {
  return (
    <div className="mt-6 overflow-hidden rounded-md border border-line bg-white shadow-soft">
      <div className="border-b border-line p-4">
        <h3 className="text-xl font-bold text-ink">{table.title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-line text-left text-sm">
          <thead className="bg-page text-xs uppercase tracking-wide text-muted">
            <tr>
              {table.columns.map((column) => (
                <th key={column} scope="col" className="px-4 py-3 font-bold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {table.rows.map((row) => (
              <tr key={row.label}>
                <th scope="row" className="px-4 py-4 font-bold text-ink">
                  {row.label}
                </th>
                {row.values.map((value) => (
                  <td key={`${row.label}-${value}`} className="px-4 py-4 leading-6 text-muted">
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ArticleCta({ block }: { block: ArticleCtaBlock }) {
  return (
    <div className="mt-7 rounded-md border border-primary/30 bg-orange-50 p-5">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-xl font-bold text-ink">{block.title}</p>
          <p className="mt-2 text-sm leading-6 text-muted">{block.copy}</p>
          <Link href={block.href} className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-accent">
            {block.label}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}

function MetricBar({ value }: { value: string }) {
  const width = value.endsWith("%") ? Number.parseInt(value, 10) : 100;
  if (!Number.isFinite(width)) return null;

  return (
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
      <span className="block h-full rounded-full bg-primary" style={{ width: `${Math.max(8, Math.min(width, 100))}%` }} />
    </div>
  );
}
