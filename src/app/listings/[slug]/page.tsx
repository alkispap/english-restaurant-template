import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarCheck,
  CheckCircle2,
  ExternalLink,
  Mail,
  MapPin,
  Menu as MenuIcon,
  Phone,
  Star,
  Train,
  Utensils,
  AlertTriangle,
  Truck,
  Sparkles,
  Heart,
  ShoppingBag,
  UtensilsCrossed,
  ConciergeBell,
  Accessibility,
  Wind,
  Users,
  Calendar,
  CreditCard,
  Baby,
  ParkingCircle,
  Dog,
  ArrowRight
} from "lucide-react";
import { FaFacebookF, FaInstagram, FaTiktok, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { GoogleIcon } from "@/components/GoogleIcon";
import { DirectoryImage } from "@/components/DirectoryImage";
import { OpenStatusBadge } from "@/components/OpenStatusBadge";
import { OpeningHoursList } from "@/components/OpeningHoursList";
import { RatingPill } from "@/components/RatingPill";
import { ReviewSummary } from "@/components/ReviewSummary";
import { ListingNav } from "@/components/ListingNav";
import { ListingEngagementStats } from "@/components/ListingEngagementStats";
import { ListingGrid } from "@/components/ListingGrid";
import { ShareButton } from "@/components/ShareButton";
import { SaveListingButton } from "@/components/SaveListingButton";
import { ListingPrivateNote } from "@/components/ListingPrivateNote";
import { directoryConfig } from "@/config/directory";
import { siteConfig } from "@/config/site";
import { listings } from "@/data/listings";
import { getListingBySlug, getRelatedListings, isCategoryTag, slugify } from "@/lib/directory";
import {
  buildListingDetailTabs,
  hasContact,
  hasGuestInfo,
  hasHours,
  hasNearby,
  hasServiceFeatures,
  hasTransport
} from "@/lib/listing-detail-nav";
import { directoryIndexPath } from "@/lib/routes";
import { localBusinessJsonLd, breadcrumbJsonLd } from "@/lib/structured-data";
import { cleanListingUrl } from "@/lib/listing-links";
import { getListingExploreLinks } from "@/lib/directory-growth";
import { isDirectoryFeatureEnabled } from "@/lib/directory-features";
import { buildDetailFilterHref, type DetailFilterName } from "@/lib/listing-detail-filter-links";
import { buildListingImageAlt } from "@/lib/listing-image-alt";
import { getSocialPlatform, type SocialPlatformId } from "@/lib/social-platforms";
import { listingShareMetadata } from "@/lib/share-metadata";

type ListingPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const listing = getListingBySlug(slug);
  if (!listing) return {};

  const title = listing.metaTitle || listing.name;
  const share = listingShareMetadata(listing);

  return {
    title,
    description: share.description,
    openGraph: {
      title,
      description: share.description,
      type: "website",
      url: share.url,
      images: share.images.map((image) => ({ url: image })),
    },
    alternates: {
      canonical: share.url,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: share.description,
      images: share.images,
    },
  };
}

