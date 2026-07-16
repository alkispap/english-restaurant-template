import type { Listing } from "@/data/listings";
import type { ListingVerificationEvent, ListingVerificationLedger } from "@/lib/listing-verification";

export type ListingVerificationPriorityGap =
  | "missing_contact_action"
  | "missing_opening_hours"
  | "missing_categories"
  | "missing_rating_or_reviews";

export type ListingVerificationPriorityState =
  | "open-needs-review"
  | "unverified"
  | "stale-180-days"
  | "stale-90-days";

export type ListingVerificationPriorityItem = {
  slug: string;
  name: string;
  area?: string;
  state: ListingVerificationPriorityState;
  gaps: ListingVerificationPriorityGap[];
  score: number;
  stateScore: number;
  gapScore: number;
  valueScore: number;
  reason: string;
};

export type ListingVerificationPriorityReport = {
  generatedAt: string;
  grain: "one verification task per restaurant location";
  totals: {
    listings: number;
    queued: number;
    openNeedsReview: number;
    unverified: number;
    stale180Days: number;
    stale90Days: number;
    queuedWithDataGaps: number;
  };
  gapCounts: Record<ListingVerificationPriorityGap, number>;
  priorities: ListingVerificationPriorityItem[];
};

const stateScores: Record<ListingVerificationPriorityState, number> = {
  "open-needs-review": 1_000,
  unverified: 100,
  "stale-180-days": 80,
  "stale-90-days": 40
};

const gapScores: Record<ListingVerificationPriorityGap, number> = {
  missing_contact_action: 80,
  missing_opening_hours: 50,
  missing_categories: 30,
  missing_rating_or_reviews: 20
};

const anyGapScore = 300;

export function prioritizeListingVerification(
  listings: Listing[],
  ledger: ListingVerificationLedger,
  now = new Date()
): ListingVerificationPriorityReport {
  const latestEventBySlug = latestEvents(ledger.events ?? []);
  const priorities = listings.flatMap((listing) => {
    const state = verificationState(listing, latestEventBySlug.get(listing.slug), now);
    if (!state) return [];
    const gaps = listingGaps(listing);
    const stateScore = stateScores[state];
    const gapScore = (gaps.length ? anyGapScore : 0) + gaps.reduce((total, gap) => total + gapScores[gap], 0);
    const valueScore = listingValueScore(listing);
    return [{
      slug: listing.slug,
      name: listing.name,
      area: listing.area,
      state,
      gaps,
      score: stateScore + gapScore + valueScore,
      stateScore,
      gapScore,
      valueScore,
      reason: `state ${stateScore}; data gaps ${gapScore}; capped value proxy ${valueScore}`
    }];
  }).sort((left, right) =>
    right.score - left.score ||
    right.gapScore - left.gapScore ||
    right.valueScore - left.valueScore ||
    left.slug.localeCompare(right.slug)
  );

  const byState = (state: ListingVerificationPriorityState) => priorities.filter((item) => item.state === state).length;
  return {
    generatedAt: now.toISOString(),
    grain: "one verification task per restaurant location",
    totals: {
      listings: listings.length,
      queued: priorities.length,
      openNeedsReview: byState("open-needs-review"),
      unverified: byState("unverified"),
      stale180Days: byState("stale-180-days"),
      stale90Days: byState("stale-90-days"),
      queuedWithDataGaps: priorities.filter((item) => item.gaps.length > 0).length
    },
    gapCounts: {
      missing_contact_action: countGap(priorities, "missing_contact_action"),
      missing_opening_hours: countGap(priorities, "missing_opening_hours"),
      missing_categories: countGap(priorities, "missing_categories"),
      missing_rating_or_reviews: countGap(priorities, "missing_rating_or_reviews")
    },
    priorities
  };
}

