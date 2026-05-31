# Semantic Template Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the Indian Restaurants London directory with stronger semantic structure, clearer listing facts, better contextual internal links, and reusable checks for future copied directories.

**Architecture:** Add a small semantic-governance layer beside the existing SEO policy. Keep it report-only and template-driven first, then use it to improve visible listing detail sections, page-brief compliance, entity consistency, and internal link quality without creating more indexable pages.

**Tech Stack:** Next.js 15, React 19, TypeScript, existing `tsx` script tests, existing directory data/config modules.

**Template Constraint:** This project is a reusable template, so missing listing images are not part of this implementation scope. Freshness/image warnings should remain useful for real launch projects, but the implementer must not spend this slice fixing image gaps.

---

## File Structure

- Create `src/lib/directory-semantic-map.ts`: reusable semantic map/page brief definitions for homepage, hub pages, listing pages, copied directory checks, macro context, core/supporting page roles, and required identity phrases.
- Create `src/lib/listing-eav-summary.ts`: factual listing summary helpers for location, reviews, services, dietary options, transport, and contact actions.
- Modify `src/app/listings/[slug]/page.tsx`: add question-led factual summaries and contextual bridge section labels.
- Modify `src/lib/directory-growth.ts`: reduce and group listing explore links by semantic purpose.
- Create `src/lib/internal-link-audit.ts`: report-only semantic/internal link governance audit for link flow, anchor clarity, page-brief compliance, generic copy, and entity consistency.
- Create `scripts/check-internal-links.ts`: CLI wrapper for the semantic/internal link audit.
- Modify `package.json`: add `audit:links`.
- Create tests in `scripts/semantic-map.test.ts`, `scripts/listing-eav-summary.test.ts`, and `scripts/internal-link-audit.test.ts`.
- Modify `scripts/run-tests.ts`: include the new tests if the runner uses an explicit list.
- Modify `TEMPLATE_GUIDE.md`: document the new workflow for future copied directories.

---

## Task 1: Add Semantic Map And Page Briefs

**Files:**
- Create: `src/lib/directory-semantic-map.ts`
- Test: `scripts/semantic-map.test.ts`

- [ ] **Step 1: Write the semantic map test**

```ts
import { directorySemanticMap, getPageBrief } from "../src/lib/directory-semantic-map";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const listingBrief = getPageBrief("listing_detail");
assert(listingBrief.primaryEntity === "local business listing", "listing detail primary entity should be stable");
assert(listingBrief.macroContext === "single business evaluation", "listing detail should have one macro context");
assert(listingBrief.networkRole === "core", "listing detail should be a core page role");
assert(listingBrief.requiredEavGroups.includes("location"), "listing detail should require location EAV");
assert(listingBrief.requiredEavGroups.includes("contactActions"), "listing detail should require contact actions EAV");
assert(listingBrief.allowedLinkTargets.includes("area_hub"), "listing detail should link to area hubs");

const copiedTerms = directorySemanticMap.copySafety.blockedStaleTerms;
assert(copiedTerms.includes("indian"), "copy safety should block stale Indian wording for non-Indian copies");
assert(directorySemanticMap.requiredIdentityPhrases.includes("Indian restaurants in London"), "identity phrases should reinforce the current central intent");
assert(directorySemanticMap.centralEntity.length > 0, "central entity should be configured");
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node .\node_modules\tsx\dist\cli.mjs .\scripts\semantic-map.test.ts`

Expected: fails because `src/lib/directory-semantic-map.ts` does not exist.

- [ ] **Step 3: Implement the semantic map**

