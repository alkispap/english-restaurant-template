import crypto from "node:crypto";

export const publicationStatuses = ["published", "pending-review", "excluded"] as const;

export const publicationReasons = {
  published: ["legacy-public-baseline", "reviewed-in-scope", "review-resolved", "reinstated"],
  "pending-review": [
    "new-import",
    "identity-uncertain",
    "scope-uncertain",
    "operating-status-uncertain",
    "material-data-conflict",
    "temporarily-closed",
    "correction-under-review"
  ],
  excluded: [
    "out-of-directory-scope",
    "confirmed-permanently-closed",
    "invalid-import",
    "superseded-by-canonical"
  ]
} as const;

export type PublicationStatus = (typeof publicationStatuses)[number];
export type PublishedReason = (typeof publicationReasons.published)[number];
export type PendingReviewReason = (typeof publicationReasons)["pending-review"][number];
export type ExcludedReason = (typeof publicationReasons.excluded)[number];
export type PublicationReason = PublishedReason | PendingReviewReason | ExcludedReason;
export type PublicationStateOrigin = "migration-baseline" | "import-default" | "editorial-decision";

export type PublicationStateSnapshot = {
  status: PublicationStatus;
  reason: PublicationReason;
  successorSlug?: string;
  recheckAt?: string;
};

export type ListingPublicationState = PublicationStateSnapshot & {
  listingSlug: string;
  listingSourceId?: string;
  origin: PublicationStateOrigin;
  effectiveAt: string;
  changedBy: string;
  lastDecisionEventId?: string;
};

export type PublicationExternalEvidence = {
  type: "external-source";
  sourceName: string;
  sourceUrl: string;
  accessedAt: string;
};

export type PublicationVerificationEvidence = {
  type: "verification-event";
  eventId: string;
};

export type PublicationEntityResolutionEvidence = {
  type: "entity-resolution";
  resolutionId: string;
};

export type PublicationEvidence =
  | PublicationExternalEvidence
  | PublicationVerificationEvidence
  | PublicationEntityResolutionEvidence;

export type ListingPublicationDecisionProposal = {
  listingSlug: string;
  expectedSourceId?: string;
  expectedCurrent: PublicationStateSnapshot;
  reviewedAt: string;
  reviewedBy: string;
  next: PublicationStateSnapshot;
  evidence: PublicationEvidence[];
  notes: string;
};

export type ListingPublicationEvent = {
  id: string;
  listingSlug: string;
  listingSourceId?: string;
  recordedAt: string;
  reviewedAt: string;
  reviewedBy: string;
  previous: PublicationStateSnapshot;
  next: PublicationStateSnapshot;
  evidence: PublicationEvidence[];
  notes: string;
};

export type ListingPublicationLedger = {
  version: 1;
  events: ListingPublicationEvent[];
};

export type ListingPublicationBaseline = {
  id: string;
  createdAt: string;
  sourceSha256: string;
  listingCount: number;
  actor: "system:migration";
  reason: "legacy-public-baseline";
};

export type ListingPublicationRegistry = {
  version: 1;
  baseline: ListingPublicationBaseline;
  entries: ListingPublicationState[];
};

export type PublicationListingIdentity = {
  slug: string;
  sourceId?: string;
};

export type ApplyPublicationDecisionResult = {
  state: ListingPublicationState;
  event: ListingPublicationEvent;
  changed: boolean;
};

const proposalKeys = new Set(["listingSlug", "expectedSourceId", "expectedCurrent", "reviewedAt", "reviewedBy", "next", "evidence", "notes"]);
const snapshotKeys = new Set(["status", "reason", "successorSlug", "recheckAt"]);
const externalEvidenceKeys = new Set(["type", "sourceName", "sourceUrl", "accessedAt"]);
const verificationEvidenceKeys = new Set(["type", "eventId"]);
const entityEvidenceKeys = new Set(["type", "resolutionId"]);

export function validatePublicationDecisionProposal(
  identity: PublicationListingIdentity | undefined,
  current: ListingPublicationState | undefined,
  rawProposal: unknown,
  now = new Date()
) {
  const errors: string[] = [];
  if (!isRecord(rawProposal)) return ["proposal must be a JSON object"];
  rejectUnknownKeys(rawProposal, proposalKeys, "proposal", errors);

  const proposal = rawProposal as Partial<ListingPublicationDecisionProposal>;
  if (!identity) errors.push(`Unknown listing slug: ${clean(proposal.listingSlug) || "(blank)"}`);
  if (!current) errors.push(`Missing publication state for: ${clean(proposal.listingSlug) || "(blank)"}`);
  if (identity && clean(proposal.listingSlug) !== identity.slug) errors.push("listingSlug does not match the selected listing");
  if (identity && proposal.expectedSourceId !== identity.sourceId) errors.push("expectedSourceId does not match the canonical listing source ID");
  if (!clean(proposal.reviewedBy)) errors.push("reviewedBy is required");
  if (!clean(proposal.notes)) errors.push("notes are required");
  validateTimestamp("reviewedAt", proposal.reviewedAt, now, errors);

  validateSnapshot(proposal.expectedCurrent, "expectedCurrent", now, errors);
  validateSnapshot(proposal.next, "next", now, errors);
  if (current && isSnapshot(proposal.expectedCurrent) && !sameSnapshot(snapshotFromState(current), proposal.expectedCurrent)) {
    errors.push("expectedCurrent does not match the current publication state");
  }

  if (!Array.isArray(proposal.evidence) || proposal.evidence.length === 0) {
    errors.push("at least one publication evidence reference is required");
  } else {
    proposal.evidence.forEach((evidence, index) => validateEvidence(evidence, index, now, errors));
  }

  if (current && isSnapshot(proposal.next) && isSnapshot(proposal.expectedCurrent)) {
    validateTransition(current.status, proposal.next, proposal.evidence ?? [], errors);
    if (sameSnapshot(proposal.expectedCurrent, proposal.next)) errors.push("publication decision must change status or state metadata");
  }

  return [...new Set(errors)];
}