export function renderListingVerificationPriorityReport(report: ListingVerificationPriorityReport, limit = 50) {
  const rows = report.priorities.slice(0, Math.max(0, limit)).map((item, index) =>
    `| ${index + 1} | ${item.slug} | ${item.area ?? ""} | ${item.state} | ${item.gaps.join(", ") || "none"} | ${item.score} |`
  );
  return [
    "# Listing Verification Priority Queue",
    "",
    `- Generated: ${report.generatedAt}`,
    `- Grain: ${report.grain}`,
    `- Listings: ${report.totals.listings.toLocaleString("en-GB")}`,
    `- Queued: ${report.totals.queued.toLocaleString("en-GB")}`,
    `- Queued with data gaps: ${report.totals.queuedWithDataGaps.toLocaleString("en-GB")}`,
    `- Open needs-review cases: ${report.totals.openNeedsReview.toLocaleString("en-GB")}`,
    "",
    "## Method",
    "",
    "The score schedules editorial work; it is not a restaurant rating or measured traffic. An open needs-review event receives 1,000 points. Unverified, 180-day stale, and 90-day stale states receive 100, 80, and 40 points. Any operational data gap receives 300 points, plus 80 for no contact action, 50 for no opening hours, 30 for no categories, and 20 for no rating/review pair. The capped value proxy adds at most 210 points from featured status, review volume, rating, categories, and contact/map completeness. Ties resolve by slug.",
    "",
    "## Gap coverage",
    "",
    "| Gap | Queued listings |",
    "| --- | ---: |",
    ...Object.entries(report.gapCounts).map(([gap, count]) => `| ${gap} | ${count.toLocaleString("en-GB")} |`),
    "",
    `## Top ${Math.min(Math.max(0, limit), report.priorities.length)} tasks`,
    "",
    "| Rank | Listing | Area | State | Data gaps | Score |",
    "| ---: | --- | --- | --- | --- | ---: |",
    ...rows,
    ""
  ].join("\n");
}

function verificationState(
  listing: Listing,
  latestEvent: ListingVerificationEvent | undefined,
  now: Date
): ListingVerificationPriorityState | undefined {
  if (latestEvent?.outcome === "needs-review") return "open-needs-review";
  const provenance = listing.provenance;
  if (!provenance || provenance.verificationStatus === "unverified") return "unverified";
  const verifiedAt = new Date(provenance.lastVerifiedAt ?? "");
  if (Number.isNaN(verifiedAt.getTime())) return "stale-180-days";
  const ageDays = (now.getTime() - verifiedAt.getTime()) / 86_400_000;
  if (ageDays >= 180) return "stale-180-days";
  if (ageDays >= 90) return "stale-90-days";
  return undefined;
}

function latestEvents(events: ListingVerificationEvent[]) {
  const result = new Map<string, ListingVerificationEvent>();
  for (const event of events) {
    const current = result.get(event.listingSlug);
    if (!current || compareEvents(current, event) < 0) result.set(event.listingSlug, event);
  }
  return result;
}

function compareEvents(left: ListingVerificationEvent, right: ListingVerificationEvent) {
  return left.checkedAt.localeCompare(right.checkedAt) || left.recordedAt.localeCompare(right.recordedAt) || left.id.localeCompare(right.id);
}

function listingGaps(listing: Listing): ListingVerificationPriorityGap[] {
  const gaps: ListingVerificationPriorityGap[] = [];
  if (!hasContactAction(listing)) gaps.push("missing_contact_action");
  if (!listing.details?.workingHours?.length) gaps.push("missing_opening_hours");
  if (!listing.categories.some(Boolean)) gaps.push("missing_categories");
  if (!hasRatingAndReviews(listing)) gaps.push("missing_rating_or_reviews");
  return gaps;
}

function listingValueScore(listing: Listing) {
  const featured = listing.featured ? 100 : 0;
  const reviews = Math.min(80, Math.round(Math.log10((listing.reviewCount ?? 0) + 1) * 20));
  const rating = Math.min(20, Math.round((listing.rating ?? 0) * 4));
  const categories = listing.categories.some(Boolean) ? 5 : 0;
  const actions = listing.contact?.phone || listing.contact?.website || listing.location?.googleMapsUrl ? 5 : 0;
  return featured + reviews + rating + categories + actions;
}

function hasRatingAndReviews(listing: Listing) {
  return Number.isFinite(listing.rating) && Number.isInteger(listing.reviewCount) && listing.reviewCount! >= 0;
}

function hasContactAction(listing: Listing) {
  const contact = listing.contact;
  const urls = [
    contact?.website,
    contact?.contactUrl,
    contact?.googleReviewsUrl,
    contact?.orderOnlineUrl,
    contact?.reserveUrl,
    contact?.appointmentUrl,
    contact?.menuUrl,
    listing.location?.googleMapsUrl,
    ...Object.values(contact?.socials ?? {})
  ];
  return urls.some((value) => isHttpUrl(value)) || Boolean(clean(contact?.phone) || clean(contact?.email));
}

function isHttpUrl(value: unknown) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function countGap(priorities: ListingVerificationPriorityItem[], gap: ListingVerificationPriorityGap) {
  return priorities.filter((item) => item.gaps.includes(gap)).length;
}
