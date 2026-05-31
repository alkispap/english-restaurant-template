import type { Listing } from "@/data/listings";
import { SEO_POLICY, scoreListingQuality } from "@/lib/seo-policy";

export type FreshnessRiskLevel = "ok" | "medium" | "high";

export type ListingFreshnessIssue = {
  code: string;
  level: "medium" | "high";
  message: string;
};

export type ListingFreshnessResult = {
  slug: string;
  name: string;
  score: number;
  level: FreshnessRiskLevel;
  issues: ListingFreshnessIssue[];
};

export type FreshnessAuditReport = {
  generatedAt: string;
  directoryLastModified: string;
  daysSinceDirectoryUpdate: number;
  directoryFreshnessLevel: FreshnessRiskLevel;
  totals: {
    listings: number;
    ok: number;
    medium: number;
    high: number;
    permanentlyClosed: number;
    temporarilyClosed: number;
    missingHours: number;
    missingImages: number;
    missingReviews: number;
    missingContactActions: number;
  };
  listings: ListingFreshnessResult[];
  recommendations: string[];
};

export type FreshnessAuditOptions = {
  now?: Date;
  directoryLastModified?: Date;
};

const mediumStaleDays = 90;
const highStaleDays = 180;

export function buildFreshnessAuditReport(
  listings: Listing[],
  options: FreshnessAuditOptions = {}
): FreshnessAuditReport {
  const now = options.now ?? new Date();
  const directoryLastModified = options.directoryLastModified ?? SEO_POLICY.directoryLastModified;
  const daysSinceDirectoryUpdate = Math.max(0, daysBetween(directoryLastModified, now));
  const directoryFreshnessLevel = staleLevel(daysSinceDirectoryUpdate);
  const results = listings.map(auditListingFreshness).sort(compareListingResults);
  const totals = {
    listings: results.length,
    ok: results.filter((result) => result.level === "ok").length,
    medium: results.filter((result) => result.level === "medium").length,
    high: results.filter((result) => result.level === "high").length,
    permanentlyClosed: results.filter((result) => hasIssue(result, "permanently_closed")).length,
    temporarilyClosed: results.filter((result) => hasIssue(result, "temporarily_closed")).length,
    missingHours: results.filter((result) => hasIssue(result, "missing_hours")).length,
    missingImages: results.filter((result) => hasIssue(result, "missing_images")).length,
    missingReviews: results.filter((result) => hasIssue(result, "missing_rating") || hasIssue(result, "missing_review_count")).length,
    missingContactActions: results.filter((result) => hasIssue(result, "missing_contact_actions")).length
  };

  return {
    generatedAt: now.toISOString(),
    directoryLastModified: directoryLastModified.toISOString(),
    daysSinceDirectoryUpdate,
    directoryFreshnessLevel,
    totals,
    listings: results,
    recommendations: recommendations(totals, daysSinceDirectoryUpdate)
  };
}

export function auditListingFreshness(listing: Listing): ListingFreshnessResult {
  const score = scoreListingQuality(listing);
  const issues: ListingFreshnessIssue[] = [];
  const status = normalizeStatus(listing.businessStatus);

  if (status === "closed permanently" || status === "permanently closed") {
    issues.push({
      code: "permanently_closed",
      level: "high",
      message: "Listing is marked permanently closed."
    });
  } else if (status === "closed temporarily" || status === "temporarily closed") {
    issues.push({
      code: "temporarily_closed",
      level: "medium",
      message: "Listing is marked temporarily closed and should be reviewed before launch."
    });
  } else if (status && status !== "operational") {
    issues.push({
      code: "non_operational_status",
      level: "medium",
      message: `Listing has a non-operational status: ${listing.businessStatus}.`
    });
  }

  if (!listing.details?.workingHours?.length && !listing.details?.workingHoursText) {
    issues.push({
      code: "missing_hours",
      level: "medium",
      message: "Opening hours are missing."
    });
  }

  if (!listing.images.length) {
    issues.push({
      code: "missing_images",
      level: "medium",
      message: "Images are missing."
    });
  }

  if (typeof listing.rating !== "number") {
    issues.push({
      code: "missing_rating",
      level: "medium",
      message: "Rating is missing."
    });
  }

  if (typeof listing.reviewCount !== "number" || listing.reviewCount <= 0) {
    issues.push({
      code: "missing_review_count",
      level: "medium",
      message: "Review count is missing."
    });
  }

  if (!hasUsefulContactAction(listing)) {
    issues.push({
      code: "missing_contact_actions",
      level: "medium",
      message: "No useful contact, map, review, booking, menu, or website action is available."
    });
  }

  if (!listing.contact?.phone) {
    issues.push({
      code: "missing_phone",
      level: "medium",
      message: "Phone number is missing."
    });
  }

  if (!listing.contact?.website) {
    issues.push({
      code: "missing_website",
      level: "medium",
      message: "Website link is missing."
    });
  }

  if (!listing.details?.serviceOptions?.length) {
    issues.push({
      code: "missing_service_options",
      level: "medium",
      message: "Service options are missing."
    });
  }

  if (!listing.area && !listing.neighborhood) {
    issues.push({
      code: "missing_local_context",
      level: "medium",
      message: "Area or neighborhood data is missing."
    });
  }

  if (!listing.categories.length) {
    issues.push({
      code: "missing_categories",
      level: "medium",
      message: "Category data is missing."
    });
  }

  if (score < SEO_POLICY.listingQualityThreshold) {
    issues.push({
      code: "low_quality_score",
      level: "high",
      message: `SEO quality score is below ${SEO_POLICY.listingQualityThreshold}.`
    });
  } else if (score < 80) {
    issues.push({
      code: "borderline_quality_score",
      level: "medium",
      message: "SEO quality score is between 70 and 79."
    });
  }

  return {
    slug: listing.slug,
    name: listing.name,
    score,
    level: issueLevel(issues),
    issues
  };
}