```ts
import { siteConfig } from "@/config/site";

export type DirectoryPageTypeBrief =
  | "homepage"
  | "listing_detail"
  | "area_hub"
  | "category_hub"
  | "area_category_hub"
  | "neighborhood_hub"
  | "best_hub"
  | "facet_hub";

export type EavGroup =
  | "identity"
  | "location"
  | "category"
  | "reviews"
  | "price"
  | "services"
  | "dietary"
  | "transport"
  | "contactActions"
  | "freshness";

export type PageBrief = {
  pageType: DirectoryPageTypeBrief;
  primaryEntity: string;
  macroContext: string;
  networkRole: "core" | "supporting";
  searchIntent: string;
  requiredEavGroups: EavGroup[];
  allowedLinkTargets: DirectoryPageTypeBrief[];
  indexationRole: "canonical_target" | "quality_gated" | "supporting_noindex_when_weak";
};

export const directorySemanticMap = {
  centralEntity: siteConfig.niche,
  sourceContext: "local business comparison directory",
  location: siteConfig.cityOrRegion,
  requiredIdentityPhrases: [siteConfig.niche, `${siteConfig.cityOrRegion} ${siteConfig.niche}`, siteConfig.siteName],
  copySafety: {
    blockedStaleTerms: ["indian"],
    requiredIdentityFields: ["siteName", "niche", "cityOrRegion", "listingLabel", "categoryLabel"]
  },
  pageBriefs: [
    {
      pageType: "homepage",
      primaryEntity: "local directory",
      macroContext: "citywide directory comparison",
      networkRole: "core",
      searchIntent: "compare all listings in the city",
      requiredEavGroups: ["identity", "location", "category", "freshness"],
      allowedLinkTargets: ["area_hub", "category_hub", "area_category_hub", "best_hub", "facet_hub"],
      indexationRole: "canonical_target"
    },
    {
      pageType: "listing_detail",
      primaryEntity: "local business listing",
      macroContext: "single business evaluation",
      networkRole: "core",
      searchIntent: "evaluate one business before visiting or contacting it",
      requiredEavGroups: ["identity", "location", "reviews", "services", "contactActions", "freshness"],
      allowedLinkTargets: ["area_hub", "neighborhood_hub", "category_hub", "area_category_hub", "facet_hub"],
      indexationRole: "quality_gated"
    },
    {
      pageType: "area_hub",
      primaryEntity: "area directory hub",
      macroContext: "local area comparison",
      networkRole: "core",
      searchIntent: "compare listings in one local area",
      requiredEavGroups: ["location", "category", "reviews", "services"],
      allowedLinkTargets: ["category_hub", "area_category_hub", "listing_detail", "facet_hub"],
      indexationRole: "supporting_noindex_when_weak"
    },
    {
      pageType: "category_hub",
      primaryEntity: "category directory hub",
      macroContext: "category comparison across the city",
      networkRole: "core",
      searchIntent: "compare listings in one category across the city",
      requiredEavGroups: ["category", "location", "reviews", "services"],
      allowedLinkTargets: ["area_hub", "area_category_hub", "listing_detail", "facet_hub"],
      indexationRole: "supporting_noindex_when_weak"
    },
    {
      pageType: "area_category_hub",
      primaryEntity: "area and category directory hub",
      macroContext: "local category comparison",
      networkRole: "core",
      searchIntent: "compare one category in one local area",
      requiredEavGroups: ["location", "category", "reviews", "services", "freshness"],
      allowedLinkTargets: ["area_hub", "category_hub", "listing_detail"],
      indexationRole: "supporting_noindex_when_weak"
    }
  ] satisfies PageBrief[]
} as const;

export function getPageBrief(pageType: DirectoryPageTypeBrief) {
  const brief = directorySemanticMap.pageBriefs.find((item) => item.pageType === pageType);
  if (!brief) throw new Error(`Missing semantic page brief for ${pageType}`);
  return brief;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node .\node_modules\tsx\dist\cli.mjs .\scripts\semantic-map.test.ts`

Expected: exits with code 0.

---

## Task 2: Add Listing EAV Summary Helpers

**Files:**
- Create: `src/lib/listing-eav-summary.ts`
- Test: `scripts/listing-eav-summary.test.ts`

- [ ] **Step 1: Write the summary test**

