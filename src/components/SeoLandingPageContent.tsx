import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DirectoryFreshnessLabel } from "@/components/DirectoryFreshnessLabel";
import { ListingsResults } from "@/components/ListingsResults";
import { ResponsiveDirectoryFilters } from "@/components/ResponsiveDirectoryFilters";
import { SearchBar } from "@/components/SearchBar";
import { SectionHeading } from "@/components/SectionHeading";
import { buildDirectoryListingsChrome } from "@/lib/directory-listings-model";
import { seoLandingHeadings } from "@/lib/seo-landing-headings";
import type { SeoPageModel } from "@/lib/seo-pages";

type SeoLandingPageContentProps = {
  page: SeoPageModel;
  viewId?: string;
};

export function SeoLandingPageContent({ page, viewId }: SeoLandingPageContentProps) {
  const chrome = buildDirectoryListingsChrome(page.filterPanelValues, "seoLanding");
  const filterModel = {
    filterPanelValues: page.filterPanelValues,
    filterOptionGroups: chrome.filterOptionGroups,
    sidebarContext: chrome.sidebarContext,
    sidebarBlocks: areaScopedSidebarBlocks(page, chrome.sidebarBlocks)
  };

  return (
    <main id={viewId} className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {page.structuredData.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}

      <section className="mb-8 rounded-lg border border-line bg-white p-6 shadow-soft">
        <Breadcrumbs items={page.breadcrumbItems} />
        <p className="mb-2 text-sm font-bold uppercase tracking-wide text-primary">{page.hero.eyebrow}</p>
        <h1 className="text-4xl font-bold text-ink">{page.hero.title}</h1>
        <p className="mt-3 max-w-3xl text-muted">{page.hero.description}</p>
        <DirectoryFreshnessLabel className="mt-4" />
        <div className="mt-6">
          <SearchBar
            compact
            defaultQuery={page.linkValues.q}
            defaultArea={first(page.linkValues.area)}
            basePath={page.metadata.canonical}
            areas={chrome.searchAreas}
            areaCentroids={chrome.searchMapPoints.map((point) => ({
              slug: point.slug,
              name: point.name,
              area: point.area,
              latitude: point.latitude,
              longitude: point.longitude
            }))}
            hideAreaChoice={page.kind === "area"}
          />
        </div>
      </section>

      <div id="seo-landing-server-results" className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <ResponsiveDirectoryFilters
          model={filterModel}
          action={page.metadata.canonical}
          hiddenGroups={areaScopedHiddenFilterGroups(page)}
        />

        <div className="min-w-0">
          <ListingsResults
            listings={page.listings}
            mapPoints={page.mapPoints}
            totalCount={page.totalCount}
            currentPage={page.currentPage}
            pageSize={page.pageSize}
            totalPages={page.totalPages}
            viewMode={page.viewMode}
            openOnly={page.openOnly}
            linkValues={page.linkValues}
            headingContext={page.resultsHeadingContext}
          />
        </div>
      </div>
      <div id="seo-landing-client-results-root" />
      <div id="seo-landing-stable-content" className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="hidden lg:block" aria-hidden />
        <div className="min-w-0">
          <GuideSection page={page} />
          <InformationGain page={page} />
          <RelatedLinks groups={page.relatedLinkGroups} />
          <Faqs faqs={page.faqs} />
        </div>
      </div>
    </main>
  );
}

function Breadcrumbs({ items }: { items: SeoPageModel["breadcrumbItems"] }) {
  if (items.length <= 1) return null;

  return (
    <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span key={item.href} className="flex items-center gap-2">
          {index > 0 ? <span>/</span> : null}
          {index === items.length - 1 ? (
            <span>{item.name}</span>
          ) : (
            <Link href={item.href} className="hover:text-primary">
              {item.name}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

function GuideSection({ page }: { page: SeoPageModel }) {
  if (page.kind === "area") return null;

  return (
    <section className="mt-12 rounded-lg border border-line bg-white p-6">
      <SectionHeading title={page.guide.title} copy={page.guide.body} />
    </section>
  );
}

function InformationGain({ page }: { page: SeoPageModel }) {
  if (!page.informationGainBlocks.length) return null;

  return (
    <section className="mt-12 rounded-lg border border-line bg-white p-6" aria-label="Local restaurant insights">
      <h2 className="text-2xl font-bold text-ink">{seoLandingHeadings.sectionTitles.informationGain}</h2>
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        {page.informationGainBlocks.map((block) => (
          <article key={block.title} className="rounded-md bg-slate-50 p-5">
            <h3 className="text-base font-bold text-ink">{block.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{block.body}</p>
            <ul className="mt-4 grid gap-2 text-sm font-semibold text-ink">
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

function RelatedLinks({ groups }: { groups: SeoPageModel["relatedLinkGroups"] }) {
  if (!groups.length) return null;

  return (
    <section className="mt-12 grid gap-6 lg:grid-cols-3" aria-label="Related directory links">
      {groups.map((group) => (
        <section key={group.title} className="rounded-lg border border-line bg-white p-6">
          <h2 className="text-xl font-bold text-ink">{group.title}</h2>
          <div className="mt-5 grid gap-3">
            {group.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-start justify-between gap-3 rounded-md bg-slate-50 px-4 py-3 text-sm font-bold text-ink hover:bg-orange-50 hover:text-accent"
              >
                <span>
                  {link.label}
                  {typeof link.count === "number" ? (
                    <span className="ml-1 font-semibold text-muted">({link.count.toLocaleString()})</span>
                  ) : null}
                </span>
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              </Link>
            ))}
          </div>
        </section>
      ))}
    </section>
  );
}

function Faqs({ faqs }: { faqs: SeoPageModel["faqs"] }) {
  if (!faqs.length) return null;

  return (
    <section className="mt-12 rounded-lg border border-line bg-white p-6">
      <h2 className="text-2xl font-bold text-ink">{seoLandingHeadings.sectionTitles.faqs}</h2>
      <div className="mt-5 divide-y divide-line">
        {faqs.map((faq) => (
          <details key={faq.question} className="py-4">
            <summary className="cursor-pointer text-base font-bold text-ink">{faq.question}</summary>
            <p className="mt-3 text-sm leading-6 text-muted">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function areaScopedHiddenFilterGroups(page: SeoPageModel) {
  return page.kind === "area" ? ["area"] : [];
}

function areaScopedSidebarBlocks(page: SeoPageModel, blocks: ReturnType<typeof buildDirectoryListingsChrome>["sidebarBlocks"]) {
  return page.kind === "area" ? [] : blocks;
}
