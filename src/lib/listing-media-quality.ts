import type { Listing } from "@/data/listings";
import {
  isApprovedListingMediaAsset,
  listingMediaUsages,
  type ListingMediaAsset,
  type ListingMediaRegistry
} from "@/lib/listing-media-provenance";

export type ListingMediaQualityIssue = {
  severity: "critical" | "high" | "medium" | "low";
  code: string;
  count: number;
  impact: string;
  recommendation: string;
  samples: string[];
};

export type ListingImagePriority = {
  slug: string;
  name: string;
  area?: string;
  rating?: number;
  reviewCount?: number;
  score: number;
  reason: string;
};

export type ListingMediaQualityReport = {
  generatedAt: string;
  verdict: "pass" | "not_ready";
  totals: {
    listings: number;
    listingsWithGalleryImages: number;
    listingsWithApprovedGalleryImages: number;
    priorityListings: number;
    priorityListingsWithApprovedGalleryImages: number;
    galleryUrls: number;
    logoUrls: number;
    menuUrls: number;
    uniqueDisplayUrls: number;
    registryUrls: number;
    quarantinedUrls: number;
    registeredUrls: number;
    approvedUrls: number;
    unknownRightsUrls: number;
    unregisteredUrls: number;
    orphanRegistryUrls: number;
  };
  domains: Array<{ domain: string; count: number }>;
  issues: ListingMediaQualityIssue[];
  enrichmentPriority: ListingImagePriority[];
};

export function auditListingMediaQuality(
  listings: Listing[],
  registry: ListingMediaRegistry,
  generatedAt = new Date().toISOString()
): ListingMediaQualityReport {
  const registryByUrl = new Map(registry.assets.map((asset) => [asset.url, asset]));
  const listingBySlug = new Map(listings.map((listing) => [listing.slug, listing]));
  const usages = listings.flatMap((listing) =>
    listingMediaUsages(listing).map((usage) => ({ ...usage, listingSlug: listing.slug }))
  );
  const uniqueDisplayUrls = new Set(usages.map((usage) => usage.url));
  const registeredUrls = [...uniqueDisplayUrls].filter((url) => registryByUrl.has(url));
  const approvedUrls = registeredUrls.filter((url) => isApprovedListingMediaAsset(registryByUrl.get(url)!));
  const unknownRightsUrls = registeredUrls.filter((url) => registryByUrl.get(url)?.rightsStatus === "unknown");
  const unregisteredUrls = [...uniqueDisplayUrls].filter((url) => !registryByUrl.has(url));
  const orphanRegistryUrls = registry.assets.filter((asset) => asset.publicationStatus === "published" && !uniqueDisplayUrls.has(asset.url));
  const listingsWithApprovedGalleryImages = listings.filter((listing) => hasApprovedGalleryImage(listing, registryByUrl));
  const rankedListings = prioritizeListings(listings);
  const enrichmentPriority = rankedListings.filter((listing) => {
    const source = listingBySlug.get(listing.slug)!;
    return !hasApprovedGalleryImage(source, registryByUrl);
  });
  const priorityCount = Math.min(100, listings.length);
  const priorityMissing = rankedListings.slice(0, priorityCount).filter((listing) => {
    const source = listingBySlug.get(listing.slug)!;
    return !hasApprovedGalleryImage(source, registryByUrl);
  });
  const longTailMissing = rankedListings.slice(priorityCount).filter((listing) => {
    const source = listingBySlug.get(listing.slug)!;
    return !hasApprovedGalleryImage(source, registryByUrl);
  });
  const issues: ListingMediaQualityIssue[] = [];

  addIssue(issues, "critical", "unregistered_display_media", unregisteredUrls,
    "Published media has no source record, so its origin and rights cannot be audited.",
    "Register every displayed URL before it can be published.");
  addIssue(issues, "high", "unapproved_media_rights", unknownRightsUrls,
    "Source origin is known, but reuse permission, licence terms, and attribution duties are not established.",
    "Replace the asset or attach non-secret rights evidence and any required licence/attribution metadata.");
  addIssue(issues, "high", "missing_approved_priority_gallery_image", priorityMissing.map((listing) => listing.slug),
    "The launch-priority cohort lacks legally approved gallery media and must rely entirely on fallbacks.",
    "Clear at least one suitable gallery image for each of the top 100 value-proxy listings before launch.");
  addIssue(issues, "medium", "missing_approved_long_tail_gallery_image", longTailMissing.map((listing) => listing.slug),
    "Long-tail listings rely on the designed fallback instead of an approved business image.",
    "Enrich progressively after launch using rights-cleared sources; do not bypass the registry for coverage.");
  addIssue(issues, "medium", "orphan_media_registry_entry", orphanRegistryUrls.map((asset) => asset.url),
    "The registry contains media that is no longer displayed, which can obscure the active rights inventory.",
    "Review and archive orphan entries after confirming no historical redirect or pending edit still needs them.");

  return {
    generatedAt,
    verdict: issues.some((issue) => issue.severity === "critical" || issue.severity === "high") ? "not_ready" : "pass",
    totals: {
      listings: listings.length,
      listingsWithGalleryImages: listings.filter((listing) => listing.images.length > 0).length,
      listingsWithApprovedGalleryImages: listingsWithApprovedGalleryImages.length,
      priorityListings: priorityCount,
      priorityListingsWithApprovedGalleryImages: priorityCount - priorityMissing.length,
      galleryUrls: usages.filter((usage) => usage.kind === "gallery").length,
      logoUrls: usages.filter((usage) => usage.kind === "logo").length,
      menuUrls: usages.filter((usage) => usage.kind === "menu").length,
      uniqueDisplayUrls: uniqueDisplayUrls.size,
      registryUrls: registry.assets.length,
      quarantinedUrls: registry.assets.filter((asset) => asset.publicationStatus === "quarantined").length,
      registeredUrls: registeredUrls.length,
      approvedUrls: approvedUrls.length,
      unknownRightsUrls: unknownRightsUrls.length,
      unregisteredUrls: unregisteredUrls.length,
      orphanRegistryUrls: orphanRegistryUrls.length
    },
    domains: [...countBy(registry.assets, (asset) => domain(asset.url)).entries()]
      .map(([value, count]) => ({ domain: value, count })).sort((a, b) => b.count - a.count),
    issues,
    enrichmentPriority: enrichmentPriority.slice(0, 50)
  };
}

