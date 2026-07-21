import type { Listing } from "@/data/listings";
import type { ListingPublicationState } from "@/lib/listing-publication";
import {
  isListingVerificationField,
  type ListingVerificationEvent,
  type ListingVerificationLedger
} from "@/lib/listing-verification";

export type ListingVerificationSeverity = "critical" | "high" | "medium" | "low";

export type ListingVerificationIssue = {
  code: string;
  severity: ListingVerificationSeverity;
  count: number;
  rate: number;
  samples: string[];
  impact: string;
  recommendation: string;
};

export type ListingVerificationQualityReport = {
  generatedAt: string;
  grain: "one current verification state per restaurant location plus append-only events";
  totalListings: number;
  totalEvents: number;
  coverage: {
    unverified: number;
    sourceVerified: number;
    editorVerified: number;
    freshVerified: number;
    partialVerified: number;
    stale90To179Days: number;
    stale180DaysOrMore: number;
    openNeedsReview: number;
  };
  issues: ListingVerificationIssue[];
  totals: Record<ListingVerificationSeverity, number>;
  verdict: "not_ready" | "conditional" | "pass";
};

const mediumStaleDays = 90;
const highStaleDays = 180;
const coreVerificationFields = [
  "name",
  "address",
  "postcode",
  "businessStatus",
  "contact.website",
  "contact.phone",
  "details.workingHours"
] as const;

