import type { Listing } from "@/data/listings";
import {
  publicationEventId,
  snapshotFromState,
  validatePublicationStateSnapshot,
  type ListingPublicationEvent,
  type ListingPublicationLedger,
  type ListingPublicationRegistry,
  type ListingPublicationState,
  type PublicationStateSnapshot
} from "@/lib/listing-publication";
import type { ListingVerificationLedger } from "@/lib/listing-verification";

export type ListingPublicationSeverity = "critical" | "high" | "medium" | "low";

export type ListingPublicationIssue = {
  code: string;
  severity: ListingPublicationSeverity;
  count: number;
  samples: string[];
  impact: string;
  recommendation: string;
};

export type ListingPublicationQualityReport = {
  generatedAt: string;
  status: "ready" | "not_ready";
  totalListings: number;
  totalStates: number;
  totalEvents: number;
  counts: { published: number; pendingReview: number; excluded: number };
  issues: ListingPublicationIssue[];
};

export type ListingPublicationAuditOptions = {
  sourceSha256?: string;
  verificationLedger?: ListingVerificationLedger;
  entityResolutionIds?: ReadonlySet<string>;
  publicDerivativeSlugs?: Record<string, readonly string[]>;
  derivativeIntegrityIssues?: string[];
  now?: Date;
};

