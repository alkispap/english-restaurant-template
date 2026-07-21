import { ArrowRight, MapPin, Star } from "lucide-react";
import Link from "next/link";
import { DirectoryFreshnessLabel } from "@/components/DirectoryFreshnessLabel";
import { DirectoryImage } from "@/components/DirectoryImage";
import { SearchBar } from "@/components/SearchBar";
import { siteConfig } from "@/config/site";
import {
  getDirectoryLandingModel,
  type DirectoryLandingCard,
  type DirectoryLandingLink,
  type DirectoryLandingRestaurantRow
} from "@/lib/directory-landing";

export function DirectoryLandingPage() {
  const model = getDirectoryLandingModel();

  return (
    <main className="directory-home">
      <section className="home-hero relative overflow-hidden bg-ink">
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
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(31,19,13,0.62)_0%,rgba(31,19,13,0.52)_45%,rgba(31,19,13,0.84)_100%)]" />
        <div className="relative mx-auto flex min-h-[430px] max-w-7xl items-end px-4 py-8 sm:min-h-[520px] sm:px-6 lg:px-8">
          <div className="w-full max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-orange-200 sm:text-sm">{siteConfig.heroEyebrow}</p>
            <h1 className="mt-3 text-3xl font-bold leading-tight text-white sm:text-5xl">{model.hero.title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-orange-50 sm:text-base">{model.hero.description}</p>
            <DirectoryFreshnessLabel className="mt-4 text-orange-50" />
            <div className="mt-7">
              <SearchBar
                compact
                basePath={model.hero.searchBasePath}
                areas={model.hero.searchAreas}
                areaCentroids={model.hero.searchMapPoints}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="home-band home-band--ivory home-band--ornament">
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="home-summary mb-10 max-w-4xl text-base leading-7 text-ink">{model.summary}</p>
          <LandingCardSection section={model.primaryNeeds} columns="four" variant="ivory" />
        </div>
      </div>

      <div className="home-band home-band--ivory home-band--hubs">
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <LandingCardSection section={model.diningHubs} columns="five" variant="ivory" />
        </div>
      </div>

      <div className="home-band home-band--plain">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <section className="home-section home-section--plain" aria-label="Best rated restaurants">
            {model.restaurantRows.map((row) => (
              <RestaurantRow key={row.id} row={row} />
            ))}
          </section>
        </div>
      </div>

      <div className="home-band home-band--pale-green">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <LandingCardSection section={model.serviceNeeds} variant="pale-green" />
        </div>
      </div>

      <div className="home-band home-band--ivory home-band--botanical">
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <RegionLinksSection section={model.regionLinks} />
        </div>
      </div>

      <section className="home-cta-band">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:px-6 lg:px-8">
          <div>
            <span className="home-heading-accent home-heading-accent--light" aria-hidden />
            <h2 className="text-2xl font-bold text-white">{model.finalCta.title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-green-50">{model.finalCta.description}</p>
          </div>
          <Link
            href={model.finalCta.href}
            className="focus-ring mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-800 sm:mt-0"
          >
            {model.finalCta.label}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>
    </main>
  );
}