export function applyPublicationDecision(
  identity: PublicationListingIdentity,
  current: ListingPublicationState,
  proposal: ListingPublicationDecisionProposal,
  recordedAt = new Date().toISOString()
): ApplyPublicationDecisionResult {
  const errors = validatePublicationDecisionProposal(identity, current, proposal, new Date(recordedAt));
  if (errors.length) throw new Error(errors.join("\n"));

  const previous = snapshotFromState(current);
  const next = normalizedSnapshot(proposal.next);
  const eventWithoutId = {
    listingSlug: identity.slug,
    listingSourceId: identity.sourceId,
    recordedAt: normalizeTimestamp(recordedAt),
    reviewedAt: normalizeTimestamp(proposal.reviewedAt),
    reviewedBy: proposal.reviewedBy.trim(),
    previous,
    next,
    evidence: proposal.evidence.map(normalizeEvidence),
    notes: proposal.notes.trim()
  } satisfies Omit<ListingPublicationEvent, "id">;
  const event: ListingPublicationEvent = { id: publicationEventId(eventWithoutId), ...eventWithoutId };
  const state: ListingPublicationState = {
    listingSlug: identity.slug,
    listingSourceId: identity.sourceId,
    ...next,
    origin: "editorial-decision",
    effectiveAt: event.reviewedAt,
    changedBy: event.reviewedBy,
    lastDecisionEventId: event.id
  };

  return { state, event, changed: !sameSnapshot(previous, next) };
}

export function snapshotFromState(state: ListingPublicationState): PublicationStateSnapshot {
  return normalizedSnapshot(state);
}

export function validatePublicationStateSnapshot(value: unknown, label = "state", now = new Date()) {
  const errors: string[] = [];
  validateSnapshot(value, label, now, errors);
  return [...new Set(errors)];
}

export function isPublishedState(state: ListingPublicationState | undefined) {
  return state?.status === "published";
}

export function isPendingReviewState(state: ListingPublicationState | undefined) {
  return state?.status === "pending-review";
}

export function publicationEventId(event: Omit<ListingPublicationEvent, "id">) {
  const identity = {
    listingSlug: event.listingSlug,
    listingSourceId: event.listingSourceId,
    reviewedAt: event.reviewedAt,
    reviewedBy: event.reviewedBy,
    previous: event.previous,
    next: event.next,
    evidence: event.evidence,
    notes: event.notes
  };
  const digest = crypto.createHash("sha256").update(JSON.stringify(identity)).digest("hex").slice(0, 12);
  return `publication-${event.reviewedAt.slice(0, 10)}-${event.listingSlug}-${digest}`;
}

function validateTransition(from: PublicationStatus, next: PublicationStateSnapshot, evidence: PublicationEvidence[], errors: string[]) {
  if (from === "excluded" && next.status === "published") {
    errors.push("excluded listings must return to pending-review before publication");
  }
  if (next.reason === "legacy-public-baseline" || next.reason === "new-import") {
    errors.push(`${next.reason} can only be assigned by migration or import initialization`);
  }
  if (next.reason === "superseded-by-canonical" && !evidence.some((item) => item.type === "entity-resolution")) {
    errors.push("superseded-by-canonical requires entity-resolution evidence");
  }
}