export default async function ListingPage({ params }: ListingPageProps) {
  const { slug } = await params;
  const listing = getListingBySlug(slug);
  if (!listing) notFound();

  const related = getRelatedListings(listing, 8);
  const gallery = listing.images.slice(0, 3);
  const tags = [...listing.categories, ...listing.listingTypes, ...listing.dietaryOptions];
  const status = listing.businessStatus;
  const isClosed = Boolean(status && status !== "OPERATIONAL");
  const hasHoursSection = hasHours(listing);
  const hasServiceFeaturesSection = isDirectoryFeatureEnabled("serviceDetails") && hasServiceFeatures(listing);
  const hasGuestInfoSection = isDirectoryFeatureEnabled("guestInfoDetails") && hasGuestInfo(listing);
  const hasContactSection = hasContact(listing);
  const hasTransportSection = isDirectoryFeatureEnabled("transport") && hasTransport(listing);
  const hasNearbySection = isDirectoryFeatureEnabled("transport") && hasNearby(listing);
  const tabs = buildListingDetailTabs(listing);
  const exploreLinks = getListingExploreLinks(listing);
  const actionLabels = directoryConfig.actionLabels;
  const detailLabels = directoryConfig.detailLabels;
  const share = listingShareMetadata(listing);

  const breadcrumbs = [
    { name: directoryConfig.listingPluralLabel, href: directoryIndexPath() },
    ...(listing.area ? [{ name: listing.area, href: `/areas/${slugify(listing.area)}` }] : []),
    { name: listing.name, href: `/${siteConfig.listingBasePath}/${listing.slug}` }
  ];

  return (
    <main>
      <ListingNav name={listing.name} tabs={tabs} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd(listing)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(breadcrumbs)) }}
      />
      <section id="photos" className="scroll-mt-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted">
            <Link href={directoryIndexPath()} className="hover:text-primary">
              {directoryConfig.listingPluralLabel}
            </Link>
            {listing.area ? (
              <>
                <span>/</span>
                <Link href={`/areas/${slugify(listing.area)}`} className="hover:text-primary">{listing.area}</Link>
              </>
            ) : null}
          </div>
          {gallery.length ? (
            <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
              <div className="relative h-[420px] overflow-hidden rounded-lg bg-orange-50">
                <DirectoryImage
                  src={gallery[0]}
                  alt={buildListingImageAlt(listing, { variant: "featured", index: 0 })}
                  fill
                  priority
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  className="object-cover"
                  fallbackLabel={listing.imageFallbackLabel}
                />
              </div>
              {gallery.length > 1 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  {gallery.slice(1, 3).map((image, index) => (
                    <div key={image} className="relative h-[202px] overflow-hidden rounded-lg bg-orange-50">
                      <DirectoryImage
                        src={image}
                        alt={buildListingImageAlt(listing, { variant: "gallery", index: index + 1 })}
                        fill
                        sizes="(min-width: 1024px) 33vw, 50vw"
                        className="object-cover"
                        fallbackLabel={listing.imageFallbackLabel}
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="grid min-h-[320px] place-items-center rounded-lg bg-[linear-gradient(135deg,#fff7ed,#fef3c7_55%,#f8fafc)] p-8 text-center">
              <div>
                <Utensils className="mx-auto mb-4 h-12 w-12 text-primary" aria-hidden />
                <p className="text-sm font-bold uppercase tracking-wide text-accent">{listing.imageFallbackLabel}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-8">
        <article id="overview" className="scroll-mt-20">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            {listing.rating ? <RatingPill rating={listing.rating} reviewCount={listing.reviewCount} href="#reviews" /> : null}
            {listing.priceLevel ? (
              <span className="rounded-full bg-orange-50 px-3 py-1 text-sm font-bold text-accent">{listing.priceLevel}</span>
            ) : null}
            {tags.map((tag) => (
              <Link
                key={tag}
                href={isCategoryTag(tag) ? `/categories/${slugify(tag)}` : directoryIndexPath(`?q=${encodeURIComponent(tag)}`)}
                className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-ink"
              >
                {tag}
              </Link>
            ))}
          </div>
          {isClosed ? <StatusBanner status={status} /> : null}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <h1 className="text-4xl font-bold text-ink">{listing.name}</h1>
            <div className="flex flex-wrap gap-2 sm:mt-1">
              {isDirectoryFeatureEnabled("shortlist") ? <SaveListingButton slug={listing.slug} /> : null}
              <ShareButton 
                title={listing.name} 
                text={`Check out ${listing.name} on ${siteConfig.siteName}!`} 
                url={share.url}
              />
            </div>
          </div>
          <ListingEngagementStats slug={listing.slug} />
          {isDirectoryFeatureEnabled("trustBadges") && listing.details?.googleVerified ? (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">
              <GoogleIcon className="h-4 w-4" />
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              {detailLabels.trustBadge}
            </div>
          ) : null}
          <div className="mt-3">
            <OpenStatusBadge workingHours={listing.details?.workingHours} />
          </div>
          {listing.description ? <p className="mt-4 max-w-3xl text-lg leading-8 text-muted">{listing.description}</p> : null}
          <ListingPrivateNote slug={listing.slug} />

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {listing.area ? (
              <InfoCard
                icon={<MapPin className="h-5 w-5" />}
                label="Area"
                value={listing.area}
                href={directoryIndexPath(`?area=${slugify(listing.area)}`)}
              />
            ) : null}
            {listing.rating ? (
              <InfoCard 
                icon={<Star className="h-5 w-5" />} 
                label="Rating" 
                value={`${listing.rating.toFixed(1)} / 5`} 
                href="#reviews"
              />
            ) : null}
            {listing.reviewCount ? (
              <InfoCard 
                icon={<Utensils className="h-5 w-5" />} 
                label="Reviews" 
                value={listing.reviewCount.toLocaleString()} 
                href="#reviews"
              />
            ) : null}
          </div>

          {hasServiceFeaturesSection ? (
            <div id="services" className="scroll-mt-20">
              <ValueSection title={detailLabels.servicesTitle}>
                <PillGroup label={detailLabels.serviceOptions} values={listing.details?.serviceOptions} icon={<Truck className="h-4 w-4" />} filterName="service" area={listing.area} />
                <PillGroup label={detailLabels.highlights} values={listing.details?.highlights} icon={<Sparkles className="h-4 w-4" />} filterName="highlight" area={listing.area} />
                <PillGroup label={detailLabels.popularFor} values={listing.details?.popularFor} icon={<Heart className="h-4 w-4" />} filterName="popularFor" area={listing.area} />
                <PillGroup label={detailLabels.offerings} values={listing.details?.offerings} icon={<ShoppingBag className="h-4 w-4" />} filterName="offering" area={listing.area} />
                <PillGroup label={detailLabels.dining} values={listing.details?.diningOptions} icon={<UtensilsCrossed className="h-4 w-4" />} filterName="dining" area={listing.area} />
                <PillGroup label={detailLabels.amenities} values={listing.details?.amenities} icon={<ConciergeBell className="h-4 w-4" />} filterName="amenity" area={listing.area} />
              </ValueSection>
            </div>
          ) : null}

          {hasGuestInfoSection ? (
            <div id="guest-info" className="scroll-mt-20">
              <ValueSection title={detailLabels.guestInfoTitle}>
                <PillGroup label="Accessibility" values={listing.details?.accessibility} icon={<Accessibility className="h-4 w-4" />} filterName="accessibility" area={listing.area} />
                <PillGroup label="Atmosphere" values={listing.details?.atmosphere} icon={<Wind className="h-4 w-4" />} filterName="atmosphere" area={listing.area} />
                <PillGroup label="Crowd" values={listing.details?.crowd} icon={<Users className="h-4 w-4" />} filterName="crowd" area={listing.area} />
                <PillGroup label="Planning" values={listing.details?.planning} icon={<Calendar className="h-4 w-4" />} filterName="planning" area={listing.area} />
                <PillGroup label="Payments" values={listing.details?.payments} icon={<CreditCard className="h-4 w-4" />} filterName="payment" area={listing.area} />
                <PillGroup label="Children" values={listing.details?.children} icon={<Baby className="h-4 w-4" />} filterName="children" area={listing.area} />
                <PillGroup label="Parking" values={listing.details?.parking} icon={<ParkingCircle className="h-4 w-4" />} filterName="parking" area={listing.area} />
                <PillGroup label="Pets" values={listing.details?.pets} icon={<Dog className="h-4 w-4" />} filterName="pets" area={listing.area} />
              </ValueSection>
            </div>
          ) : null}

          {hasTransportSection ? <TransportSection listing={listing} /> : null}
          {hasNearbySection ? <NearbySection listing={listing} /> : null}
        </article>

        {hasContactSection ? (
          <aside id="contact" className="h-max scroll-mt-20 rounded-lg border border-line bg-white p-6 shadow-soft">
            <h2 className="text-lg font-bold text-ink">Location and contact</h2>
            {listing.fullAddress ? <p className="mt-3 text-sm leading-6 text-muted">{listing.fullAddress}</p> : null}

            <div className="mt-5 grid gap-3">
              <ActionLink href={listing.location?.googleMapsUrl} label={actionLabels.googleMaps} icon={<ExternalLink className="h-4 w-4" />} primary />
              <ActionLink href={listing.contact?.googleReviewsUrl} label={actionLabels.googleReviews} icon={<Star className="h-4 w-4" />} />
              <ActionLink href={listing.contact?.website} label={actionLabels.website} icon={<ExternalLink className="h-4 w-4" />} />
              <ActionLink href={listing.contact?.reserveUrl} label={actionLabels.reserve} icon={<CalendarCheck className="h-4 w-4" />} />
              <ActionLink href={listing.contact?.orderOnlineUrl} label={actionLabels.orderOnline} icon={<ExternalLink className="h-4 w-4" />} />
              <ActionLink href={listing.contact?.appointmentUrl} label={actionLabels.appointment} icon={<CalendarCheck className="h-4 w-4" />} />
              <ActionLink href={listing.contact?.menuUrl} label={actionLabels.menu} icon={<MenuIcon className="h-4 w-4" />} />
              {listing.contact?.phone ? (
                <ActionLink href={`tel:${listing.contact.phone.replace(/\s+/g, "")}`} label={listing.contact.phone} icon={<Phone className="h-4 w-4" />} />
              ) : null}
              {listing.contact?.email ? (
                <ActionLink href={`mailto:${listing.contact.email}`} label={actionLabels.email} icon={<Mail className="h-4 w-4" />} />
              ) : null}
              <div className="mt-2 border-t border-line pt-4">
                <ShareButton 
                  title={listing.name} 
                  text={`Check out ${listing.name} on ${siteConfig.siteName}!`} 
                  url={share.url}
                  className="w-full"
                />
              </div>
            </div>
            {listing.contact?.socials ? (
              <div className="mt-6 border-t border-line pt-5">
                <h3 className="mb-3 text-sm font-bold text-ink">Social links</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(listing.contact.socials).map(([label, href]) => {
                    const platform = getSocialPlatform(label, href);
                    const Icon = socialIconByPlatform[platform.id];

                    return (
                      <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={`${listing.name} on ${platform.label}`} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-ink hover:bg-orange-50 hover:text-accent dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">
                        <Icon className="h-3.5 w-3.5" aria-hidden />
                        {platform.label}
                      </a>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {hasHoursSection ? (
              <div id="hours" className="mt-8 scroll-mt-20 border-t border-line pt-8">
                <h2 className="text-lg font-bold text-ink">Opening hours</h2>
                <OpeningHoursList workingHours={listing.details?.workingHours} />
              </div>
            ) : null}
          </aside>
        ) : null}
      </section>

      {(listing.rating || listing.reviewCount) && (
        <section id="reviews" className="mx-auto max-w-7xl scroll-mt-20 px-4 sm:px-6 lg:px-8">
          <ReviewSummary 
            rating={listing.rating || 0} 
            reviewCount={listing.reviewCount || 0} 
            distribution={listing.reviewDistribution}
          />
        </section>
      )}

      {exploreLinks.length ? (
        <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-line bg-white p-6">
            <h2 className="text-2xl font-bold text-ink">Explore more</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {exploreLinks.map((link) => (
                <Link key={link.href} href={link.href} className="inline-flex items-center justify-between gap-3 rounded-md bg-slate-50 px-4 py-3 text-sm font-bold text-ink hover:bg-orange-50 hover:text-accent">
                  {link.label}
                  <ArrowRight className="h-4 w-4 text-primary" aria-hidden />
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {related.length ? (
        <section className="mx-auto max-w-7xl px-4 pb-14 pt-10 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-2xl font-bold text-ink">Similar listings</h2>
          <ListingGrid listings={related} />
        </section>
      ) : null}
    </main>
  );
}

function InfoCard({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  const content = (
    <>
      <div className="mb-3 text-primary">{icon}</div>
      <div className="text-sm font-semibold text-muted">{label}</div>
      <div className="mt-1 font-bold text-ink">{value}</div>
    </>
  );

  const className = "block rounded-lg border border-line bg-white p-5 transition hover:border-primary hover:bg-orange-50";
  const isExternal = href?.startsWith("http");

  if (href) {
    if (isExternal) {
      return (
        <a href={href} className={className} target="_blank" rel="noreferrer">
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

function StatusBanner({ status }: { status?: string }) {
  if (!status || status === "OPERATIONAL") return null;

  return (
    <div className="mb-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <div>
        <p className="font-bold">{statusLabel(status)}</p>
        <p className="mt-1 text-sm">Check Google Maps or call before visiting.</p>
      </div>
    </div>
  );
}



function ValueSection({ title, children }: { title: string; children: React.ReactNode }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children;
  if (Array.isArray(items) && !items.length) return null;
  if (!items) return null;

  return (
    <section className="mt-10 rounded-lg border border-line bg-white p-6">
      <h2 className="text-2xl font-bold text-ink">{title}</h2>
      <div className="mt-5 grid gap-4">{items}</div>
    </section>
  );
}

function PillGroup({
  label,
  values,
  icon,
  filterName,
  area
}: {
  label: string;
  values?: string[];
  icon?: React.ReactNode;
  filterName?: DetailFilterName;
  area?: string;
}) {
  if (!values?.length) return null;

  const pillClassName =
    "focus-ring rounded-full bg-orange-50 px-3 py-1 text-sm font-semibold text-accent transition hover:bg-orange-100 hover:text-ink";

  return (
    <div>
      <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-muted">
        {icon && <span className="text-primary">{icon}</span>}
        {label}
      </h3>
      <div className="flex flex-wrap gap-2">
        {values.map((value) =>
          filterName ? (
            <Link key={value} href={buildDetailFilterHref(filterName, value, area)} className={pillClassName}>
              {value}
            </Link>
          ) : (
            <span key={value} className={pillClassName}>
              {value}
            </span>
          )
        )}
      </div>
    </div>
  );
}

function TransportSection({ listing }: { listing: typeof listings[number] }) {
  const tube = listing.location?.tubeStation;
  const bus = listing.location?.busStop;
  if (!tube && !bus) return null;

  return (
    <section id="transport" className="mt-10 scroll-mt-20 rounded-lg border border-line bg-white p-6">
      <h2 className="text-2xl font-bold text-ink">{directoryConfig.detailLabels.transportTitle}</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {tube ? (
          <a
            href={transportFilterHref("tube", tube)}
            className="focus-ring block rounded-md bg-slate-100 p-4 transition hover:bg-orange-50 hover:text-accent"
          >
            <Train className="mb-3 h-5 w-5 text-primary" aria-hidden />
            <h3 className="font-bold text-ink">{tube}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              {[listing.location?.tubeLines?.join(", "), distanceText(listing.location?.tubeDistanceMeters), walkText(listing.location?.tubeWalkMinutes)]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </a>
        ) : null}
        {bus ? (
          <a
            href={transportFilterHref("bus", bus)}
            className="focus-ring block rounded-md bg-slate-100 p-4 transition hover:bg-orange-50 hover:text-accent"
          >
            <MapPin className="mb-3 h-5 w-5 text-primary" aria-hidden />
            <h3 className="font-bold text-ink">{bus}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              {[listing.location?.busRoutes?.slice(0, 8).join(", "), distanceText(listing.location?.busDistanceMeters), walkText(listing.location?.busWalkMinutes)]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </a>
        ) : null}
      </div>
    </section>
  );
}

function NearbySection({ listing }: { listing: typeof listings[number] }) {
  const nearby = listing.location?.nearbyPlaces;
  if (!nearby?.length) return null;

  return (
    <section id="nearby" className="mt-10 scroll-mt-20 rounded-lg border border-line bg-white p-6">
      <h2 className="text-2xl font-bold text-ink">{directoryConfig.detailLabels.nearbyTitle}</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {nearby.map((place) => (
          <a
            key={`${place.label}-${place.name}`}
            href={transportFilterHref("nearby", place.name)}
            className="focus-ring block rounded-md bg-slate-100 px-4 py-3 transition hover:bg-orange-50 hover:text-accent"
          >
            <div className="text-xs font-bold uppercase tracking-wide text-primary">{place.label}</div>
            <div className="mt-1 font-semibold text-ink">{place.name}</div>
            {place.distanceMeters ? <div className="mt-1 text-sm text-muted">{distanceText(place.distanceMeters)}</div> : null}
          </a>
        ))}
      </div>
    </section>
  );
}

function transportFilterHref(name: "tube" | "bus" | "nearby", value: string) {
  return directoryIndexPath(`?${name}=${slugify(value)}`);
}

function ActionLink({ href, label, icon, primary = false }: { href?: string; label: string; icon: React.ReactNode; primary?: boolean }) {
  const safeHref = cleanListingUrl(href);
  if (!safeHref) return null;

  return (
    <a
      href={safeHref}
      target={safeHref.startsWith("http") ? "_blank" : undefined}
      rel={safeHref.startsWith("http") ? "noreferrer" : undefined}
      className={`focus-ring inline-flex items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-bold ${
        primary ? "bg-primary text-white" : "border border-line text-ink"
      }`}
    >
      {label} {icon}
    </a>
  );
}

const socialIconByPlatform: Record<SocialPlatformId, React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = {
  facebook: FaFacebookF,
  instagram: FaInstagram,
  tiktok: FaTiktok,
  youtube: FaYoutube,
  x: FaXTwitter,
  external: ExternalLink
};

function distanceText(value?: number) {
  return value ? `${value.toLocaleString()}m` : "";
}

function walkText(value?: number) {
  return value ? `${value} min walk` : "";
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    OPERATIONAL: "Open",
    CLOSED_TEMPORARILY: "Temporarily closed",
    CLOSED_PERMANENTLY: "Permanently closed"
  };
  return labels[status] ?? status.replaceAll("_", " ").toLowerCase();
}
