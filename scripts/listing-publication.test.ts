import assert from "node:assert/strict";
import {
  applyPublicationDecision,
  validatePublicationDecisionProposal,
  type ListingPublicationDecisionProposal,
  type ListingPublicationState
} from "../src/lib/listing-publication";

const identity = { slug: "example-restaurant", sourceId: "place-1" };
const published: ListingPublicationState = {
  listingSlug: identity.slug,
  listingSourceId: identity.sourceId,
  status: "published",
  reason: "legacy-public-baseline",
  origin: "migration-baseline",
  effectiveAt: "2026-07-16T08:00:00.000Z",
  changedBy: "system:migration"
};

const pendingProposal: ListingPublicationDecisionProposal = {
  listingSlug: identity.slug,
  expectedSourceId: identity.sourceId,
  expectedCurrent: { status: "published", reason: "legacy-public-baseline" },
  reviewedAt: "2026-07-16T09:00:00.000Z",
  reviewedBy: "directory-editor",
  next: { status: "pending-review", reason: "identity-uncertain" },
  evidence: [{ type: "verification-event", eventId: "verification-example" }],
  notes: "Current identity evidence conflicts with the historical source record."
};

const now = new Date("2026-07-16T10:00:00.000Z");
assert.deepEqual(validatePublicationDecisionProposal(identity, published, pendingProposal, now), []);
const pending = applyPublicationDecision(identity, published, pendingProposal, now.toISOString());
assert.equal(pending.state.status, "pending-review");
assert.equal(pending.state.reason, "identity-uncertain");
assert.equal(pending.state.origin, "editorial-decision");
assert.equal(pending.event.previous.status, "published");
assert.equal(pending.state.lastDecisionEventId, pending.event.id);
const repeated = applyPublicationDecision(identity, published, pendingProposal, "2026-07-16T11:00:00.000Z");
assert.equal(repeated.event.id, pending.event.id, "recordedAt must not change the deterministic event ID");

const publishAgain: ListingPublicationDecisionProposal = {
  ...pendingProposal,
  expectedCurrent: { status: "pending-review", reason: "identity-uncertain" },
  next: { status: "published", reason: "review-resolved" },
  evidence: [{ type: "external-source", sourceName: "Official site", sourceUrl: "https://example.com", accessedAt: "2026-07-16T08:55:00.000Z" }],
  notes: "First-party evidence resolves the identity conflict."
};
assert.deepEqual(validatePublicationDecisionProposal(identity, pending.state, publishAgain, now), []);

const excluded = { ...pending.state, status: "excluded", reason: "confirmed-permanently-closed" } as ListingPublicationState;
const directReinstate = { ...publishAgain, expectedCurrent: { status: "excluded", reason: "confirmed-permanently-closed" } };
assert.ok(validatePublicationDecisionProposal(identity, excluded, directReinstate, now).some((error) => /must return to pending-review/.test(error)));

const superseded = {
  ...pendingProposal,
  next: { status: "excluded", reason: "superseded-by-canonical", successorSlug: "successor-restaurant" }
} as ListingPublicationDecisionProposal;
assert.ok(validatePublicationDecisionProposal(identity, published, superseded, now).some((error) => /entity-resolution evidence/.test(error)));
superseded.evidence = [{ type: "entity-resolution", resolutionId: "resolution-1" }];
assert.deepEqual(validatePublicationDecisionProposal(identity, published, superseded, now), []);

const temporary = {
  ...pendingProposal,
  next: { status: "pending-review", reason: "temporarily-closed" }
} as ListingPublicationDecisionProposal;
assert.ok(validatePublicationDecisionProposal(identity, published, temporary, now).some((error) => /recheckAt is required/.test(error)));

const staleExpected = structuredClone(pendingProposal);
staleExpected.expectedCurrent = { status: "pending-review", reason: "identity-uncertain" };
assert.ok(validatePublicationDecisionProposal(identity, published, staleExpected, now).some((error) => /does not match/.test(error)));

const unknownField = { ...pendingProposal, publicationStatus: "excluded" };
assert.ok(validatePublicationDecisionProposal(identity, published, unknownField, now).some((error) => /not allowed/.test(error)));

const noOp = { ...pendingProposal, next: pendingProposal.expectedCurrent };
assert.ok(validatePublicationDecisionProposal(identity, published, noOp, now).some((error) => /must change/.test(error)));

const initializationReason = { ...pendingProposal, next: { status: "pending-review", reason: "new-import" } } as ListingPublicationDecisionProposal;
assert.ok(validatePublicationDecisionProposal(identity, published, initializationReason, now).some((error) => /only be assigned/.test(error)));

console.log("listing publication tests passed");