export function auditListingPublicationQuality(
  listings: Listing[],
  registry: ListingPublicationRegistry,
  ledger: ListingPublicationLedger,
  options: ListingPublicationAuditOptions = {}
): ListingPublicationQualityReport {
  const now = options.now ?? new Date();
  const issues: ListingPublicationIssue[] = [];
  const listingBySlug = new Map(listings.map((listing) => [listing.slug, listing]));
  const stateGroups = groupBy(registry.entries, (state) => state.listingSlug);
  const stateBySlug = new Map(registry.entries.map((state) => [state.listingSlug, state]));
  const eventGroups = groupBy(ledger.events, (event) => event.listingSlug);

  addIssue(issues, duplicateKeys(registry.entries, (state) => state.listingSlug), "duplicate_publication_states", "critical",
    "More than one current publication state makes public eligibility ambiguous.",
    "Retain exactly one materialized state per canonical listing.");
  addIssue(issues, listings.filter((listing) => !stateGroups.has(listing.slug)).map((listing) => listing.slug), "missing_publication_states", "critical",
    "Listings without explicit publication state cannot be handled safely.",
    "Run the guarded migration/import initialization and fail closed until every listing has one state.");
  addIssue(issues, registry.entries.filter((state) => !listingBySlug.has(state.listingSlug)).map((state) => state.listingSlug), "orphan_publication_states", "critical",
    "Publication state references a listing that no longer exists in retained canonical data.",
    "Restore the retained record or reconcile the orphan through an evidence-backed migration.");

  const sourceMismatches = registry.entries.filter((state) => {
    const listing = listingBySlug.get(state.listingSlug);
    return listing && state.listingSourceId !== listing.provenance?.sourceId;
  }).map((state) => state.listingSlug);
  addIssue(issues, sourceMismatches, "publication_source_id_mismatch", "critical",
    "A state may have drifted onto a different business record that reused the same slug.",
    "Require slug and source-ID identity to match before accepting a decision.");

  const invalidStates = registry.entries.filter((state) => validateCurrentState(state, now).length > 0).map((state) => state.listingSlug);
  addIssue(issues, invalidStates, "invalid_publication_states", "critical",
    "Malformed states can leak records or produce inconsistent public behavior.",
    "Repair status/reason-specific fields through the guarded publication workflow.");

  if (options.sourceSha256 && registry.baseline.sourceSha256.toLowerCase() !== options.sourceSha256.toLowerCase()) {
    addIssue(issues, [registry.baseline.sourceSha256], "baseline_source_hash_mismatch", "critical",
      "The recorded migration source differs from the canonical file being audited.",
      "Stop and reconcile the canonical data change before publication writes continue.");
  }

  addIssue(issues, duplicateKeys(ledger.events, (event) => event.id), "duplicate_publication_event_ids", "critical",
    "Duplicate event IDs break idempotency and make history ambiguous.",
    "Reconcile the duplicate before accepting further decisions.");
  addIssue(issues, ledger.events.filter((event) => !listingBySlug.has(event.listingSlug)).map((event) => event.id), "orphan_publication_events", "critical",
    "Publication history references a missing retained record.",
    "Restore the retained record or reconcile it without deleting event history.");

  const invalidEvents: string[] = [];
  const invalidChains: string[] = [];
  const unresolvedEvidence: string[] = [];
  for (const [slug, events] of eventGroups) {
    const ordered = [...events].sort(eventOrder);
    for (const event of ordered) {
      if (validateEvent(event, listingBySlug.get(slug), now).length) invalidEvents.push(event.id);
      if (!evidenceReferencesResolve(event, options)) unresolvedEvidence.push(event.id);
    }
    for (let index = 1; index < ordered.length; index += 1) {
      if (!sameSnapshot(ordered[index - 1].next, ordered[index].previous)) invalidChains.push(ordered[index].id);
    }
    const state = stateBySlug.get(slug);
    const latest = ordered.at(-1);
    if (!state || !latest || state.lastDecisionEventId !== latest.id || !sameSnapshot(snapshotFromState(state), latest.next)) {
      invalidChains.push(slug);
    }
  }
  for (const state of registry.entries) {
    const events = eventGroups.get(state.listingSlug) ?? [];
    if (state.origin === "editorial-decision" && events.length === 0) invalidChains.push(state.listingSlug);
    if (state.origin !== "editorial-decision" && state.lastDecisionEventId) invalidChains.push(state.listingSlug);
  }
  addIssue(issues, unique(invalidEvents), "invalid_publication_events", "critical",
    "Malformed events cannot support an auditable editorial decision.",
    "Correct the data with a later valid event or repair migration corruption before release.");
  addIssue(issues, unique(invalidChains), "publication_event_chain_mismatch", "critical",
    "The current state does not replay cleanly from its recorded history.",
    "Stop publication writes and reconcile the previous/next chain and current projection.");
  addIssue(issues, unique(unresolvedEvidence), "unresolved_publication_evidence", "critical",
    "A publication decision references evidence that cannot be found.",
    "Restore the referenced verification/entity record or provide valid external evidence.");

  const successorIssues: string[] = [];
  for (const state of registry.entries) {
    if (!state.successorSlug) continue;
    const successor = stateBySlug.get(state.successorSlug);
    if (state.successorSlug === state.listingSlug || !successor || successor.status !== "published") successorIssues.push(state.listingSlug);
  }
  successorIssues.push(...redirectCycleSlugs(stateBySlug));
  addIssue(issues, unique(successorIssues), "invalid_publication_successors", "critical",
    "A redirect could loop, target a missing record or lead to another unavailable listing.",
    "Require an existing published successor and reject self-targets or cycles.");

  if (options.verificationLedger) {
    const latestVerification = latestBy(options.verificationLedger.events, (event) => event.listingSlug, (event) => event.recordedAt);
    const publishedConflicts = registry.entries.filter((state) => state.status === "published" && latestVerification.get(state.listingSlug)?.outcome === "needs-review").map((state) => state.listingSlug);
    addIssue(issues, publishedConflicts, "published_open_verification_conflicts", "high",
      "A listing with a current evidence conflict remains publicly discoverable.",
      "Record an explicit pending-review decision before release.");
  }

  if (options.publicDerivativeSlugs) {
    const published = new Set(registry.entries.filter((state) => state.status === "published").map((state) => state.listingSlug));
    for (const [name, slugs] of Object.entries(options.publicDerivativeSlugs)) {
      const leaked = slugs.filter((slug) => !published.has(slug));
      const missing = [...published].filter((slug) => !slugs.includes(slug));
      addIssue(issues, leaked, `${name}_publication_leak`, "critical",
        `${name} exposes pending-review or excluded records.`,
        "Regenerate all public derivatives through the publication-aware renderer.");
      addIssue(issues, missing, `${name}_missing_published_records`, "critical",
        `${name} is missing records approved for publication.`,
        "Regenerate the derivative from the same published listing selection.");
    }
  }
  addIssue(issues, options.derivativeIntegrityIssues ?? [], "publication_derivative_mismatch", "critical",
    "One or more generated public files do not exactly match publication-aware rendering.",
    "Regenerate every public derivative through the shared publication-aware renderer.");

  const counts = {
    published: registry.entries.filter((state) => state.status === "published").length,
    pendingReview: registry.entries.filter((state) => state.status === "pending-review").length,
    excluded: registry.entries.filter((state) => state.status === "excluded").length
  };
  return {
    generatedAt: now.toISOString(),
    status: issues.some((issue) => issue.severity === "critical" || issue.severity === "high") ? "not_ready" : "ready",
    totalListings: listings.length,
    totalStates: registry.entries.length,
    totalEvents: ledger.events.length,
    counts,
    issues
  };
}

