import crypto from "node:crypto";
import type { Listing, ListingProvenance } from "@/data/listings";

export const listingVerificationFields = [
  "name",
  "address",
  "fullAddress",
  "postcode",
  "area",
  "neighborhood",
  "borough",
  "city",
  "categories",
  "listingTypes",
  "dietaryOptions",
  "tags",
  "priceLevel",
  "rating",
  "reviewCount",
  "businessStatus",
  "contact.website",
  "contact.phone",
  "contact.phoneAlt",
  "contact.email",
  "contact.contactUrl",
  "contact.googleReviewsUrl",
  "contact.orderOnlineUrl",
  "contact.reserveUrl",
  "contact.appointmentUrl",
  "contact.menuUrl",
  "location.latitude",
  "location.longitude",
  "location.googleMapsUrl",
  "details.workingHours",
  "details.workingHoursText",
  "details.serviceOptions",
  "details.highlights",
  "details.popularFor",
  "details.accessibility",
  "details.offerings",
  "details.diningOptions",
  "details.amenities",
  "details.atmosphere",
  "details.crowd",
  "details.planning",
  "details.payments",
  "details.children",
  "details.parking",
  "details.pets"
] as const;

export type ListingVerificationField = (typeof listingVerificationFields)[number];
export type VerifiedListingStatus = Exclude<ListingProvenance["verificationStatus"], "unverified">;

export type ListingVerificationEvidence = {
  sourceName: string;
  sourceUrl: string;
  accessedAt: string;
};

export type ListingVerificationProposalChange = {
  field: ListingVerificationField;
  value: unknown;
  reason: string;
};

export type ListingVerificationProposal = {
  listingSlug: string;
  checkedAt: string;
  reviewedBy: string;
  outcome: "verified" | "needs-review";
  verificationStatus?: VerifiedListingStatus;
  evidence: ListingVerificationEvidence[];
  fieldsChecked: ListingVerificationField[];
  changes?: ListingVerificationProposalChange[];
  notes?: string;
};

export type ListingVerificationChange = ListingVerificationProposalChange & {
  previousValue: unknown;
  applied: boolean;
};

export type ListingVerificationEvent = {
  id: string;
  listingSlug: string;
  listingSourceId?: string;
  recordedAt: string;
  checkedAt: string;
  reviewedBy: string;
  outcome: "verified" | "needs-review";
  verificationStatus?: VerifiedListingStatus;
  evidence: ListingVerificationEvidence[];
  fieldsChecked: ListingVerificationField[];
  changes: ListingVerificationChange[];
  notes?: string;
};

export type ListingVerificationLedger = {
  version: 1;
  events: ListingVerificationEvent[];
};

export type ApplyListingVerificationResult = {
  listing: Listing;
  event: ListingVerificationEvent;
  changed: boolean;
};

const allowedFieldSet = new Set<string>(listingVerificationFields);
const proposalKeySet = new Set(["listingSlug", "checkedAt", "reviewedBy", "outcome", "verificationStatus", "evidence", "fieldsChecked", "changes", "notes"]);
const evidenceKeySet = new Set(["sourceName", "sourceUrl", "accessedAt"]);
const changeKeySet = new Set(["field", "value", "reason"]);
const stringArrayFields = new Set<ListingVerificationField>([
  "categories",
  "listingTypes",
  "dietaryOptions",
  "tags",
  "details.serviceOptions",
  "details.highlights",
  "details.popularFor",
  "details.accessibility",
  "details.offerings",
  "details.diningOptions",
  "details.amenities",
  "details.atmosphere",
  "details.crowd",
  "details.planning",
  "details.payments",
  "details.children",
  "details.parking",
  "details.pets"
]);
const urlFields = new Set<ListingVerificationField>([
  "contact.website",
  "contact.contactUrl",
  "contact.googleReviewsUrl",
  "contact.orderOnlineUrl",
  "contact.reserveUrl",
  "contact.appointmentUrl",
  "contact.menuUrl",
  "location.googleMapsUrl"
]);
const nullableStringFields = new Set<ListingVerificationField>([
  "address",
  "fullAddress",
  "postcode",
  "area",
  "neighborhood",
  "borough",
  "city",
  "businessStatus",
  "contact.phone",
  "contact.phoneAlt",
  "contact.email",
  "details.workingHoursText"
]);