export function auditListingVerificationQuality(
  listings: Listing[],
  ledger: ListingVerificationLedger,
  now = new Date(),
  publicationStates?: ReadonlyMap<string, ListingPublicationState>
): ListingVerificationQualityReport {
  const issues: ListingVerificationIssue[] = [];
  const listingBySlug = new Map(listings.map((listing) => [listing.slug, listing]));
  const eventById = new Map<string, ListingVerificationEvent>();
  const duplicateEvents: ListingVerificationEvent[] = [];
  const invalidEvents: ListingVerificationEvent[] = [];
  const orphanEvents: ListingVerificationEvent[] = [];

  for (const event of ledger.events ?? []) {
    if (eventById.has(event.id)) duplicateEvents.push(event);
    else eventById.set(event.id, event);
    const listing = listingBySlug.get(event.listingSlug);
    if (!listing) orphanEvents.push(event);
    if (!isValidEvent(event, now)) invalidEvents.push(event);
  }

  if (ledger.version !== 1) {
    issues.push({
      code: "unsupported_ledger_version",
      severity: "critical",
      count: 1,
      rate: 100,
      samples: [String(ledger.version)],
      impact: "The verifier cannot guarantee the meaning or integrity of an unknown ledger schema.",
      recommendation: "Migrate the ledger explicitly before recording or trusting additional events."
    });
  }

  addEventIssue(issues, duplicateEvents, ledger.events.length, "duplicate_event_ids", "critical",
    "Duplicate ledger identifiers make the audit trail ambiguous and break idempotent writes.",
    "Regenerate or reconcile duplicate event identifiers before accepting more verification writes.");
  addEventIssue(issues, invalidEvents, ledger.events.length, "invalid_verification_events", "critical",
    "Malformed timestamps, evidence, fields, or outcomes make verification claims unsupported.",
    "Reject invalid event proposals and repair the ledger entry from retained evidence.");
  addEventIssue(issues, orphanEvents, ledger.events.length, "orphan_verification_events", "critical",
    "An event that references no canonical restaurant cannot establish or explain current listing state.",
    "Resolve the slug through an explicit entity/redirect decision or remove the invalid event before publication.");

  const unverified = listings.filter((listing) => !listing.provenance || listing.provenance.verificationStatus === "unverified");
  const sourceVerified = listings.filter((listing) => listing.provenance?.verificationStatus === "source-verified");
  const editorVerified = listings.filter((listing) => listing.provenance?.verificationStatus === "editor-verified");
  const missingMatchingEvent: Listing[] = [];
  const futureVerifiedAt: Listing[] = [];
  const stale90To179: Listing[] = [];
  const stale180Plus: Listing[] = [];
  const freshVerified: Listing[] = [];
  const partialVerified: Listing[] = [];

  for (const listing of [...sourceVerified, ...editorVerified]) {
    const provenance = listing.provenance!;
    const verifiedAt = new Date(provenance.lastVerifiedAt ?? "");
    const event = provenance.lastVerificationEventId ? eventById.get(provenance.lastVerificationEventId) : undefined;
    if (
      !event ||
      event.listingSlug !== listing.slug ||
      event.outcome !== "verified" ||
      event.verificationStatus !== provenance.verificationStatus ||
      event.checkedAt !== provenance.lastVerifiedAt
    ) {
      missingMatchingEvent.push(listing);
    }
    if (Number.isNaN(verifiedAt.getTime()) || verifiedAt.getTime() > now.getTime() + 5 * 60 * 1000) {
      futureVerifiedAt.push(listing);
      continue;
    }
    if (!event || coreVerificationFields.some((field) => !event.fieldsChecked.includes(field))) {
      partialVerified.push(listing);
      continue;
    }
    const age = daysBetween(verifiedAt, now);
    if (age >= highStaleDays) stale180Plus.push(listing);
    else if (age >= mediumStaleDays) stale90To179.push(listing);
    else freshVerified.push(listing);
  }

  addListingIssue(issues, missingMatchingEvent, listings.length, "verified_state_without_matching_event", "critical",
    "The canonical record claims verification without a matching append-only evidence event.",
    "Record the verification through the guarded command or revert the record to unverified.");
  addListingIssue(issues, futureVerifiedAt, listings.length, "invalid_or_future_verification_date", "critical",
    "Future or invalid dates create false freshness and can suppress necessary review.",
    "Use an attributable check timestamp no later than the current time.");
  addListingIssue(issues, partialVerified, listings.length, "partial_verification_scope", "medium",
    "The event is attributable but does not cover every core identity and operational field required for a fresh listing claim.",
    `Recheck the missing core scope: ${coreVerificationFields.join(", ")}.`);
  addListingIssue(issues, unverified, listings.length, "unverified_listings", "high",
    "Historical source lineage is available, but current hours, status, contact details, and identity have not been checked.",
    "Verify high-value listings first and record fields, evidence, and check date through the event ledger.");
  addListingIssue(issues, stale180Plus, listings.length, "verification_180_days_stale", "high",
    "Records verified at least 180 days ago may materially mislead visitors about operational details.",
    "Recheck business status, hours, contact actions, address, and key categories immediately.");
  addListingIssue(issues, stale90To179, listings.length, "verification_90_days_stale", "medium",
    "Operational data between 90 and 179 days old is increasingly likely to have changed.",
    "Schedule a new evidence-backed check before the record reaches 180 days.");

  const latestEventBySlug = latestEvents(ledger.events ?? []);
  const openNeedsReview = [...latestEventBySlug.values()].filter((event) => event.outcome === "needs-review");
  addEventIssue(issues, openNeedsReview, listings.length, "open_evidence_conflicts", "high",
    "Conflicting evidence leaves the restaurant identity or an important visitor-facing fact unresolved.",
    "Keep the current record unverified and resolve the conflict from authoritative owner, registry, or premises evidence.");
  if (publicationStates) {
    const publishedConflicts = openNeedsReview.filter((event) => publicationStates.get(event.listingSlug)?.status === "published");
    addEventIssue(issues, publishedConflicts, listings.length, "published_open_evidence_conflicts", "high",
      "A restaurant with unresolved verification evidence remains published on public discovery surfaces.",
      "Record a guarded pending-review publication decision until the evidence conflict is resolved.");
  }

  const totals = severityTotals(issues);
  return {
    generatedAt: now.toISOString(),
    grain: "one current verification state per restaurant location plus append-only events",
    totalListings: listings.length,
    totalEvents: ledger.events?.length ?? 0,
    coverage: {
      unverified: unverified.length,
      sourceVerified: sourceVerified.length,
      editorVerified: editorVerified.length,
      freshVerified: freshVerified.length,
      partialVerified: partialVerified.length,
      stale90To179Days: stale90To179.length,
      stale180DaysOrMore: stale180Plus.length,
      openNeedsReview: openNeedsReview.length
    },
    issues,
    totals,
    verdict: totals.critical || totals.high ? "not_ready" : totals.medium ? "conditional" : "pass"
  };
}

