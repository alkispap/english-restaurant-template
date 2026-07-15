import type { Listing } from "@/data/listings";

export type ListingQualitySeverity = "critical" | "high" | "medium" | "low";

export type ListingQualityIssue = {
  code: string;
  severity: ListingQualitySeverity;
  count: number;
  rate: number;
  samples: string[];
  impact: string;
  recommendation: string;
};

export type ListingOperationalQualityReport = {
  generatedAt: string;
  grain: "one row per restaurant location";
  totalListings: number;
  coverage: Record<string, { count: number; rate: number }>;
  issues: ListingQualityIssue[];
  totals: Record<ListingQualitySeverity, number>;
  verdict: "not_ready" | "conditional" | "pass";
};

const LONDON_BOUNDS = {
  minLatitude: 51.2,
  maxLatitude: 51.75,
  minLongitude: -0.55,
  maxLongitude: 0.35
};

export function auditListingOperationalQuality(listings: Listing[]): ListingOperationalQualityReport {
  const issues: ListingQualityIssue[] = [];
  const total = listings.length;
  const withCoreLocation = listings.filter(hasCoreLocation);
  const withCoordinates = listings.filter(hasCoordinatePair);
  const withContactAction = listings.filter(hasContactAction);
  const withRatingAndReviews = listings.filter(hasRatingAndReviews);
  const withProvenance = listings.filter(hasCompleteProvenance);

  addMissingIssue(issues, listings, "name", "critical", (listing) => clean(listing.name),
    "A restaurant route cannot be identified or presented reliably.",
    "Reject imports without a non-empty restaurant name.");
  addMissingIssue(issues, listings, "slug", "critical", (listing) => clean(listing.slug),
    "Canonical URLs and route generation become ambiguous.",
    "Reject imports without a stable unique slug.");

  addDuplicateIssue(issues, listings, "duplicate_slugs", "critical", (listing) => clean(listing.slug).toLowerCase(),
    "Two records would compete for the same canonical route.",
    "Resolve slug collisions before generating pages.");
  addDuplicateIssue(issues, listings, "duplicate_place_ids", "critical", (listing) => clean(listing.details?.placeId).toLowerCase(),
    "The same upstream business entity appears more than once.",
    "Merge or explicitly separate duplicate source entities before import.");
  addDuplicateIssue(
    issues,
    listings,
    "possible_duplicate_name_postcode",
    "high",
    (listing) => {
      const name = normalizeText(listing.name);
      const postcode = clean(listing.postcode).replace(/\s+/g, "").toLowerCase();
      return name && postcode ? `${name}|${postcode}` : "";
    },
    "Separate pages may describe the same physical restaurant and split trust/SEO signals.",
    "Review each group manually; merge true duplicates and preserve redirects from retired slugs."
  );

  const invalidCoordinates = listings.filter((listing) => {
    const latitude = listing.location?.latitude;
    const longitude = listing.location?.longitude;
    if ((latitude === undefined) !== (longitude === undefined)) return true;
    if (latitude === undefined || longitude === undefined) return false;
    return !Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180;
  });
  addIssue(issues, listings, invalidCoordinates, "invalid_coordinate_pair", "critical",
    "Maps, distance filters, and LocalBusiness structured data can be wrong or fail.",
    "Require either a valid latitude/longitude pair or neither value.");

  const outsideLondon = listings.filter((listing) => {
    if (!hasCoordinatePair(listing)) return false;
    const latitude = listing.location!.latitude!;
    const longitude = listing.location!.longitude!;
    return latitude < LONDON_BOUNDS.minLatitude || latitude > LONDON_BOUNDS.maxLatitude || longitude < LONDON_BOUNDS.minLongitude || longitude > LONDON_BOUNDS.maxLongitude;
  });
  addIssue(issues, listings, outsideLondon, "coordinates_outside_london", "high",
    "Out-of-scope records can mislead map users and local landing pages.",
    "Verify coordinates and exclude records outside the configured directory geography.");

  const invalidRatings = listings.filter((listing) =>
    (listing.rating !== undefined && (!Number.isFinite(listing.rating) || listing.rating < 0 || listing.rating > 5)) ||
    (listing.reviewCount !== undefined && (!Number.isInteger(listing.reviewCount) || listing.reviewCount < 0)) ||
    ((listing.rating === undefined) !== (listing.reviewCount === undefined))
  );
  addIssue(issues, listings, invalidRatings, "invalid_rating_review_pair", "critical",
    "Ranking, review trust signals, and structured data become misleading.",
    "Require a 0-5 rating and non-negative integer review count as a complete pair.");

  const invalidUrls = listings.filter((listing) => listingUrls(listing).some((url) => !isHttpUrl(url)));
  addIssue(issues, listings, invalidUrls, "invalid_public_urls", "high",
    "Visitors can reach broken or unsafe contact, booking, menu, social, map, or image links.",
    "Normalize public URLs and accept only absolute HTTP(S) destinations during import.");

  addMissingCollectionIssue(issues, listings, "missing_provenance", "high", (listing) => hasCompleteProvenance(listing),
    "Records cannot be traced, refreshed, disputed, or assigned a verification state.",
    "Store source name/ID, import date, verification status, and last verified date per listing.");
  addMissingCollectionIssue(issues, listings, "missing_images", "medium", (listing) => listing.images.some(isHttpUrl),
    "The directory relies on fallbacks for listings without rights-approved gallery media.",
    "Use npm run audit:media for the launch-priority rights gate, then enrich the long tail progressively.");
  addMissingCollectionIssue(issues, listings, "missing_core_location", "high", hasCoreLocation,
    "Local discovery, area filters, maps, and LocalBusiness address data lose reliability.",
    "Require address, postcode, area, neighborhood, and borough for published records.");
  addMissingCollectionIssue(issues, listings, "missing_categories", "medium", (listing) => listing.categories.some(Boolean),
    "Cuisine/category filters and landing-page membership become incomplete.",
    "Review uncategorized records and preserve whether a value came from source data or inference.");
  addMissingCollectionIssue(issues, listings, "missing_opening_hours", "medium", (listing) => Boolean(listing.details?.workingHours?.length),
    "Visitors cannot reliably decide when to visit and open-now behavior has less coverage.",
    "Refresh opening hours from an attributable source and record the verification date.");
  addMissingCollectionIssue(issues, listings, "missing_rating_or_reviews", "medium", hasRatingAndReviews,
    "Rankings and trust comparisons have incomplete evidence.",
    "Refresh rating and review-count pairs together and timestamp the source check.");
  addMissingCollectionIssue(issues, listings, "missing_contact_action", "medium", hasContactAction,
    "A listing may offer no useful way to call, visit, book, order, or open a map.",
    "Require at least one validated contact or location action for published records.");

  const totals = severityTotals(issues);
  return {
    generatedAt: new Date().toISOString(),
    grain: "one row per restaurant location",
    totalListings: total,
    coverage: {
      categories: coverage(listings.filter((listing) => listing.categories.length > 0).length, total),
      images: coverage(listings.filter((listing) => listing.images.some(isHttpUrl)).length, total),
      coreLocation: coverage(withCoreLocation.length, total),
      coordinates: coverage(withCoordinates.length, total),
      contactAction: coverage(withContactAction.length, total),
      openingHours: coverage(listings.filter((listing) => Boolean(listing.details?.workingHours?.length)).length, total),
      ratingAndReviews: coverage(withRatingAndReviews.length, total),
      provenance: coverage(withProvenance.length, total)
    },
    issues,
    totals,
    verdict: totals.critical > 0 || totals.high > 0 ? "not_ready" : totals.medium > 0 ? "conditional" : "pass"
  };
}