```ts
import { listings } from "../src/data/listings";
import { buildListingEavSummary } from "../src/lib/listing-eav-summary";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const listing = listings.find((item) => item.area && item.categories.length && item.contact?.phone);
assert(listing, "fixture listing should include area, category, and phone");

const summary = buildListingEavSummary(listing);
assert(summary.location.question.includes(listing.name), "location question should name the listing");
assert(summary.location.answer.length > 20, "location answer should be factual");
assert(summary.contact.answer.includes("contact"), "contact summary should describe actions");
assert(summary.service.question.startsWith("What"), "service summary should be question-led");
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node .\node_modules\tsx\dist\cli.mjs .\scripts\listing-eav-summary.test.ts`

Expected: fails because `src/lib/listing-eav-summary.ts` does not exist.

- [ ] **Step 3: Implement factual listing summaries**

```ts
import type { Listing } from "@/data/listings";
import { siteConfig } from "@/config/site";

export type ListingSummaryBlock = {
  question: string;
  answer: string;
};

export type ListingEavSummary = {
  location: ListingSummaryBlock;
  service: ListingSummaryBlock;
  dietary: ListingSummaryBlock;
  transport: ListingSummaryBlock;
  review: ListingSummaryBlock;
  contact: ListingSummaryBlock;
};

export function buildListingEavSummary(listing: Listing): ListingEavSummary {
  return {
    location: {
      question: `Where is ${listing.name} located?`,
      answer: locationAnswer(listing)
    },
    service: {
      question: `What services does ${listing.name} offer?`,
      answer: listAnswer(listing.details?.serviceOptions, `${listing.name} lists service options for this profile.`, `${listing.name} does not list service options in the current directory data.`)
    },
    dietary: {
      question: `What dietary options are listed for ${listing.name}?`,
      answer: listAnswer(listing.dietaryOptions, `${listing.name} lists dietary options for this profile.`, `${listing.name} does not list dietary options in the current directory data.`)
    },
    transport: {
      question: `What transport links are near ${listing.name}?`,
      answer: transportAnswer(listing)
    },
    review: {
      question: `What review signals are available for ${listing.name}?`,
      answer: reviewAnswer(listing)
    },
    contact: {
      question: `How can visitors contact or check ${listing.name}?`,
      answer: contactAnswer(listing)
    }
  };
}

function locationAnswer(listing: Listing) {
  const parts = [listing.fullAddress || listing.address, listing.neighborhood, listing.area, listing.city || siteConfig.cityOrRegion].filter(Boolean);
  return parts.length
    ? `${listing.name} is listed at ${parts.join(", ")}.`
    : `${listing.name} is listed in ${siteConfig.cityOrRegion}, but the current directory data does not include a full local address.`;
}

function listAnswer(values: string[] | undefined, prefix: string, fallback: string) {
  if (!values?.length) return fallback;
  return `${prefix} Listed values include ${formatList(values.slice(0, 6))}.`;
}

function transportAnswer(listing: Listing) {
  const values = [listing.location?.tubeStation, listing.location?.busStop].filter(Boolean);
  return values.length
    ? `${listing.name} has nearby transport signals for ${formatList(values)}.`
    : `${listing.name} does not list nearby tube or bus stop data in the current directory data.`;
}

function reviewAnswer(listing: Listing) {
  if (typeof listing.rating === "number" && typeof listing.reviewCount === "number") {
    return `${listing.name} has a ${listing.rating.toFixed(1)} rating from ${listing.reviewCount.toLocaleString()} listed reviews.`;
  }
  if (typeof listing.rating === "number") return `${listing.name} has a ${listing.rating.toFixed(1)} listed rating.`;
  return `${listing.name} does not list rating or review-count data in the current directory data.`;
}

function contactAnswer(listing: Listing) {
  const actions = [
    listing.contact?.phone ? "phone" : undefined,
    listing.contact?.website ? "website" : undefined,
    listing.location?.googleMapsUrl ? "Google Maps" : undefined,
    listing.contact?.googleReviewsUrl ? "Google reviews" : undefined,
    listing.contact?.reserveUrl ? "reservation" : undefined,
    listing.contact?.menuUrl ? "menu" : undefined
  ].filter(Boolean);

  return actions.length
    ? `${listing.name} has contact and checking actions for ${formatList(actions)}.`
    : `${listing.name} does not list contact actions in the current directory data.`;
}

function formatList(items: string[]) {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node .\node_modules\tsx\dist\cli.mjs .\scripts\listing-eav-summary.test.ts`