export function validateListingVerificationProposal(
  listing: Listing | undefined,
  proposal: ListingVerificationProposal,
  now = new Date()
) {
  const errors: string[] = [];
  if (isRecord(proposal)) rejectUnknownKeys(proposal, proposalKeySet, "proposal", errors);
  if (!listing) errors.push(`Unknown listing slug: ${clean(proposal.listingSlug) || "(blank)"}`);
  if (!clean(proposal.reviewedBy)) errors.push("reviewedBy is required");
  validateTimestamp("checkedAt", proposal.checkedAt, now, errors);
  if (proposal.outcome !== "verified" && proposal.outcome !== "needs-review") {
    errors.push("outcome must be verified or needs-review");
  }
  if (proposal.outcome === "verified" && !isVerifiedStatus(proposal.verificationStatus)) {
    errors.push("verificationStatus must be source-verified or editor-verified for a verified outcome");
  }
  if (proposal.outcome === "needs-review" && proposal.verificationStatus) {
    errors.push("needs-review events must not claim a verificationStatus");
  }
  if (proposal.outcome === "needs-review" && !clean(proposal.notes)) {
    errors.push("needs-review events require notes explaining the unresolved conflict");
  }
  if (!Array.isArray(proposal.evidence) || proposal.evidence.length === 0) {
    errors.push("at least one evidence source is required");
  } else {
    proposal.evidence.forEach((evidence, index) => {
      if (isRecord(evidence)) rejectUnknownKeys(evidence, evidenceKeySet, `evidence[${index}]`, errors);
      if (!clean(evidence.sourceName)) errors.push(`evidence[${index}].sourceName is required`);
      if (!isHttpUrl(evidence.sourceUrl)) errors.push(`evidence[${index}].sourceUrl must be an absolute HTTP(S) URL`);
      validateTimestamp(`evidence[${index}].accessedAt`, evidence.accessedAt, now, errors);
    });
  }
  if (!Array.isArray(proposal.fieldsChecked) || proposal.fieldsChecked.length === 0) {
    errors.push("fieldsChecked must contain at least one supported field");
  } else {
    validateUniqueFields(proposal.fieldsChecked, "fieldsChecked", errors);
  }

  const changes = proposal.changes ?? [];
  validateUniqueFields(changes.map((change) => change.field), "changes", errors);
  for (const [index, change] of changes.entries()) {
    if (isRecord(change)) rejectUnknownKeys(change, changeKeySet, `changes[${index}]`, errors);
    if (!proposal.fieldsChecked?.includes(change.field)) {
      errors.push(`changes[${index}].field must also appear in fieldsChecked`);
    }
    if (!clean(change.reason)) errors.push(`changes[${index}].reason is required`);
    validateFieldValue(change.field, change.value, errors, `changes[${index}].value`);
  }

  if (listing && proposal.outcome === "verified") {
    const candidate = cloneListing(listing);
    for (const change of changes) setFieldValue(candidate, change.field, change.value);
    validateCandidateListing(candidate, errors);
  }
  return [...new Set(errors)];
}