export function renderListingVerificationQualityReport(report: ListingVerificationQualityReport) {
  const coverageRows = Object.entries(report.coverage)
    .map(([label, count]) => `| ${label} | ${count.toLocaleString()} | ${rate(count, report.totalListings).toFixed(2)}% |`)
    .join("\n");
  const issueRows = report.issues
    .map((issue) => `| ${issue.severity} | ${issue.code} | ${issue.count.toLocaleString()} | ${issue.rate.toFixed(2)}% | ${issue.samples.join(", ") || "-"} |`)
    .join("\n");
  return [
    "# Listing Verification Quality Audit",
    "",
    `- Generated: ${report.generatedAt}`,
    `- Grain: ${report.grain}`,
    `- Listings: ${report.totalListings.toLocaleString()}`,
    `- Ledger events: ${report.totalEvents.toLocaleString()}`,
    `- Verdict: ${report.verdict}`,
    `- Issues: ${report.totals.critical} critical, ${report.totals.high} high, ${report.totals.medium} medium, ${report.totals.low} low`,
    "",
    "## Verification coverage",
    "",
    "| State | Records | Rate |",
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

function isValidEvent(event: ListingVerificationEvent, now: Date) {
  if (!event.id?.trim() || !event.listingSlug?.trim() || !event.reviewedBy?.trim()) return false;
  if (!isValidPastDate(event.recordedAt, now) || !isValidPastDate(event.checkedAt, now)) return false;
  if (new Date(event.recordedAt).getTime() < new Date(event.checkedAt).getTime()) return false;
  if (event.outcome === "verified" && event.verificationStatus !== "source-verified" && event.verificationStatus !== "editor-verified") return false;
  if (event.outcome === "needs-review" && (event.verificationStatus || !event.notes?.trim())) return false;
  if (!Array.isArray(event.evidence) || !event.evidence.length) return false;
  if (event.evidence.some((item) => !item.sourceName?.trim() || !isHttpUrl(item.sourceUrl) || !isValidPastDate(item.accessedAt, now))) return false;
  if (!Array.isArray(event.fieldsChecked) || !event.fieldsChecked.length || event.fieldsChecked.some((field) => !isListingVerificationField(field))) return false;
  if (new Set(event.fieldsChecked).size !== event.fieldsChecked.length) return false;
  if (!Array.isArray(event.changes)) return false;
  if (new Set(event.changes.map((change) => change.field)).size !== event.changes.length) return false;
  return event.changes.every((change) =>
    isListingVerificationField(change.field) &&
    event.fieldsChecked.includes(change.field) &&
    Boolean(change.reason?.trim()) &&
    change.applied === (event.outcome === "verified")
  );
}

function latestEvents(events: ListingVerificationEvent[]) {
  const latest = new Map<string, ListingVerificationEvent>();
  for (const event of events) {
    const current = latest.get(event.listingSlug);
    if (!current || event.recordedAt > current.recordedAt) latest.set(event.listingSlug, event);
  }
  return latest;
}

function addListingIssue(
  issues: ListingVerificationIssue[],
  affected: Listing[],
  denominator: number,
  code: string,
  severity: ListingVerificationSeverity,
  impact: string,
  recommendation: string
) {
  addIssue(issues, affected.map((listing) => listing.slug), denominator, code, severity, impact, recommendation);
}

function addEventIssue(
  issues: ListingVerificationIssue[],
  affected: ListingVerificationEvent[],
  denominator: number,
  code: string,
  severity: ListingVerificationSeverity,
  impact: string,
  recommendation: string
) {
  addIssue(issues, affected.map((event) => event.listingSlug || event.id), denominator, code, severity, impact, recommendation);
}

function addIssue(
  issues: ListingVerificationIssue[],
  affected: string[],
  denominator: number,
  code: string,
  severity: ListingVerificationSeverity,
  impact: string,
  recommendation: string
) {
  if (!affected.length) return;
  issues.push({
    code,
    severity,
    count: affected.length,
    rate: rate(affected.length, denominator),
    samples: [...new Set(affected)].slice(0, 5),
    impact,
    recommendation
  });
}

function severityTotals(issues: ListingVerificationIssue[]) {
  return {
    critical: issues.filter((issue) => issue.severity === "critical").length,
    high: issues.filter((issue) => issue.severity === "high").length,
    medium: issues.filter((issue) => issue.severity === "medium").length,
    low: issues.filter((issue) => issue.severity === "low").length
  };
}

function isValidPastDate(value: string, now: Date) {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.getTime() <= now.getTime() + 5 * 60 * 1000;
}

function isHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function daysBetween(start: Date, end: Date) {
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
}

function rate(count: number, total: number) {
  return total ? (count / total) * 100 : 0;
}