Expected: exits with code 0.

---

## Task 3: Render Question-Led Listing Summaries

**Files:**
- Modify: `src/app/listings/[slug]/page.tsx`
- Test: `scripts/listing-detail-eav-summary.test.ts`

- [ ] **Step 1: Write a render test**

```ts
import { buildListingEavSummary } from "../src/lib/listing-eav-summary";
import { listings } from "../src/data/listings";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const listing = listings[0];
const summary = buildListingEavSummary(listing);
const questions = Object.values(summary).map((block) => block.question);

assert(questions.some((question) => question.startsWith("Where is")), "location question should exist");
assert(questions.some((question) => question.startsWith("What services")), "service question should exist");
assert(questions.every((question) => question.includes(listing.name)), "questions should be listing-specific");
```

- [ ] **Step 2: Run the test**

Run: `node .\node_modules\tsx\dist\cli.mjs .\scripts\listing-detail-eav-summary.test.ts`

Expected: exits with code 0 after Task 2.

- [ ] **Step 3: Use the summary helper in the listing page**

In `src/app/listings/[slug]/page.tsx`, import:

```ts
import { buildListingEavSummary } from "@/lib/listing-eav-summary";
```

After `const listingRoute = ...`, add:

```ts
const eavSummary = buildListingEavSummary(listing);
```

Render relevant summaries:

- Below the address/contact heading, show `eavSummary.location`.
- At the top of the service section, show `eavSummary.service` and `eavSummary.dietary`.
- At the top of the transport section, show `eavSummary.transport`.
- Above the review summary, show `eavSummary.review`.

Use this component in the same file:

```tsx
function FactAnswer({ block }: { block: { question: string; answer: string } }) {
  return (
    <div className="mb-5 rounded-md bg-slate-50 p-4">
      <h3 className="text-base font-bold text-ink">{block.question}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{block.answer}</p>
    </div>
  );
}
```

- [ ] **Step 4: Run page-related tests**

Run: `npm test`

Expected: all tests pass.

---

## Task 4: Replace Generic Related Links With Contextual Bridges

**Files:**
- Modify: `src/lib/directory-growth.ts`
- Modify: `src/app/listings/[slug]/page.tsx`
- Test: `scripts/listing-contextual-bridges.test.ts`

- [ ] **Step 1: Write bridge grouping test**

```ts
import { listings } from "../src/data/listings";
import { getListingExploreLinkGroups } from "../src/lib/directory-growth";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const listing = listings.find((item) => item.area && item.categories.length);
assert(listing, "fixture listing should include area and categories");

const groups = getListingExploreLinkGroups(listing);
assert(groups.length > 0, "listing should produce contextual link groups");
assert(groups.every((group) => group.title.endsWith("?")), "group titles should be question-led");
assert(groups.every((group) => group.description.length > 0), "group descriptions should explain link context");
assert(groups.every((group) => group.links.length <= 6), "groups should keep link volume controlled");
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node .\node_modules\tsx\dist\cli.mjs .\scripts\listing-contextual-bridges.test.ts`

Expected: fails because `getListingExploreLinkGroups` does not exist.

- [ ] **Step 3: Add grouped link model**

In `src/lib/directory-growth.ts`, add:

```ts
export type DirectoryLinkGroup = {
  title: string;
  description: string;
  links: DirectoryLink[];
};

export function getListingExploreLinkGroups(listing: Listing): DirectoryLinkGroup[] {
  const listingPlural = directoryConfig.listingPluralLabel.toLowerCase();
  const area = listing.area;
  const areaSlug = area ? slugify(area) : "";

  const localLinks: DirectoryLink[] = [];
  if (area && areaSlug) localLinks.push({ label: `More ${listingPlural} in ${area}`, href: areaPath(areaSlug) });
  if (listing.neighborhood) localLinks.push({ label: `More ${listingPlural} in ${listing.neighborhood}`, href: neighborhoodPath(slugify(listing.neighborhood)) });

  const categoryLinks: DirectoryLink[] = listing.categories.slice(0, 4).flatMap((category) => {
    const categorySlug = slugify(category);
    const links: DirectoryLink[] = [{ label: `${category} ${listingPlural}`, href: categoryPath(categorySlug) }];
    if (isDirectoryFeatureEnabled("areaCategoryPages") && areaSlug && getAreaCategoryCombination(areaSlug, categorySlug)) {
      links.push({ label: `${category} ${listingPlural} in ${area}`, href: areaCategoryPath(areaSlug, categorySlug) });
    }
    return links;
  });

  const featureLinks: DirectoryLink[] = [
    ...listing.dietaryOptions.slice(0, 3).map((item) => ({ label: `${item} ${listingPlural}`, href: dietaryPath(slugify(item)) })),
    ...(listing.details?.serviceOptions ?? []).slice(0, 3).map((item) => ({ label: `${item} ${listingPlural}`, href: servicePath(slugify(item)) })),
    ...(listing.details?.offerings ?? []).slice(0, 3).map((item) => ({ label: `${item} ${listingPlural}`, href: offeringPath(slugify(item)) }))
  ];

  return [
    {
      title: `Where can I compare nearby ${listingPlural}?`,
      description: "These local hubs keep the search focused on the same area or neighborhood.",
      links: dedupeLinks(localLinks).slice(0, 4)
    },
    {
      title: `Which cuisine pages relate to ${listing.name}?`,
      description: "These category links help compare similar restaurant styles before choosing a place.",
      links: dedupeLinks(categoryLinks).slice(0, 6)
    },
    {
      title: `Which service or feature searches match ${listing.name}?`,
      description: "These links use listed services, dietary options, and offerings from the profile.",
      links: dedupeLinks(featureLinks).slice(0, 6)
    }
  ].filter((group) => group.links.length);
}
```

- [ ] **Step 4: Render grouped bridges**

In `src/app/listings/[slug]/page.tsx`, replace `getListingExploreLinks` usage with `getListingExploreLinkGroups`.

Render each group with its title, description, and links. Keep the old "Similar listings" grid below it, but rename the heading to:

```tsx
<h2 className="mb-6 text-2xl font-bold text-ink">Restaurants with similar local signals</h2>
```

- [ ] **Step 5: Run tests**

Run: `npm test`

Expected: all tests pass.

---

## Task 5: Add Semantic And Internal Link Governance Audit

**Files:**
- Create: `src/lib/internal-link-audit.ts`
- Create: `scripts/check-internal-links.ts`
- Test: `scripts/internal-link-audit.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Write the audit test**

```ts
import { buildInternalLinkAuditReport } from "../src/lib/internal-link-audit";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const report = buildInternalLinkAuditReport();
assert(report.pageTypesChecked.includes("homepage"), "homepage should be checked");
assert(report.pageTypesChecked.includes("listing_detail"), "listing details should be checked");
assert(report.totals.checkedPages > 0, "audit should check pages");
assert(Array.isArray(report.issues), "issues should be an array");
assert(report.checks.includes("directional_link_flow"), "audit should include directional link-flow checks");
assert(report.checks.includes("generic_copy"), "audit should include generic copy checks");
assert(report.checks.includes("entity_consistency"), "audit should include entity consistency checks");
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node .\node_modules\tsx\dist\cli.mjs .\scripts\internal-link-audit.test.ts`

Expected: fails because `src/lib/internal-link-audit.ts` does not exist.

- [ ] **Step 3: Implement report-only audit**

```ts
import { listings } from "@/data/listings";
import { getHomepageSeoFeatureGroups } from "@/lib/directory-ux";
import { getListingExploreLinkGroups } from "@/lib/directory-growth";