export function applyListingVerification(
  listing: Listing,
  proposal: ListingVerificationProposal,
  recordedAt = new Date().toISOString()
): ApplyListingVerificationResult {
  const errors = validateListingVerificationProposal(listing, proposal, new Date(recordedAt));
  if (errors.length) throw new Error(errors.join("\n"));

  const updated = cloneListing(listing);
  const applied = proposal.outcome === "verified";
  const changes = (proposal.changes ?? []).map((change) => ({
    ...change,
    previousValue: cloneValue(getFieldValue(listing, change.field)),
    applied
  }));
  if (applied) {
    for (const change of proposal.changes ?? []) setFieldValue(updated, change.field, change.value);
  }

  const eventWithoutId = {
    listingSlug: listing.slug,
    listingSourceId: listing.provenance?.sourceId,
    recordedAt: normalizeTimestamp(recordedAt),
    checkedAt: normalizeTimestamp(proposal.checkedAt),
    reviewedBy: proposal.reviewedBy.trim(),
    outcome: proposal.outcome,
    verificationStatus: proposal.outcome === "verified" ? proposal.verificationStatus : undefined,
    evidence: proposal.evidence.map((evidence) => ({
      sourceName: evidence.sourceName.trim(),
      sourceUrl: evidence.sourceUrl.trim(),
      accessedAt: normalizeTimestamp(evidence.accessedAt)
    })),
    fieldsChecked: [...proposal.fieldsChecked],
    changes,
    notes: clean(proposal.notes) || undefined
  } satisfies Omit<ListingVerificationEvent, "id">;
  const event: ListingVerificationEvent = {
    id: eventId(eventWithoutId),
    ...eventWithoutId
  };

  if (applied) {
    updated.provenance = {
      ...(updated.provenance ?? { sourceName: "manual-verification", verificationStatus: "unverified" }),
      verificationStatus: proposal.verificationStatus!,
      lastVerifiedAt: event.checkedAt,
      lastVerificationEventId: event.id
    };
  }

  return {
    listing: updated,
    event,
    changed: applied && (changes.some((change) => !sameValue(change.previousValue, change.value)) ||
      listing.provenance?.lastVerificationEventId !== event.id)
  };
}

export function isListingVerificationField(value: unknown): value is ListingVerificationField {
  return typeof value === "string" && allowedFieldSet.has(value);
}

function validateUniqueFields(fields: unknown[], label: string, errors: string[]) {
  const seen = new Set<string>();
  for (const [index, field] of fields.entries()) {
    if (!isListingVerificationField(field)) {
      errors.push(`${label}[${index}] is not a supported verification field`);
      continue;
    }
    if (seen.has(field)) errors.push(`${label} contains duplicate field: ${field}`);
    seen.add(field);
  }
}

function validateFieldValue(field: ListingVerificationField, value: unknown, errors: string[], label: string) {
  if (!isListingVerificationField(field)) return;
  if (value === null) {
    if (field === "name" || stringArrayFields.has(field)) errors.push(`${label} cannot be null for ${field}`);
    return;
  }
  if (stringArrayFields.has(field)) {
    if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || !item.trim())) {
      errors.push(`${label} must be an array of non-empty strings for ${field}`);
    }
    return;
  }
  if (field === "details.workingHours") {
    if (!Array.isArray(value) || value.some((item) => !isWorkingHoursRow(item))) {
      errors.push(`${label} must contain { day, hours } rows`);
    }
    return;
  }
  if (field === "rating") {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 5) errors.push(`${label} must be a number from 0 to 5`);
    return;
  }
  if (field === "reviewCount") {
    if (typeof value !== "number" || !Number.isInteger(value) || value < 0) errors.push(`${label} must be a non-negative integer`);
    return;
  }
  if (field === "location.latitude") {
    if (typeof value !== "number" || !Number.isFinite(value) || value < -90 || value > 90) errors.push(`${label} must be a valid latitude`);
    return;
  }
  if (field === "location.longitude") {
    if (typeof value !== "number" || !Number.isFinite(value) || value < -180 || value > 180) errors.push(`${label} must be a valid longitude`);
    return;
  }
  if (field === "priceLevel") {
    if (value !== "£" && value !== "££" && value !== "£££") errors.push(`${label} must be £, ££, £££, or null`);
    return;
  }
  if (urlFields.has(field)) {
    if (typeof value !== "string" || !isHttpUrl(value)) errors.push(`${label} must be an absolute HTTP(S) URL or null`);
    return;
  }
  if (field === "contact.email") {
    if (typeof value !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors.push(`${label} must be a valid email address or null`);
    return;
  }
  if (field === "name") {
    if (typeof value !== "string" || !value.trim()) errors.push(`${label} must be a non-empty string`);
    return;
  }
  if (nullableStringFields.has(field)) {
    if (typeof value !== "string" || !value.trim()) errors.push(`${label} must be a non-empty string or null`);
    return;
  }
  errors.push(`${label} has no validator for ${field}`);
}