export function renderListingMediaQualityReport(report: ListingMediaQualityReport) {
  const lines = [
    "# Listing Media Quality Audit",
    "",
    `- Generated: ${report.generatedAt}`,
    `- Verdict: ${report.verdict}`,
    `- Listings: ${report.totals.listings.toLocaleString("en-GB")}`,
    `- Display URLs: ${report.totals.uniqueDisplayUrls.toLocaleString("en-GB")}`,
    `- Registry URLs: ${report.totals.registryUrls.toLocaleString("en-GB")}`,
    `- Quarantined URLs: ${report.totals.quarantinedUrls.toLocaleString("en-GB")}`,
    `- Registered origin: ${report.totals.registeredUrls.toLocaleString("en-GB")}`,
    `- Rights-approved URLs: ${report.totals.approvedUrls.toLocaleString("en-GB")}`,
    `- Listings with approved gallery images: ${report.totals.listingsWithApprovedGalleryImages.toLocaleString("en-GB")}`,
    `- Launch-priority listings with approved gallery images: ${report.totals.priorityListingsWithApprovedGalleryImages}/${report.totals.priorityListings}`,
    "",
    "## Findings",
    "",
    "| Severity | Code | Count | Samples |",
    "| --- | --- | ---: | --- |",
    ...report.issues.map((issue) => `| ${issue.severity} | ${issue.code} | ${issue.count.toLocaleString("en-GB")} | ${issue.samples.join(", ")} |`),
    "",
    "## Source domains",
    "",
    "| Domain | URLs |",
    "| --- | ---: |",
    ...report.domains.map((item) => `| ${item.domain} | ${item.count.toLocaleString("en-GB")} |`),
    "",
    "## Priority listings for rights-cleared gallery images",
    "",
    "The score is a transparent value proxy, not measured traffic: featured status + capped log review volume + rating + data/action completeness.",
    "",
    "| Rank | Listing | Area | Rating | Reviews | Score |",
    "| ---: | --- | --- | ---: | ---: | ---: |",
    ...report.enrichmentPriority.slice(0, 25).map((item, index) =>
      `| ${index + 1} | ${item.slug} | ${item.area ?? ""} | ${item.rating ?? ""} | ${item.reviewCount ?? ""} | ${item.score} |`
    ),
    ""
  ];
  return `${lines.join("\n")}\n`;
}

function prioritizeListings(listings: Listing[]) {
  return listings
    .map((listing) => {
      const reviewScore = Math.round(Math.log10((listing.reviewCount ?? 0) + 1) * 20);
      const ratingScore = Math.round((listing.rating ?? 0) * 4);
      const featuredScore = listing.featured ? 100 : 0;
      const completenessScore = Number(Boolean(listing.categories.length)) * 5 +
        Number(Boolean(listing.contact?.phone || listing.contact?.website || listing.location?.googleMapsUrl)) * 5;
      const score = featuredScore + reviewScore + ratingScore + completenessScore;
      return {
        slug: listing.slug,
        name: listing.name,
        area: listing.area,
        rating: listing.rating,
        reviewCount: listing.reviewCount,
        score,
        reason: `featured ${featuredScore}; reviews ${reviewScore}; rating ${ratingScore}; completeness ${completenessScore}`
      };
    })
    .sort((a, b) => b.score - a.score || (b.reviewCount ?? 0) - (a.reviewCount ?? 0) || a.slug.localeCompare(b.slug));
}

function hasApprovedGalleryImage(listing: Listing, registryByUrl: Map<string, ListingMediaAsset>) {
  return listing.images.some((url) => {
    const asset = registryByUrl.get(url);
    return Boolean(asset && asset.publicationStatus === "published" && isApprovedListingMediaAsset(asset));
  });
}

function addIssue(
  issues: ListingMediaQualityIssue[],
  severity: ListingMediaQualityIssue["severity"],
  code: string,
  affected: string[],
  impact: string,
  recommendation: string
) {
  if (!affected.length) return;
  issues.push({ severity, code, count: affected.length, impact, recommendation, samples: affected.slice(0, 5) });
}

function countBy<T>(items: T[], key: (item: T) => string) {
  const counts = new Map<string, number>();
  items.forEach((item) => counts.set(key(item), (counts.get(key(item)) ?? 0) + 1));
  return counts;
}

function domain(value: string) {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return "invalid";
  }
}
