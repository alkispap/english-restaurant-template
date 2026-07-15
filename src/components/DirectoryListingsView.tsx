import Link from "next/link";
import { AdsterraAd } from "@/components/AdsterraAd";
import { DirectoryListingRows } from "@/components/DirectoryListingRows";
import { DirectoryFreshnessLabel } from "@/components/DirectoryFreshnessLabel";
import { DirectoryImage } from "@/components/DirectoryImage";
import { ListingsResults } from "@/components/ListingsResults";
import { ResponsiveDirectoryFilters } from "@/components/ResponsiveDirectoryFilters";
import { SearchBar } from "@/components/SearchBar";
import { siteConfig } from "@/config/site";
import { homepageHeadings } from "@/lib/homepage-headings";
import type { DirectoryListingsModel } from "@/lib/directory-listings-types";
import type { DirectoryListingRowSummary } from "@/lib/listings-page";
import { directorySearchPath } from "@/lib/routes";

type DirectoryListingsViewProps = {
  model: DirectoryListingsModel;
  viewId?: string;
};

export function DirectoryListingsView({ model, viewId }: DirectoryListingsViewProps) {
  const isHomepage = model.basePath === "/";
  const isCleanHomepage = isHomepage && !model.searchQuery;
  const searchBasePath = isCleanHomepage ? directorySearchPath() : model.basePath;
  const homepageSearch = (
    <SearchBar
      compact
      defaultQuery={model.filters.q}
      defaultArea={first(model.filters.area)}
      basePath={searchBasePath}
      areas={model.searchAreas}
      areaCentroids={model.searchMapPoints.map((point) => ({
        slug: point.slug,
        name: point.name,
        area: point.area,
        latitude: point.latitude,
        longitude: point.longitude
      }))}
    />
  );

  return (
    <main id={viewId} className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {isHomepage ? (
        <>
          <section
            className="relative mb-4 overflow-hidden rounded-lg bg-ink shadow-soft sm:mb-8"
          >
            <picture className="absolute inset-0">
              <source media="(max-width: 639px)" srcSet={siteConfig.heroImageMobile} />
              <img
                src={siteConfig.heroImage}
                alt={siteConfig.heroImageAlt}
                width={1280}
                height={720}
                className="h-full w-full object-cover object-center"
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
            </picture>
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(31,19,13,0.58)_0%,rgba(31,19,13,0.46)_42%,rgba(31,19,13,0.78)_100%)] sm:bg-[linear-gradient(90deg,rgba(31,19,13,0.92)_0%,rgba(31,19,13,0.82)_34%,rgba(31,19,13,0.28)_58%,rgba(31,19,13,0.04)_100%)]" />
            <div className="relative flex min-h-[430px] items-start px-6 py-8 sm:min-h-[520px] sm:items-center sm:px-8 lg:px-12">
              <div className="w-full max-w-xl">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-orange-200 sm:text-sm">{siteConfig.heroEyebrow}</p>
                <h1 className="mt-3 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">{model.title}</h1>
                <p className="mt-4 max-w-lg text-sm leading-6 text-orange-50 sm:text-base">{model.description}</p>
                <DirectoryFreshnessLabel className="mt-4 text-orange-50" />
                <div className="mt-7 hidden sm:block">
                  {homepageSearch}
                </div>
                <div className="hidden sm:block">
                  {isCleanHomepage ? <HomepageQuickLinks /> : null}
                </div>
              </div>
            </div>
          </section>
          <div className="mb-8 sm:hidden">
            {homepageSearch}
            {isCleanHomepage ? <HomepageQuickLinks tone="light" /> : null}
          </div>
        </>
      ) : (
        <section className="mb-6 max-w-3xl">
          <h1 className="text-3xl font-bold leading-tight text-ink sm:text-4xl">{model.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{model.description}</p>
          <div className="mt-5">
            {homepageSearch}
          </div>
        </section>
      )}
      <div className="mb-8 hidden justify-center lg:flex">
        <AdsterraAd placement="728x90" />
      </div>
      <div className="mb-6 flex justify-center lg:hidden">
        <AdsterraAd placement="320x50" />
      </div>
      {isCleanHomepage ? (
        <>
          <HomepageDiscoveryCards />
          <div className="mt-8 hidden justify-center lg:flex">
            <AdsterraAd placement="468x60" />
          </div>
          <DirectoryListingRows rows={homepageStartRows(model.relatedRows)} className="mt-6" />
        </>
      ) : (
      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <ResponsiveDirectoryFilters model={model} />
        <div className="min-w-0">
          <ListingsResults
            listings={model.listings}
            mapPoints={model.mapPoints}
            totalCount={model.totalCount}
            currentPage={model.currentPage}
            pageSize={model.pageSize}
            totalPages={model.totalPages}
            viewMode={model.viewMode}
            openOnly={model.openOnly}
            linkValues={model.linkValues}
            headingContext={model.headingContext}
          />
          <SourceContextGuide guide={model.sourceContextGuide} />
          <DirectoryListingRows rows={model.relatedRows} className="mt-12" />
        </div>
      </div>
      )}
    </main>
  );
}