export function renderListingOperationalQualityReport(report: ListingOperationalQualityReport) {
  const coverageRows = Object.entries(report.coverage)
    .map(([field, value]) => `| ${field} | ${value.count.toLocaleString()} | ${value.rate.toFixed(2)}% |`)
    .join("\n");
  const issueRows = report.issues
    .map((issue) => `| ${issue.severity} | ${issue.code} | ${issue.count.toLocaleString()} | ${issue.rate.toFixed(2)}% | ${issue.samples.join(", ") || "-"} |`)
    .join("\n");

  return [
    "# Listing Operational Quality Audit",
    "",
    `- Generated: ${report.generatedAt}`,
    `- Grain: ${report.grain}`,
    `- Listings: ${report.totalListings.toLocaleString()}`,
    `- Verdict: ${report.verdict}`,
    `- Issues: ${report.totals.critical} critical, ${report.totals.high} high, ${report.totals.medium} medium, ${report.totals.low} low`,
    "",
    "## Coverage",
    "",
    "| Field | Count | Rate |",
    "| --- | ---: | ---: |",
    coverageRows,
    "",
    "## Findings",
    "",
    "| Severity | Code | Records | Rate | Samples |",
    "| --- | --- | ---: | ---: | --- |",
    issueRows || "| - | none | 0 | 0.00% | - |",
    "",
    ...report.issues.flatMap((issue) => [
      `### ${issue.severity.toUpperCase()}: ${issue.code}`,
      "",
      `Impact: ${issue.impact}`,
      "",
      `Recommended control: ${issue.recommendation}`,
      ""
    ])
  ].join("\n");
}