function validateCandidateListing(listing: Listing, errors: string[]) {
  if (!clean(listing.name)) errors.push("candidate listing name cannot be empty");
  if ((listing.rating === undefined) !== (listing.reviewCount === undefined)) {
    errors.push("candidate listing must keep rating and reviewCount as a complete pair");
  }
  const latitude = listing.location?.latitude;
  const longitude = listing.location?.longitude;
  if ((latitude === undefined) !== (longitude === undefined)) {
    errors.push("candidate listing must keep latitude and longitude as a complete pair");
  }
}

function validateTimestamp(label: string, value: unknown, now: Date, errors: string[]) {
  const parsed = new Date(typeof value === "string" ? value : "");
  if (Number.isNaN(parsed.getTime())) {
    errors.push(`${label} must be a valid ISO timestamp`);
    return;
  }
  if (parsed.getTime() > now.getTime() + 5 * 60 * 1000) errors.push(`${label} cannot be in the future`);
}

function getFieldValue(listing: Listing, field: ListingVerificationField) {
  return field.split(".").reduce<unknown>((value, key) => {
    if (!value || typeof value !== "object") return undefined;
    return (value as Record<string, unknown>)[key];
  }, listing);
}

function setFieldValue(listing: Listing, field: ListingVerificationField, rawValue: unknown) {
  const keys = field.split(".");
  let target = listing as unknown as Record<string, unknown>;
  for (const key of keys.slice(0, -1)) {
    const existing = target[key];
    if (!existing || typeof existing !== "object" || Array.isArray(existing)) target[key] = {};
    target = target[key] as Record<string, unknown>;
  }
  const key = keys[keys.length - 1];
  if (rawValue === null) delete target[key];
  else target[key] = cloneValue(rawValue);
}

function cloneListing(listing: Listing): Listing {
  return JSON.parse(JSON.stringify(listing)) as Listing;
}

function cloneValue(value: unknown) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function sameValue(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right === null ? undefined : right);
}

function eventId(event: Omit<ListingVerificationEvent, "id">) {
  const identity = {
    listingSlug: event.listingSlug,
    listingSourceId: event.listingSourceId,
    checkedAt: event.checkedAt,
    reviewedBy: event.reviewedBy,
    outcome: event.outcome,
    verificationStatus: event.verificationStatus,
    evidence: event.evidence,
    fieldsChecked: event.fieldsChecked,
    changes: event.changes.map(({ field, value, reason, applied }) => ({ field, value, reason, applied })),
    notes: event.notes
  };
  const digest = crypto.createHash("sha256").update(JSON.stringify(identity)).digest("hex").slice(0, 12);
  return `verification-${event.checkedAt.slice(0, 10)}-${event.listingSlug}-${digest}`;
}

function isVerifiedStatus(value: unknown): value is VerifiedListingStatus {
  return value === "source-verified" || value === "editor-verified";
}

function isWorkingHoursRow(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  return typeof row.day === "string" && Boolean(row.day.trim()) && typeof row.hours === "string" && Boolean(row.hours.trim());
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

function rejectUnknownKeys(value: Record<string, unknown>, allowed: Set<string>, label: string, errors: string[]) {
  for (const key of Object.keys(value)) if (!allowed.has(key)) errors.push(`${label}.${key} is not allowed`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeTimestamp(value: string) {
  return new Date(value).toISOString();
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