function validateSnapshot(value: unknown, label: string, now: Date, errors: string[]) {
  if (!isRecord(value)) {
    errors.push(`${label} must be an object`);
    return;
  }
  rejectUnknownKeys(value, snapshotKeys, label, errors);
  const status = value.status;
  const reason = value.reason;
  if (!isPublicationStatus(status)) errors.push(`${label}.status is invalid`);
  if (!isPublicationReason(reason)) errors.push(`${label}.reason is invalid`);
  if (isPublicationStatus(status) && isPublicationReason(reason) && !reasonMatchesStatus(status, reason)) {
    errors.push(`${label}.reason is not allowed for ${status}`);
  }
  const successorSlug = clean(value.successorSlug);
  if (value.successorSlug !== undefined && !successorSlug) errors.push(`${label}.successorSlug must be a non-empty slug`);
  if (successorSlug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(successorSlug)) errors.push(`${label}.successorSlug must use canonical slug syntax`);
  if (reason === "superseded-by-canonical" && !successorSlug) errors.push(`${label}.successorSlug is required for superseded-by-canonical`);
  if (successorSlug && reason !== "superseded-by-canonical") errors.push(`${label}.successorSlug is only allowed for superseded-by-canonical`);
  if (reason === "temporarily-closed" && value.recheckAt === undefined) errors.push(`${label}.recheckAt is required for temporarily-closed`);
  if (value.recheckAt !== undefined) {
    validateTimestamp(`${label}.recheckAt`, value.recheckAt, new Date("9999-12-31T23:59:59.999Z"), errors);
    const parsed = new Date(typeof value.recheckAt === "string" ? value.recheckAt : "");
    if (!Number.isNaN(parsed.getTime()) && parsed.getTime() <= now.getTime()) errors.push(`${label}.recheckAt must be in the future`);
    if (status !== "pending-review") errors.push(`${label}.recheckAt is only allowed for pending-review`);
  }
}

function validateEvidence(value: unknown, index: number, now: Date, errors: string[]) {
  const label = `evidence[${index}]`;
  if (!isRecord(value)) {
    errors.push(`${label} must be an object`);
    return;
  }
  if (value.type === "external-source") {
    rejectUnknownKeys(value, externalEvidenceKeys, label, errors);
    if (!clean(value.sourceName)) errors.push(`${label}.sourceName is required`);
    if (!isHttpUrl(value.sourceUrl)) errors.push(`${label}.sourceUrl must be an absolute HTTP(S) URL`);
    validateTimestamp(`${label}.accessedAt`, value.accessedAt, now, errors);
    return;
  }
  if (value.type === "verification-event") {
    rejectUnknownKeys(value, verificationEvidenceKeys, label, errors);
    if (!clean(value.eventId)) errors.push(`${label}.eventId is required`);
    return;
  }
  if (value.type === "entity-resolution") {
    rejectUnknownKeys(value, entityEvidenceKeys, label, errors);
    if (!clean(value.resolutionId)) errors.push(`${label}.resolutionId is required`);
    return;
  }
  errors.push(`${label}.type is invalid`);
}

function normalizedSnapshot(value: PublicationStateSnapshot): PublicationStateSnapshot {
  return {
    status: value.status,
    reason: value.reason,
    ...(clean(value.successorSlug) ? { successorSlug: clean(value.successorSlug) } : {}),
    ...(value.recheckAt ? { recheckAt: normalizeTimestamp(value.recheckAt) } : {})
  };
}

function normalizeEvidence(evidence: PublicationEvidence): PublicationEvidence {
  if (evidence.type === "external-source") {
    return {
      type: evidence.type,
      sourceName: evidence.sourceName.trim(),
      sourceUrl: evidence.sourceUrl.trim(),
      accessedAt: normalizeTimestamp(evidence.accessedAt)
    };
  }
  return evidence.type === "verification-event"
    ? { type: evidence.type, eventId: evidence.eventId.trim() }
    : { type: evidence.type, resolutionId: evidence.resolutionId.trim() };
}

function reasonMatchesStatus(status: PublicationStatus, reason: PublicationReason) {
  return (publicationReasons[status] as readonly string[]).includes(reason);
}

function isPublicationStatus(value: unknown): value is PublicationStatus {
  return typeof value === "string" && (publicationStatuses as readonly string[]).includes(value);
}

function isPublicationReason(value: unknown): value is PublicationReason {
  return typeof value === "string" && Object.values(publicationReasons).some((items) => (items as readonly string[]).includes(value));
}

function isSnapshot(value: unknown): value is PublicationStateSnapshot {
  return isRecord(value) && isPublicationStatus(value.status) && isPublicationReason(value.reason);
}

function sameSnapshot(left: PublicationStateSnapshot, right: PublicationStateSnapshot) {
  return JSON.stringify(normalizedSnapshot(left)) === JSON.stringify(normalizedSnapshot(right));
}

function rejectUnknownKeys(value: Record<string, unknown>, allowed: Set<string>, label: string, errors: string[]) {
  for (const key of Object.keys(value)) if (!allowed.has(key)) errors.push(`${label}.${key} is not allowed`);
}

function validateTimestamp(label: string, value: unknown, now: Date, errors: string[]) {
  const parsed = new Date(typeof value === "string" ? value : "");
  if (Number.isNaN(parsed.getTime())) {
    errors.push(`${label} must be a valid ISO timestamp`);
    return;
  }
  if (parsed.getTime() > now.getTime() + 5 * 60 * 1000) errors.push(`${label} cannot be in the future`);
}

function normalizeTimestamp(value: string) {
  return new Date(value).toISOString();
}

function isHttpUrl(value: unknown) {
  if (typeof value !== "string") return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