export type InternalLinkAuditIssue = {
  severity: "info" | "warning";
  pageType: "homepage" | "listing_detail";
  message: string;
  recommendation: string;
};

export type InternalLinkAuditReport = {
  generatedAt: string;
  pageTypesChecked: string[];
  checks: string[];
  totals: {
    checkedPages: number;
    warnings: number;
    info: number;
  };
  issues: InternalLinkAuditIssue[];
};

export function buildInternalLinkAuditReport(now = new Date()): InternalLinkAuditReport {
  const issues: InternalLinkAuditIssue[] = [];
  const homepageGroups = getHomepageSeoFeatureGroups();
  const sampleListings = listings.slice(0, 50);

  if (!homepageGroups.length) {
    issues.push({
      severity: "warning",
      pageType: "homepage",
      message: "Homepage has no SEO feature link groups.",
      recommendation: "Expose top areas, categories, area/category pages, and high-intent facet hubs from the homepage."
    });
  }

  sampleListings.forEach((listing) => {
    const groups = getListingExploreLinkGroups(listing);
    const linkCount = groups.flatMap((group) => group.links).length;
    if (linkCount > 16) {
      issues.push({
        severity: "warning",
        pageType: "listing_detail",
        message: `${listing.name} has ${linkCount} contextual explore links.`,
        recommendation: "Keep listing bridge links focused on the strongest local, category, and feature targets."
      });
    }
    if (!groups.length) {
      issues.push({
        severity: "info",
        pageType: "listing_detail",
        message: `${listing.name} has no contextual explore link groups.`,
        recommendation: "Improve area, category, service, or dietary data for this listing."
      });
    }
    if (!listing.name || !listing.area || !listing.categories.length) {
      issues.push({
        severity: "info",
        pageType: "listing_detail",
        message: `${listing.name || "A listing"} is missing one or more entity consistency fields.`,
        recommendation: "Review listing name, area, category, service, and proof-signal data before launch."
      });
    }
  });

  return {
    generatedAt: now.toISOString(),
    pageTypesChecked: ["homepage", "listing_detail"],
    checks: ["directional_link_flow", "anchor_clarity", "page_brief_compliance", "generic_copy", "entity_consistency"],
    totals: {
      checkedPages: 1 + sampleListings.length,
      warnings: issues.filter((issue) => issue.severity === "warning").length,
      info: issues.filter((issue) => issue.severity === "info").length
    },
    issues
  };
}

export function renderInternalLinkAuditReport(report: InternalLinkAuditReport) {
  return [
    "Semantic and internal link governance audit",
    `Generated: ${report.generatedAt}`,
    `Checks: ${report.checks.join(", ")}`,
    `Pages checked: ${report.totals.checkedPages}`,
    `Warnings: ${report.totals.warnings}`,
    `Info: ${report.totals.info}`,
    "",
    "Issues:",
    report.issues.length
      ? report.issues.map((issue) => `- [${issue.severity}] ${issue.pageType}: ${issue.message} ${issue.recommendation}`).join("\n")
      : "- None"
  ].join("\n");
}
```

- [ ] **Step 4: Add CLI script**

Create `scripts/check-internal-links.ts`:

```ts
import { buildInternalLinkAuditReport, renderInternalLinkAuditReport } from "../src/lib/internal-link-audit";

const report = buildInternalLinkAuditReport();
console.log(renderInternalLinkAuditReport(report));