export function renderFreshnessAuditReport(report: FreshnessAuditReport) {
  const lastUpdated = report.directoryLastModified.slice(0, 10);
  const topListings = report.listings
    .filter((listing) => listing.level !== "ok")
    .slice(0, 12)
    .map((listing) => `- ${listing.name}: ${listing.issues.slice(0, 4).map((issue) => issue.message).join("; ")}`)
    .join("\n");

  return [
    "Freshness audit",
    `Generated: ${report.generatedAt}`,
    `Directory last updated: ${lastUpdated}`,
    `Days since directory update: ${report.daysSinceDirectoryUpdate}`,
    `Listings checked: ${report.totals.listings}`,
    `OK: ${report.totals.ok}`,
    `Medium risk: ${report.totals.medium}`,
    `High risk: ${report.totals.high}`,
    "",
    "Issue counts:",
    `- Permanently closed: ${report.totals.permanentlyClosed}`,
    `- Temporarily closed: ${report.totals.temporarilyClosed}`,
    `- Missing hours: ${report.totals.missingHours}`,
    `- Missing images: ${report.totals.missingImages}`,
    `- Missing reviews: ${report.totals.missingReviews}`,
    `- Missing contact actions: ${report.totals.missingContactActions}`,
    "",
    "Top listings needing review:",
    topListings || "- None",
    "",
    "Recommended actions:",
    report.recommendations.map((recommendation) => `- ${recommendation}`).join("\n")
  ].join("\n");
}

function hasUsefulContactAction(listing: Listing) {
  const contact = listing.contact;
  const socials = Object.keys(contact?.socials ?? {}).length > 0;

  return Boolean(
    contact?.phone ||
      contact?.website ||
      contact?.googleReviewsUrl ||
      contact?.reserveUrl ||
      contact?.orderOnlineUrl ||
      contact?.appointmentUrl ||
      contact?.menuUrl ||
      contact?.email ||
      contact?.contactUrl ||
      listing.location?.googleMapsUrl ||
      socials
  );
}

function normalizeStatus(status?: string) {
  return status
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function issueLevel(issues: ListingFreshnessIssue[]): FreshnessRiskLevel {
  if (issues.some((issue) => issue.level === "high")) return "high";
  if (issues.length) return "medium";
  return "ok";
}

function staleLevel(days: number): FreshnessRiskLevel {
  if (days >= highStaleDays) return "high";
  if (days >= mediumStaleDays) return "medium";
  return "ok";
}

function recommendations(totals: FreshnessAuditReport["totals"], daysSinceDirectoryUpdate: number) {
  const items: string[] = [];

  if (totals.high) items.push("Re-import or manually review high-risk listings first.");
  if (totals.medium) items.push("Review medium-risk listings after high-risk records are handled.");
  if (daysSinceDirectoryUpdate >= highStaleDays) {
    items.push("Directory data is older than 180 days; refresh hours, status, reviews, service options, and listing details.");
  } else if (daysSinceDirectoryUpdate >= mediumStaleDays) {
    items.push("Directory data is older than 90 days; refresh hours, status, reviews, and service options.");
  }
  if (totals.missingHours || totals.missingReviews || totals.missingContactActions) {
    items.push("Prioritize missing hours, review counts, and contact actions because they affect visitor trust.");
  }
  if (!items.length) items.push("No major freshness risks found in this audit.");

  return items;
}

function hasIssue(result: ListingFreshnessResult, code: string) {
  return result.issues.some((issue) => issue.code === code);
}

function compareListingResults(a: ListingFreshnessResult, b: ListingFreshnessResult) {
  return levelWeight(b.level) - levelWeight(a.level) || a.score - b.score || a.name.localeCompare(b.name);
}

function levelWeight(level: FreshnessRiskLevel) {
  if (level === "high") return 2;
  if (level === "medium") return 1;
  return 0;
}

function daysBetween(start: Date, end: Date) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((end.getTime() - start.getTime()) / millisecondsPerDay);
}
