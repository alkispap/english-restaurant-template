import assert from "node:assert/strict";
import type { Listing } from "../src/data/listings";
import {
  applyListingVerification,
  validateListingVerificationProposal,
  type ListingVerificationProposal
} from "../src/lib/listing-verification";

const listing: Listing = {
  name: "Example Restaurant",
  slug: "example-restaurant",
  description: "Example Restaurant is an Indian restaurant in Westminster, London serving Indian food.",
  metaDescription: "Example Restaurant in Westminster serves Indian food with current contact and opening information.",
  images: [],
  categories: ["Indian"],
  listingTypes: ["Restaurant"],
  dietaryOptions: [],
  tags: [],
  rating: 4.2,
  reviewCount: 100,
  businessStatus: "Operational",
  address: "1 Example Road",
  postcode: "SW1A 1AA",
  contact: { website: "https://old.example.com", phone: "+44 20 0000 0000" },
  location: { latitude: 51.5, longitude: -0.1 },
  details: { workingHours: [{ day: "Monday", hours: "5-11pm" }] },
  provenance: {
    sourceName: "source.csv",
    sourceId: "place-1",
    importedAt: "2026-01-01T00:00:00.000Z",
    verificationStatus: "unverified"
  }
};

const verifiedProposal: ListingVerificationProposal = {
  listingSlug: listing.slug,
  checkedAt: "2026-07-10T10:00:00.000Z",
  reviewedBy: "directory-editor",
  outcome: "verified",
  verificationStatus: "editor-verified",
  evidence: [{
    sourceName: "Official restaurant website",
    sourceUrl: "https://example.com/contact",
    accessedAt: "2026-07-10T09:55:00.000Z"
  }],
  fieldsChecked: [
    "name",
    "description",
    "metaDescription",
    "address",
    "postcode",
    "businessStatus",
    "contact.website",
    "contact.phone",
    "details.workingHours"
  ],
  changes: [
    {
      field: "description",
      value: "Example Restaurant is an Indian restaurant in Westminster, London serving regional Indian food.",
      reason: "The current cuisine evidence supports a more specific first sentence."
    },
    {
      field: "contact.website",
      value: "https://example.com",
      reason: "The official contact page uses the canonical domain."
    }
  ]
};

assert.deepEqual(validateListingVerificationProposal(listing, verifiedProposal, new Date("2026-07-10T11:00:00.000Z")), []);
const verified = applyListingVerification(listing, verifiedProposal, "2026-07-10T11:00:00.000Z");
assert.equal(verified.listing.contact?.website, "https://example.com");
assert.match(verified.listing.description ?? "", /regional Indian food/);
assert.equal(verified.listing.provenance?.verificationStatus, "editor-verified");
assert.equal(verified.listing.provenance?.lastVerifiedAt, "2026-07-10T10:00:00.000Z");
assert.equal(verified.listing.provenance?.lastVerificationEventId, verified.event.id);
assert.match(String(verified.event.changes[0].previousValue), /serving Indian food/);
assert.equal(verified.event.changes[0].applied, true);
assert.equal(listing.contact?.website, "https://old.example.com", "the original listing must remain unchanged");
const repeated = applyListingVerification(verified.listing, verifiedProposal, "2026-07-10T12:00:00.000Z");
assert.equal(repeated.event.id, verified.event.id, "the same proposal must keep one id across repeated runs");

const conflictProposal: ListingVerificationProposal = {
  listingSlug: listing.slug,
  checkedAt: "2026-07-10T10:00:00.000Z",
  reviewedBy: "directory-editor",
  outcome: "needs-review",
  evidence: [
    { sourceName: "Official website", sourceUrl: "https://example.com", accessedAt: "2026-07-10T09:50:00.000Z" },
    { sourceName: "Premises listing", sourceUrl: "https://directory.example.org/place", accessedAt: "2026-07-10T09:51:00.000Z" }
  ],
  fieldsChecked: ["name", "address"],
  changes: [{ field: "name", value: "Candidate Name", reason: "Sources disagree on the current trading name." }],
  notes: "Do not change the canonical record until the premises identity is confirmed."
};
const conflict = applyListingVerification(listing, conflictProposal, "2026-07-10T11:00:00.000Z");
assert.equal(conflict.listing.name, listing.name);
assert.equal(conflict.listing.provenance?.verificationStatus, "unverified");
assert.equal(conflict.event.changes[0].applied, false);

const invalid = structuredClone(verifiedProposal) as ListingVerificationProposal;
invalid.fieldsChecked = ["rating"];
invalid.changes = [{ field: "rating", value: 4.5, reason: "Updated rating" }];
assert.ok(
  validateListingVerificationProposal(listing, invalid, new Date("2026-07-10T11:00:00.000Z"))
    .includes("candidate listing must keep rating and reviewCount as a complete pair") === false,
  "changing one member of an existing complete pair remains valid"
);

const missingEvidence = structuredClone(verifiedProposal) as ListingVerificationProposal;
missingEvidence.evidence = [];
assert.match(validateListingVerificationProposal(listing, missingEvidence)[0], /evidence source/);

const badField = structuredClone(verifiedProposal) as unknown as { fieldsChecked: string[] };
badField.fieldsChecked = ["slug"];
assert.ok(validateListingVerificationProposal(listing, badField as never).some((error) => /not a supported/.test(error)));

const publicationField = { ...verifiedProposal, publicationStatus: "excluded" };
assert.ok(
  validateListingVerificationProposal(listing, publicationField as never).some((error) => /publicationStatus is not allowed/.test(error)),
  "verification proposals must not carry publication decisions"
);

console.log("listing verification tests passed");