if (report.totals.warnings > 0) {
  process.exitCode = 1;
}
```

- [ ] **Step 5: Add package script**

In `package.json`, add:

```json
"audit:links": "tsx scripts/check-internal-links.ts"
```

- [ ] **Step 6: Run audit test and command**

Run:

```powershell
node .\node_modules\tsx\dist\cli.mjs .\scripts\internal-link-audit.test.ts
npm run audit:links
```

Expected: test exits with code 0. Audit prints report. If warnings exist, review them before deciding whether warnings should fail the command or stay advisory.

---

## Task 6: Update Documentation And Standard Verification

**Files:**
- Modify: `TEMPLATE_GUIDE.md`
- Modify: `scripts/run-tests.ts` if needed

- [ ] **Step 1: Add the new tests to the runner**

If `scripts/run-tests.ts` uses an explicit list, add:

```ts
"semantic-map.test.ts",
"listing-eav-summary.test.ts",
"listing-detail-eav-summary.test.ts",
"listing-contextual-bridges.test.ts",
"internal-link-audit.test.ts"
```

- [ ] **Step 2: Document the new copied-directory workflow**

Add a section to `TEMPLATE_GUIDE.md`:

```md
## Semantic Governance Before Copying

Before copying this template for another directory, review the semantic map and page briefs. Update the central entity, source context, allowed facets, stale terms, and page-type intent so the new site does not keep old niche wording or irrelevant restaurant facets.

Run:

```powershell
npm run audit:template
npm run audit:seo
npm run audit:freshness
npm run audit:links
```

For template work, missing images are allowed and should not block implementation. For a real launched directory, review the production URL, import report, high-value listing data, hub coverage, copied-template wording, and image coverage before launch.
```

- [ ] **Step 3: Run full verification**

Run:

```powershell
npm test
npm run typecheck
npm run lint
npm run audit:seo
npm run audit:freshness
npm run audit:template
npm run audit:links
npm run build
```

Expected:

- Tests, typecheck, lint, SEO audit, freshness audit, and build pass.
- `audit:template` may remain blocked until `NEXT_PUBLIC_SITE_URL` is set.
- Freshness warnings about missing images are acceptable while this project is used as a template.
- `audit:links` should either pass or report clear warnings that become the next cleanup list.

---

## Koray Coverage Notes

This plan intentionally includes the practical parts of the research paper:

- Topical map, central entity, source context, central search intent, and core/supporting page roles are handled in Task 1.
- Semantic content briefs, one macro context per page, required EAV groups, and allowed link targets are handled in Task 1.
- Subject-predicate-object style factual statements, numeric precision, and factual certainty are handled in Tasks 2 and 3.
- Contextual borders/bridges, directional link flow, anchor clarity, and controlled related links are handled in Tasks 4 and 5.
- Semantic audit/content configuration is handled as report-only governance in Task 5.
- Existing indexation, sitemap, noindex, listing quality, freshness, analytics, and template-readiness systems remain in place.

This plan does not implement the research paper's rigid claims as hard SEO rules: exact 40-word answers, every H2 as a question, exact 1:7 hub/spoke ratio, fixed total-link limits, fixed repeated-anchor limits, or claims that semantic structure replaces all authority signals.

Images remain out of scope while this is a template.

## Self-Review

- Spec coverage: This plan covers the highest-priority report recommendations: topical map/page briefs, EAV summaries, contextual bridges, internal-link audit, and copied-template documentation.
- Excluded intentionally: Image enrichment is out of scope because this is a reusable template, not a final launch directory. Real analytics/Search Console integration is also separate because it needs provider choices.
- Placeholder scan: No implementation step uses TBD/TODO-style placeholders.
- Type consistency: New types use existing page-type names from `directory-analytics.ts` where practical and avoid changing current public routes.

## Execution Options

Plan complete and saved to `docs/superpowers/plans/2026-05-24-semantic-template-governance.md`.

1. **Subagent-Driven (recommended)** - dispatch a fresh worker per task, review between tasks, fastest for this multi-part implementation.
2. **Inline Execution** - execute tasks in this session with checkpoints.