function addMissingIssue(
  issues: ListingQualityIssue[], listings: Listing[], field: string, severity: ListingQualitySeverity,
  value: (listing: Listing) => string, impact: string, recommendation: string
) {
  addIssue(issues, listings, listings.filter((listing) => !value(listing)), `missing_${field}`, severity, impact, recommendation);
}

function addMissingCollectionIssue(
  issues: ListingQualityIssue[], listings: Listing[], code: string, severity: ListingQualitySeverity,
  predicate: (listing: Listing) => boolean, impact: string, recommendation: string
) {
  addIssue(issues, listings, listings.filter((listing) => !predicate(listing)), code, severity, impact, recommendation);
}

function addDuplicateIssue(
  issues: ListingQualityIssue[], listings: Listing[], code: string, severity: ListingQualitySeverity,
  key: (listing: Listing) => string, impact: string, recommendation: string
) {
  const groups = new Map<string, Listing[]>();
  for (const listing of listings) {
    const value = key(listing);
    if (!value) continue;
    groups.set(value, [...(groups.get(value) ?? []), listing]);
  }
  const duplicates = [...groups.values()].filter((group) => group.length > 1).flat();
  addIssue(issues, listings, duplicates, code, severity, impact, recommendation);
}

function addIssue(
  issues: ListingQualityIssue[], all: Listing[], affected: Listing[], code: string,
  severity: ListingQualitySeverity, impact: string, recommendation: string
) {
  if (!affected.length) return;
  issues.push({
    code,
    severity,
    count: affected.length,
    rate: rate(affected.length, all.length),
    samples: affected.slice(0, 5).map((listing) => clean(listing.slug) || clean(listing.name) || "unnamed-record"),
    impact,
    recommendation
  });
}

function hasCoreLocation(listing: Listing) {
  return Boolean(clean(listing.address) && clean(listing.postcode) && clean(listing.area) && clean(listing.neighborhood) && clean(listing.borough));
}

function hasCoordinatePair(listing: Listing) {
  return Number.isFinite(listing.location?.latitude) && Number.isFinite(listing.location?.longitude);
}

function hasRatingAndReviews(listing: Listing) {
  return Number.isFinite(listing.rating) && Number.isInteger(listing.reviewCount) && listing.reviewCount! >= 0;
}

function hasCompleteProvenance(listing: Listing) {
  const provenance = listing.provenance;
  if (!provenance) return false;
  const importedAtIsValid = isValidDate(provenance.importedAt);
  const historicalRecordIsValid =
    isValidDate(provenance.firstRecordedAt) &&
    provenance.recordDateBasis === "first-committed" &&
    /^[a-f0-9]{40}$/i.test(clean(provenance.sourceCommit)) &&
    /^[a-f0-9]{64}$/i.test(clean(provenance.sourceSnapshotSha256));
  const verificationDateIsValid =
    provenance.verificationStatus === "unverified" || isValidDate(provenance.lastVerifiedAt);
  const sourceUrlIsValid = !provenance.sourceUrl || isHttpUrl(provenance.sourceUrl);
  return Boolean(
      clean(provenance.sourceName) &&
      clean(provenance.sourceId) &&
      (importedAtIsValid || historicalRecordIsValid) &&
      verificationDateIsValid &&
      sourceUrlIsValid
  );
}

function hasContactAction(listing: Listing) {
  return listingUrls(listing, false).some(isHttpUrl) || Boolean(clean(listing.contact?.phone) || clean(listing.contact?.email));
}

function listingUrls(listing: Listing, includeImages = true) {
  const contact = listing.contact;
  const urls = [
    contact?.website, contact?.contactUrl, contact?.googleReviewsUrl, contact?.orderOnlineUrl,
    contact?.reserveUrl, contact?.appointmentUrl, contact?.menuUrl, listing.location?.googleMapsUrl,
    ...Object.values(contact?.socials ?? {})
  ];
  if (includeImages) urls.push(listing.logo, ...listing.images, ...(listing.menuImages ?? []));
  return urls.map(clean).filter(Boolean);
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeText(value: unknown) {
  return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidDate(value: unknown) {
  if (!clean(value)) return false;
  return !Number.isNaN(new Date(String(value)).getTime());
}

function coverage(count: number, total: number) {
  return { count, rate: rate(count, total) };
}

function rate(count: number, total: number) {
  return total ? (count / total) * 100 : 0;
}

function severityTotals(issues: ListingQualityIssue[]) {
  return {
    critical: issues.filter((issue) => issue.severity === "critical").length,
    high: issues.filter((issue) => issue.severity === "high").length,
    medium: issues.filter((issue) => issue.severity === "medium").length,
    low: issues.filter((issue) => issue.severity === "low").length
  };
}