function HomepageQuickLinks({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const links = [
    { label: "Open now", href: directorySearchPath("?open=1") },
    { label: "Best rated", href: directorySearchPath("?sort=rating") },
    { label: "Takeaway", href: "/services/takeaway" },
    { label: "Halal", href: "/dietary/halal" }
  ];
  const linkClass =
    tone === "dark"
      ? "focus-ring rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-sm font-bold text-white transition hover:bg-white hover:text-ink"
      : "focus-ring rounded-full border border-line bg-white px-3 py-1.5 text-sm font-bold text-ink shadow-sm transition hover:border-primary hover:text-primary";

  return (
    <nav className="mt-4 flex flex-wrap gap-2" aria-label="Popular restaurant filters">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={linkClass}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

function HomepageDiscoveryCards() {
  const cards = [
    {
      title: homepageHeadings.discoveryCardTitles.area,
      copy: "Start with London neighbourhoods and local hubs.",
      href: "/areas",
      image: "/images/homepage/discovery-area.webp",
      imageAlt: "London street with Indian restaurants for browsing by area"
    },
    {
      title: homepageHeadings.discoveryCardTitles.category,
      copy: "Narrow the directory by cuisine and restaurant style.",
      href: "/categories",
      image: "/images/homepage/discovery-cuisines.webp",
      imageAlt: "Indian dishes showing different cuisines and restaurant styles"
    },
    {
      title: homepageHeadings.discoveryCardTitles.takeaway,
      copy: "Find Indian restaurants set up for takeaway orders.",
      href: "/services/takeaway",
      image: "/images/homepage/discovery-takeaway.webp",
      imageAlt: "Indian takeaway containers ready for collection"
    },
    {
      title: homepageHeadings.discoveryCardTitles.halal,
      copy: "Explore restaurants with halal-friendly details.",
      href: "/dietary/halal",
      image: "/images/homepage/discovery-halal.webp",
      imageAlt: "Halal-friendly Indian restaurant table with shared dishes"
    },
    {
      title: homepageHeadings.discoveryCardTitles.vegetarian,
      copy: "Compare places with vegetarian options.",
      href: "/dietary/vegetarian",
      image: "/images/homepage/discovery-vegetarian.webp",
      imageAlt: "Vegetarian Indian thali with colourful vegetable dishes"
    },
    {
      title: homepageHeadings.discoveryCardTitles.bestRated,
      copy: "Jump to restaurants sorted by strong review signals.",
      href: directorySearchPath("?sort=rating"),
      image: "/images/homepage/discovery-best-rated.webp",
      imageAlt: "Highly rated Indian restaurant table with polished dishes"
    }
  ];

  return (
    <section className="mt-10">
      <div className="mb-5 max-w-2xl">
        <h2 className="text-2xl font-bold text-ink">{homepageHeadings.discoveryTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Use these visual shortcuts to start with the most common restaurant decisions.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            data-homepage-discovery-card="true"
            className="group overflow-hidden rounded-lg border border-line bg-white shadow-soft transition hover:-translate-y-0.5 hover:border-primary"
          >
            <div className="relative h-36 bg-orange-50">
              <DirectoryImage
                src={card.image}
                alt={card.imageAlt}
                fallbackLabel={card.title}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/72 via-ink/10 to-transparent" />
            </div>
            <div className="p-4">
              <h3 className="text-base font-bold text-ink group-hover:text-accent">{card.title}</h3>
              <p className="mt-1 text-sm leading-6 text-muted">{card.copy}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function homepageStartRows(rows: DirectoryListingRowSummary[]) {
  const startRow = rows[0];
  if (!startRow) return [];

  return [
    {
      ...startRow,
      title: homepageHeadings.startRowTitle,
      copy: "A small set of high-signal listings before visitors continue into the full directory."
    }
  ];
}

function SourceContextGuide({ guide }: { guide: DirectoryListingsModel["sourceContextGuide"] }) {
  if (!guide) return null;

  return (
    <section className="mt-10 rounded-lg border border-line bg-slate-50 p-5">
      <h2 className="text-lg font-bold text-ink">{guide.title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{guide.intro}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {guide.points.map((point) => (
          <div key={point.title} className="text-sm leading-6 text-muted">
            <h3 className="font-bold text-ink">{point.title}</h3>
            <p className="mt-1">{point.copy}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