function RegionLinksSection({
  section,
  className = ""
}: {
  section: { title: string; description: string; items: DirectoryLandingLink[] };
  className?: string;
}) {
  if (!section.items.length) return null;

  const headingId = `${slugId(section.title)}-heading`;

  return (
    <section className={`home-section home-section--ivory ${className}`} aria-labelledby={headingId}>
      <SectionIntro id={headingId} title={section.title} description={section.description} />
      <ul className="home-region-list mt-5 grid border-y sm:grid-cols-2 lg:grid-cols-5">
        {section.items.map((item) => (
          <li key={item.href} className="border-line lg:border-r lg:last:border-r-0">
            <Link
              href={item.href}
              className="home-region-link group flex min-h-20 items-center justify-between gap-3 px-4 py-4 transition"
            >
              <span>
                <span className="block text-sm font-bold text-ink group-hover:text-accent">{item.title}</span>
                <span className="mt-1 block text-xs text-muted">{item.count.toLocaleString()} listings</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function LandingCardSection({
  section,
  className = "",
  columns = "three",
  variant = "plain"
}: {
  section: { title: string; description: string; items: DirectoryLandingCard[] };
  className?: string;
  columns?: "three" | "four" | "five";
  variant?: "ivory" | "plain" | "pale-green";
}) {
  if (!section.items.length) return null;

  return (
    <section className={`home-section home-section--${variant} ${className}`} aria-labelledby={`${slugId(section.title)}-heading`}>
      <SectionIntro id={`${slugId(section.title)}-heading`} title={section.title} description={section.description} />
      <div
        className={`mt-5 grid gap-4 sm:grid-cols-2 ${
          columns === "five" ? "lg:grid-cols-5" : columns === "four" ? "lg:grid-cols-4" : "lg:grid-cols-3"
        }`}
      >
        {section.items.map((item) => (
          <ImageCard key={item.href} item={item} />
        ))}
      </div>
      <PhotoCredits items={section.items} />
    </section>
  );
}

function ImageCard({ item }: { item: DirectoryLandingCard }) {
  return (
    <Link
      href={item.href}
      className="home-discovery-card group overflow-hidden rounded-lg border bg-white shadow-soft transition hover:-translate-y-0.5"
    >
      <div className="relative h-36 bg-orange-50">
        <DirectoryImage
          src={item.image}
          alt={item.imageAlt}
          fallbackLabel="Photo unavailable"
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-bold leading-6 text-ink group-hover:text-accent">{item.title}</h3>
          <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden />
        </div>
        {item.description ? <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p> : null}
      </div>
    </Link>
  );
}

function RestaurantRow({ row }: { row: DirectoryLandingRestaurantRow }) {
  return (
    <div>
      <SectionIntro title={row.title} description={row.description} href={row.seeAllHref} label="See all" />
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {row.items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="home-restaurant-card group overflow-hidden rounded-lg border border-line bg-white shadow-soft transition hover:-translate-y-0.5 hover:border-primary"
          >
            <div className="relative h-36 bg-orange-50">
              <DirectoryImage
                src={item.image}
                alt={item.imageAlt}
                fallbackLabel="Photo unavailable"
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition duration-300 group-hover:scale-105"
              />
            </div>
            <div className="p-4">
              <h3 className="text-base font-bold leading-6 text-ink group-hover:text-accent">{item.name}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold uppercase text-muted">
                {item.area ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    {item.area}
                  </span>
                ) : null}
                {typeof item.rating === "number" ? (
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-primary text-primary" aria-hidden />
                    {item.rating.toFixed(1)}
                    {typeof item.reviewCount === "number" ? ` (${item.reviewCount.toLocaleString()})` : ""}
                  </span>
                ) : null}
                {item.priceLevel ? <span>{item.priceLevel}</span> : null}
              </div>
              {item.description ? <p className="mt-2 text-sm leading-6 text-muted">{trimText(item.description, 120)}</p> : null}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function PhotoCredits({ items }: { items: DirectoryLandingCard[] }) {
  const credits = items.flatMap((item) => (item.imageCredit ? [item.imageCredit] : []));
  if (!credits.length) return null;

  return (
    <details className="home-photo-credits mt-4 text-xs leading-5 text-muted">
      <summary className="focus-ring w-fit cursor-pointer rounded-sm font-bold text-ink hover:text-accent">
        Photo credits
      </summary>
      <ul className="mt-3 grid gap-2 border-l border-line pl-4">
        {credits.map((credit) => (
          <li key={credit.sourceUrl}>
            <a href={credit.sourceUrl} className="underline decoration-line/70 underline-offset-2 hover:text-accent">
              {credit.title}
            </a>{" "}
            by {credit.author} (
            <a href={credit.licenseUrl} className="underline decoration-line/70 underline-offset-2 hover:text-accent">
              {credit.licenseLabel}
            </a>
            , {credit.note})
          </li>
        ))}
      </ul>
    </details>
  );
}

function SectionIntro({
  id,
  title,
  description,
  href,
  label
}: {
  id?: string;
  title: string;
  description: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        <span className="home-heading-accent" aria-hidden />
        <h2 id={id} className="text-2xl font-bold text-ink">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-strong">{description}</p>
      </div>
      {href && label ? (
        <Link href={href} className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-accent">
          {label}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}

function slugId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function trimText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trim()}...`;
}
