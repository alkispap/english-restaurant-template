import assert from "node:assert/strict";
import type { Listing } from "../src/data/listings";
import { directoryConfig } from "../src/config/directory";
import { siteConfig } from "../src/config/site";
import {
  buildTemplateReadinessReport,
  renderTemplateReadinessReport,
  type TemplateReadinessReport
} from "../src/lib/template-readiness-audit";

const completeListing: Listing = {
  name: "Complete Listing",
  slug: "complete-listing",
  description: "A complete listing with strong trust details for launch readiness checks.",
  images: ["https://example.com/photo.jpg"],
  area: "Harrow",
  neighborhood: "Harrow",
  address: "1 Station Road",
  fullAddress: "1 Station Road, Harrow, London",
  categories: ["Indian"],
  listingTypes: ["Casual Dining"],
  dietaryOptions: ["Vegetarian"],
  tags: ["Indian", "Vegetarian", "Takeaway"],
  rating: 4.7,
  reviewCount: 120,
  businessStatus: "OPERATIONAL",
  contact: {
    phone: "+44 20 0000 0000",
    website: "https://example.com",
    googleReviewsUrl: "https://example.com/reviews",
    menuUrl: "https://example.com/menu"
  },
  location: {
    latitude: 51.5,
    longitude: -0.1,
    googleMapsUrl: "https://example.com/maps"
  },
  details: {
    workingHours: [{ day: "Monday", hours: "12-10pm" }],
    serviceOptions: ["Takeaway", "Dine-in"],
    offerings: ["Vegetarian options"],
    googleVerified: true,
    placeId: "test-place-id"
  }
};

const weakListing: Listing = {
  name: "Weak Listing",
  slug: "weak-listing",
  images: [],
  categories: [],
  listingTypes: [],
  dietaryOptions: [],
  tags: []
};

const cleanImportReport = `# Import Report

- Source file: test.csv
- Source rows: 1
- Imported listings: 1
- Skipped rows: 0
- Mode: normal import
- Source type: Generic CSV
- Duplicate rows skipped: 0
- Non-operational rows flagged: 0

## Warnings

- None
`;

function report(overrides: Partial<Parameters<typeof buildTemplateReadinessReport>[0]> = {}): TemplateReadinessReport {
  return buildTemplateReadinessReport({
    site: siteConfig,
    directory: directoryConfig,
    listings: [completeListing],
    importReportText: cleanImportReport,
    env: {
      NEXT_PUBLIC_SITE_URL: "https://example.com",
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ""
    },
    now: new Date("2026-06-01T00:00:00.000Z"),
    ...overrides
  });
}

function codes(result: TemplateReadinessReport) {
  return result.issues.map((issue) => issue.code);
}

function issue(result: TemplateReadinessReport, code: string) {
  const match = result.issues.find((item) => item.code === code);
  assert.ok(match, `expected issue ${code}`);
  return match;
}

let result = report();
assert.ok(!codes(result).includes("copied_template_old_niche"), "current Indian config should not trigger copied-template warning");

result = report({
  site: {
    ...siteConfig,
    siteName: "Mexican Restaurants London",
    name: "Mexican Restaurants London",
    niche: "Mexican restaurants in London",
    heroCopy: "Find Indian restaurants across London by area and cuisine.",
    description: "A searchable directory of Mexican restaurants in London."
  }
});
assert.equal(issue(result, "copied_template_old_niche").severity, "warning");

result = report({ env: { NEXT_PUBLIC_SITE_URL: "" } });
assert.equal(issue(result, "production_url_missing").severity, "blocker");

result = report({ env: { NEXT_PUBLIC_SITE_URL: "http://localhost:3001" } });
assert.equal(issue(result, "production_url_local").severity, "blocker");

result = report({ env: { NEXT_PUBLIC_SITE_URL: "https://mexican-restaurants.example" } });
assert.ok(!codes(result).includes("production_url_missing"));
assert.ok(!codes(result).includes("production_url_local"));
assert.ok(!codes(result).includes("production_url_invalid"));

result = report({ importReportText: undefined });
assert.equal(issue(result, "import_report_missing").severity, "warning");

result = report({
  importReportText: `# Import Report

- Source rows: 10
- Imported listings: 8
- Skipped rows: 2
- Duplicate rows skipped: 1
- Non-operational rows flagged: 3

## Warnings

- Row 2: "Example" has no images.
- Row 3: "Example 2" has no category values.
`
});
assert.equal(issue(result, "import_report_skipped_rows").severity, "warning");
assert.equal(issue(result, "import_report_duplicates").severity, "warning");
assert.equal(issue(result, "import_report_non_operational").severity, "warning");
assert.equal(issue(result, "import_report_missing_images").severity, "warning");
assert.equal(issue(result, "import_report_missing_categories").severity, "warning");

result = report({ listings: Array.from({ length: 20 }, (_, index) => ({ ...weakListing, slug: `weak-${index}` })) });
assert.equal(issue(result, "listing_quality_risk").severity, "warning");
assert.equal(issue(result, "freshness_high_risk").severity, "warning");

result = report({ listings: [] });
assert.equal(issue(result, "weak_hub_coverage").severity, "warning");

result = report({
  directory: {
    ...directoryConfig,
    templatePreset: "genericLocalBusiness",
    listingLabel: "Business",
    listingPluralLabel: "Businesses",
    categoryLabel: "Category",
    categoryPluralLabel: "Categories"
  }
});
assert.equal(issue(result, "seo_policy_facet_review").severity, "warning");

result = report({ env: { NEXT_PUBLIC_SITE_URL: "https://example.com" } });
assert.equal(issue(result, "supabase_disabled").severity, "info");
assert.match(issue(result, "verification_guidance").recommendation, /npm run audit:links/);

result = report({
  env: {
    NEXT_PUBLIC_SITE_URL: "https://example.com",
    NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co"
  }
});
assert.equal(issue(result, "supabase_partial_config").severity, "warning");

const output = renderTemplateReadinessReport(report({ listings: [completeListing, weakListing] }));
assert.ok(output.includes("Template readiness audit"));
assert.ok(output.includes("Status:"));
assert.ok(output.includes("Blockers:"));
assert.ok(output.includes("Warnings:"));
assert.ok(output.includes("Issues:"));
assert.ok(output.includes("Recommended actions:"));

console.log("template readiness audit tests passed");