export function renderListingPublicationQualityReport(report: ListingPublicationQualityReport) {
  const lines = [
    "# Listing Publication Quality Audit",
    "",
    `- Generated: ${report.generatedAt}`,
    `- Listings: ${report.totalListings.toLocaleString()}`,
    `- Current states: ${report.totalStates.toLocaleString()}`,
    `- Decision events: ${report.totalEvents.toLocaleString()}`,
    `- Published: ${report.counts.published.toLocaleString()}`,
    `- Pending review: ${report.counts.pendingReview.toLocaleString()}`,
    `- Excluded: ${report.counts.excluded.toLocaleString()}`,
    `- Verdict: ${report.status}`,
    "",
    "## Findings",
    ""
  ];
  if (!report.issues.length) lines.push("No publication integrity or public-leakage issues found.");
  for (const issue of report.issues) {
    lines.push(`### ${issue.severity.toUpperCase()}: ${issue.code}`, "", `Records: ${issue.count.toLocaleString()}`, `Samples: ${issue.samples.join(", ") || "-"}`, "", `Impact: ${issue.impact}`, "", `Recommended control: ${issue.recommendation}`, "");
  }
  return `${lines.join("\n")}\n`;
}

function validateCurrentState(state: ListingPublicationState, now: Date) {
  const errors = validatePublicationStateSnapshot(snapshotFromState(state), "state", now);
  if (!state.listingSlug.trim()) errors.push("listingSlug is required");
  if (!state.changedBy.trim()) errors.push("changedBy is required");
  if (Number.isNaN(new Date(state.effectiveAt).getTime())) errors.push("effectiveAt is invalid");
  return errors;
}

function validateEvent(event: ListingPublicationEvent, listing: Listing | undefined, now: Date) {
  const errors = [
    ...validatePublicationStateSnapshot(event.previous, "previous", now),
    ...validatePublicationStateSnapshot(event.next, "next", now)
  ];
  if (!listing || event.listingSourceId !== listing.provenance?.sourceId) errors.push("listing identity mismatch");
  if (!event.reviewedBy.trim() || !event.notes.trim()) errors.push("reviewer and notes are required");
  if (!event.evidence.length) errors.push("evidence is required");
  const eventWithoutId = {
    listingSlug: event.listingSlug,
    listingSourceId: event.listingSourceId,
    recordedAt: event.recordedAt,
    reviewedAt: event.reviewedAt,
    reviewedBy: event.reviewedBy,
    previous: event.previous,
    next: event.next,
    evidence: event.evidence,
    notes: event.notes
  };
  if (event.id !== publicationEventId(eventWithoutId)) errors.push("event ID mismatch");
  for (const timestamp of [event.recordedAt, event.reviewedAt]) {
    const parsed = new Date(timestamp);
    if (Number.isNaN(parsed.getTime()) || parsed.getTime() > now.getTime() + 5 * 60 * 1000) errors.push("invalid timestamp");
  }
  return errors;
}

function evidenceReferencesResolve(event: ListingPublicationEvent, options: ListingPublicationAuditOptions) {
  const verificationIds = new Set(options.verificationLedger?.events.map((item) => item.id) ?? []);
  return event.evidence.every((evidence) => {
    if (evidence.type === "external-source") return true;
    if (evidence.type === "verification-event") return verificationIds.has(evidence.eventId);
    return options.entityResolutionIds?.has(evidence.resolutionId) ?? false;
  });
}

function redirectCycleSlugs(stateBySlug: Map<string, ListingPublicationState>) {
  const cycles: string[] = [];
  for (const state of stateBySlug.values()) {
    const seen = new Set<string>();
    let current: ListingPublicationState | undefined = state;
    while (current?.successorSlug) {
      if (seen.has(current.listingSlug)) {
        cycles.push(state.listingSlug);
        break;
      }
      seen.add(current.listingSlug);
      current = stateBySlug.get(current.successorSlug);
    }
  }
  return cycles;
}

function addIssue(issues: ListingPublicationIssue[], samples: string[], code: string, severity: ListingPublicationSeverity, impact: string, recommendation: string) {
  const values = unique(samples);
  if (!values.length) return;
  issues.push({ code, severity, count: values.length, samples: values.slice(0, 10), impact, recommendation });
}

function groupBy<T>(items: T[], key: (item: T) => string) {
  const groups = new Map<string, T[]>();
  for (const item of items) groups.set(key(item), [...(groups.get(key(item)) ?? []), item]);
  return groups;
}

function duplicateKeys<T>(items: T[], key: (item: T) => string) {
  return [...groupBy(items, key)].filter(([, values]) => values.length > 1).map(([value]) => value);
}

function latestBy<T>(items: T[], key: (item: T) => string, timestamp: (item: T) => string) {
  const latest = new Map<string, T>();
  for (const item of items) {
    const current = latest.get(key(item));
    if (!current || timestamp(current) < timestamp(item)) latest.set(key(item), item);
  }
  return latest;
}

function eventOrder(left: ListingPublicationEvent, right: ListingPublicationEvent) {
  return left.reviewedAt.localeCompare(right.reviewedAt) || left.recordedAt.localeCompare(right.recordedAt) || left.id.localeCompare(right.id);
}

function sameSnapshot(left: PublicationStateSnapshot, right: PublicationStateSnapshot) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function unique(values: string[]) {
  return [...new Set(values)];
}
