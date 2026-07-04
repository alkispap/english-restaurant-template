import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
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
import { FaFacebookF, FaInstagram, FaTiktok, FaWhatsapp, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { GoogleIcon } from "@/components/GoogleIcon";
import { DirectoryImage } from "@/components/DirectoryImage";
import { OpenStatusBadge } from "@/components/OpenStatusBadge";
import { OpeningHoursList } from "@/components/OpeningHoursList";
import { RatingPill } from "@/components/RatingPill";
import { ReviewSummary } from "@/components/ReviewSummary";
import { ListingNav } from "@/components/ListingNav";
import { ListingDetailMobileChrome } from "@/components/ListingDetailMobileChrome";
import { ListingEngagementStats } from "@/components/ListingEngagementStats";
import { ListingGrid } from "@/components/ListingGrid";
import { ShareButton } from "@/components/ShareButton";
import { SaveListingButton } from "@/components/SaveListingButton";
import { ListingPrivateNote } from "@/components/ListingPrivateNote";
import { ListingComments } from "@/components/ListingComments";
import { FactAnswer } from "@/components/FactAnswer";
import { DirectoryAnalyticsTracker } from "@/components/DirectoryAnalyticsTracker";
import { DirectoryFreshnessLabel } from "@/components/DirectoryFreshnessLabel";
import { TrackedActionLink } from "@/components/TrackedActionLink";
import { buildListingEavSummary } from "@/lib/listing-eav-summary";
import { directoryConfig } from "@/config/directory";
import { siteConfig } from "@/config/site";
import { listings } from "@/data/listings";
import { listingSlugRedirects, resolveListingSlugRedirect } from "@/data/listing-slug-redirects";
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
import { areaPath, categoryPath, dietaryPath, directoryIndexPath, directorySearchPath, listingDetailPath, typePath } from "@/lib/routes";
import { localBusinessJsonLd, breadcrumbJsonLd } from "@/lib/structured-data";
import { getListingMapsUrl } from "@/lib/listing-links";
import { getListingExploreLinks } from "@/lib/directory-growth";
import { isDirectoryFeatureEnabled } from "@/lib/directory-features";
import { buildDetailFilterHref, type DetailFilterName } from "@/lib/listing-detail-filter-links";
import { buildListingImageAlt } from "@/lib/listing-image-alt";
import { getSocialPlatform, type SocialPlatformId } from "@/lib/social-platforms";
import { listingShareMetadata } from "@/lib/share-metadata";
import { getListingRobots } from "@/lib/seo-policy";
import { shouldGenerateFullStaticParams } from "@/lib/static-build";
import { listingResultSummaryFromListing } from "@/lib/listings-page";
import { buildListingDetailHeadings, buildListingDetailPageTitle } from "@/lib/listing-detail-headings";

type ListingPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  if (!shouldGenerateFullStaticParams()) return [];

  return [
    ...listings.map((listing) => ({ slug: listing.slug })),
    ...Object.keys(listingSlugRedirects).map((slug) => ({ slug }))
  ];
}

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const redirectTarget = resolveListingSlugRedirect(slug);
  const listing = getListingBySlug(redirectTarget ?? slug);
  if (!listing) return {};

  const title = buildListingDetailPageTitle(listing);
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
    robots: getListingRobots(listing),
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
  const redirectTarget = resolveListingSlugRedirect(slug);
  if (redirectTarget) redirect(listingDetailPath(redirectTarget));

  const listing = getListingBySlug(slug);
  if (!listing) notFound();

  const related = getRelatedListings(listing, 8).map(listingResultSummaryFromListing);
  const gallery = listing.images.slice(0, 3);
  const menuImages = listing.menuImages?.slice(0, 6) ?? [];
  const eavSummary = buildListingEavSummary(listing);
  const visibleFactBlocks = eavSummary.blocks.filter((block) => block.available);
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
  const route = `/${siteConfig.listingBasePath}/${listing.slug}`;
  const headings = buildListingDetailHeadings(listing);

  const breadcrumbs = [
    { name: directoryConfig.listingPluralLabel, href: directoryIndexPath() },
    ...(listing.area ? [{ name: listing.area, href: `/areas/${slugify(listing.area)}` }] : []),
    { name: listing.name, href: `/${siteConfig.listingBasePath}/${listing.slug}` }
  ];

  return (
    <main>
      <ListingNav name={listing.name} tabs={tabs} />
      <ListingDetailMobileChrome listing={listing} tabs={tabs} shareUrl={share.url} route={route} />
      <DirectoryAnalyticsTracker pageType="listing_detail" route={route} listingSlug={listing.slug} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd(listing)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(breadcrumbs)) }}
      />
      <section id="photos" className="scroll-mt-20 bg-white">
        <div className="mx-auto max-w-7xl px-0 py-0 sm:px-6 sm:py-8 lg:px-8">
          <div className="mb-6 hidden flex-wrap items-center gap-2 text-sm text-muted md:flex">
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
              <div className="relative h-[320px] overflow-hidden bg-orange-50 sm:h-[420px] sm:rounded-lg">
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
          <div className="mb-5 hidden flex-wrap items-center gap-3 md:flex">
            {listing.rating ? <RatingPill rating={listing.rating} reviewCount={listing.reviewCount} href="#reviews" /> : null}
            {listing.priceLevel ? (
              <span className="rounded-full bg-orange-50 px-3 py-1 text-sm font-bold text-accent">{listing.priceLevel}</span>
            ) : null}
              {tags.map((tag) => (
                <Link
                  key={tag}
                  href={getListingTagHref(listing, tag)}
                  className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-ink"
                >
                  {tag}
              </Link>
            ))}
          </div>
          {isClosed ? <StatusBanner status={status} /> : null}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <h1 className="hidden text-4xl font-bold text-ink md:block">{headings.h1}</h1>
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
          <DirectoryFreshnessLabel className="mt-3" />
          {listing.description ? <p className="mt-4 max-w-3xl text-lg leading-8 text-muted">{listing.description}</p> : null}
          <ListingPrivateNote slug={listing.slug} />

          <section id="mobile-at-a-glance" className="mt-8 scroll-mt-20 border-y border-line bg-white py-7 md:hidden">
            <h2 className="text-3xl font-extrabold text-ink">At a glance</h2>
            <div className="mt-5 space-y-4">
              <OpenStatusBadge workingHours={listing.details?.workingHours} />
              {listing.fullAddress ? (
                <p className="flex items-start gap-2 text-lg leading-7 text-muted">
                  <MapPin className="mt-1 h-5 w-5 shrink-0 text-ink" aria-hidden />
                  <span>{listing.fullAddress}</span>
                </p>
              ) : null}
              <div className="grid grid-cols-2 gap-3">
                <TrackedActionLink href={listing.contact?.website} label={actionLabels.website} icon={<ExternalLink className="h-4 w-4" />} pageType="listing_detail" action="website_click" route={route} listingSlug={listing.slug} />
                {listing.contact?.phone ? (
                  <TrackedActionLink href={`tel:${listing.contact.phone.replace(/\s+/g, "")}`} label="Call" icon={<Phone className="h-4 w-4" />} pageType="listing_detail" action="phone_click" route={route} listingSlug={listing.slug} />
                ) : null}
                <TrackedActionLink href={getListingMapsUrl(listing)} label="Map" icon={<MapPin className="h-4 w-4" />} pageType="listing_detail" action="maps_click" route={route} listingSlug={listing.slug} />
                <TrackedActionLink href={listing.contact?.googleReviewsUrl ?? "#reviews"} label="Review" icon={<Star className="h-4 w-4" />} pageType="listing_detail" action="reviews_click" route={route} listingSlug={listing.slug} />
              </div>
            </div>
          </section>

          <section id="mobile-location" className="mt-8 scroll-mt-20 md:hidden">
            <h2 className="text-3xl font-extrabold text-ink">Location</h2>
            <a
              href={getListingMapsUrl(listing)}
              target="_blank"
              rel="noreferrer"
              className="mt-5 block overflow-hidden rounded-lg border border-line bg-slate-100"
            >
              <div className="grid min-h-[170px] place-items-center bg-[linear-gradient(135deg,#eef2f7,#dbeafe_48%,#d1fae5)] p-6 text-center">
                <MapPin className="mx-auto h-10 w-10 text-secondary" aria-hidden />
                <p className="mt-3 font-bold text-ink">{listing.fullAddress ?? listing.area ?? listing.name}</p>
              </div>
            </a>
          </section>

          <div className="mt-10 hidden gap-4 md:grid sm:grid-cols-3">
            {listing.area ? (
              <InfoCard
                icon={<MapPin className="h-5 w-5" />}
                label="Area"
                value={listing.area}
                href={areaPath(slugify(listing.area))}
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

          <section id="quick-facts" className="mt-10 scroll-mt-20 rounded-lg border border-line bg-white p-6">
            <h2 className="text-2xl font-bold text-ink">{headings.quickFacts}</h2>
            <div className="mt-5 flex flex-col">
              {visibleFactBlocks.map((block) => (
                <FactAnswer key={block.group} block={block} />
              ))}
            </div>
          </section>

          {menuImages.length ? (
            <section id="menu-photos" className="mt-10 scroll-mt-20 rounded-lg border border-line bg-white p-6">
              <div className="flex items-center gap-2">
                <MenuIcon className="h-5 w-5 text-primary" aria-hidden />
                <h2 className="text-2xl font-bold text-ink">Menu photos</h2>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {menuImages.map((image, index) => (
                  <div key={image} className="relative aspect-[4/3] overflow-hidden rounded-lg bg-orange-50">
                    <DirectoryImage
                      src={image}
                      alt={buildListingImageAlt(listing, { variant: "menu", index })}
                      fill
                      sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                      fallbackLabel="Menu"
                    />
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {hasServiceFeaturesSection ? (
            <div id="services" className="scroll-mt-20">
              <ValueSection title={headings.services}>
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
              <ValueSection title={headings.guestInfo}>
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

          {hasTransportSection ? <TransportSection listing={listing} heading={headings.transport} /> : null}
          {hasNearbySection ? <NearbySection listing={listing} heading={headings.nearby} /> : null}
          <ListingComments slug={listing.slug} heading={headings.comments} />
        </article>

        {hasContactSection ? (
          <aside id="contact" className="hidden h-max scroll-mt-20 rounded-lg border border-line bg-white p-6 shadow-soft md:block">
            <h2 className="text-lg font-bold text-ink">{headings.contact}</h2>
            {listing.fullAddress ? <p className="mt-3 text-sm leading-6 text-muted">{listing.fullAddress}</p> : null}

            <div className="mt-5 grid gap-3">
              <TrackedActionLink href={getListingMapsUrl(listing)} label={actionLabels.googleMaps} icon={<ExternalLink className="h-4 w-4" />} pageType="listing_detail" action="maps_click" route={route} listingSlug={listing.slug} primary />
              <TrackedActionLink href={listing.contact?.googleReviewsUrl} label={actionLabels.googleReviews} icon={<Star className="h-4 w-4" />} pageType="listing_detail" action="reviews_click" route={route} listingSlug={listing.slug} />
              <TrackedActionLink href={listing.contact?.website} label={actionLabels.website} icon={<ExternalLink className="h-4 w-4" />} pageType="listing_detail" action="website_click" route={route} listingSlug={listing.slug} />
              <TrackedActionLink href={listing.contact?.reserveUrl} label={actionLabels.reserve} icon={<CalendarCheck className="h-4 w-4" />} pageType="listing_detail" action="reserve_click" route={route} listingSlug={listing.slug} />
              <TrackedActionLink href={listing.contact?.orderOnlineUrl} label={actionLabels.orderOnline} icon={<ExternalLink className="h-4 w-4" />} pageType="listing_detail" action="order_click" route={route} listingSlug={listing.slug} />
              <TrackedActionLink href={listing.contact?.appointmentUrl} label={actionLabels.appointment} icon={<CalendarCheck className="h-4 w-4" />} pageType="listing_detail" action="appointment_click" route={route} listingSlug={listing.slug} />
              <TrackedActionLink href={listing.contact?.menuUrl} label={actionLabels.menu} icon={<MenuIcon className="h-4 w-4" />} pageType="listing_detail" action="menu_click" route={route} listingSlug={listing.slug} />
              {listing.contact?.phone ? (
                <TrackedActionLink href={`tel:${listing.contact.phone.replace(/\s+/g, "")}`} label={listing.contact.phone} icon={<Phone className="h-4 w-4" />} pageType="listing_detail" action="phone_click" route={route} listingSlug={listing.slug} />
              ) : null}
              {listing.contact?.email ? (
                <TrackedActionLink href={`mailto:${listing.contact.email}`} label={actionLabels.email} icon={<Mail className="h-4 w-4" />} pageType="listing_detail" action="email_click" route={route} listingSlug={listing.slug} />
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
                <p className="mb-3 text-sm font-bold text-ink">Social links</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(listing.contact.socials).map(([label, href]) => {
                    const platform = getSocialPlatform(label, href);
                    const Icon = socialIconByPlatform[platform.id];

                    return (
                      <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={`${listing.name} on ${platform.label}`} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-ink hover:bg-orange-50 hover:text-accent">
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
                <h2 className="text-lg font-bold text-ink">{headings.hours}</h2>
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
            heading={headings.reviews}
          />
        </section>
      )}

      {exploreLinks.length ? (
        <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-line bg-white p-8">
            <h2 className="mb-8 text-2xl font-bold text-ink">{headings.explore}</h2>
            <div className="grid gap-10 md:grid-cols-3">
              {exploreLinks.map((group) => (
                <div key={group.title}>
                  <h3 className="mb-4 text-lg font-bold text-ink">{group.title}</h3>
                  <p className="mb-4 text-sm leading-6 text-muted">{group.description}</p>
                  <div className="grid gap-3">
                    {group.links.map((link) => (
                      <Link key={link.href} href={link.href} className="inline-flex items-center justify-between gap-3 rounded-md bg-slate-50 px-4 py-3 text-sm font-bold text-ink transition hover:bg-orange-50 hover:text-accent">
                        <span className="line-clamp-2">{link.label}</span>
                        <ArrowRight className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {related.length ? (
        <section className="mx-auto max-w-7xl px-4 pb-14 pt-10 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-2xl font-bold text-ink">{headings.similar}</h2>
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

function getListingTagHref(listing: NonNullable<ReturnType<typeof getListingBySlug>>, tag: string) {
  const tagSlug = slugify(tag);

  if (isCategoryTag(tag)) return categoryPath(tagSlug);
  if (listing.dietaryOptions.some((value) => slugify(value) === tagSlug)) return dietaryPath(tagSlug);
  if (listing.listingTypes.some((value) => slugify(value) === tagSlug)) return typePath(tagSlug);

  return directorySearchPath(`?q=${encodeURIComponent(tag)}`);
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

function TransportSection({ listing, heading }: { listing: typeof listings[number]; heading: string }) {
  const tube = listing.location?.tubeStation;
  const bus = listing.location?.busStop;
  if (!tube && !bus) return null;

  return (
    <section id="transport" className="mt-10 scroll-mt-20 rounded-lg border border-line bg-white p-6">
      <h2 className="text-2xl font-bold text-ink">{heading}</h2>
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

function NearbySection({ listing, heading }: { listing: typeof listings[number]; heading: string }) {
  const nearby = listing.location?.nearbyPlaces;
  if (!nearby?.length) return null;

  return (
    <section id="nearby" className="mt-10 scroll-mt-20 rounded-lg border border-line bg-white p-6">
      <h2 className="text-2xl font-bold text-ink">{heading}</h2>
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
  return directorySearchPath(`?${name}=${slugify(value)}`);
}

const socialIconByPlatform: Record<SocialPlatformId, React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = {
  facebook: FaFacebookF,
  instagram: FaInstagram,
  tiktok: FaTiktok,
  youtube: FaYoutube,
  x: FaXTwitter,
  whatsapp: FaWhatsapp,
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
