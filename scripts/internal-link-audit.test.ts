import assert from "node:assert/strict";
import {
  buildInternalLinkAuditReport,
  isInternalHrefIndexable,
  renderInternalLinkAuditReport,
  type InternalLinkAuditInput
} from "../src/lib/internal-link-audit";

assert.equal(
  isInternalHrefIndexable("/areas/redbridge/categories/indian"),
  true,
  "area/category governance should recognize the current route shape"
);

assert.equal(isInternalHrefIndexable("/restaurants"), true, "restaurant search index should be a valid internal target");
assert.equal(isInternalHrefIndexable("/areas"), true, "area index should be a valid internal target");
assert.equal(isInternalHrefIndexable("/categories"), true, "category index should be a valid internal target");
assert.equal(isInternalHrefIndexable("/guides/what-is-indian-food"), true, "published guide articles should be valid internal targets");

assert.equal(
  isInternalHrefIndexable("/areas/redbridge/indian"),
  false,
  "old area/category route shape should not be treated as valid/indexable"
);

const sample: InternalLinkAuditInput[] = [
  {
    sourcePageType: "listing_detail",
    sourceLabel: "Fixture listing",
    groups: [
      {
        title: "Local area",
        description: "These local hubs keep the search focused on the same area.",
        links: [{ label: "Indian restaurants in Redbridge", href: "/areas/redbridge/categories/indian" }]
      }
    ]
  },
  {
    sourcePageType: "listing_detail",
    sourceLabel: "Weak fixture",
    groups: [
      {
        title: "Explore more",
        links: [
          { label: "Click here", href: "/?price=%C2%A3%C2%A3" },
          { label: "Click here", href: "/?price=%C2%A3%C2%A3" }
        ]
      }
    ]
  }
  ,
  {
    sourcePageType: "guide_article",
    sourceLabel: "Fixture guide",
    groups: [
      {
        title: "Related directory pages",
        description: "Guide links should send readers into useful directory pages.",
        links: [
          { label: "Search Indian restaurants in London", href: "/restaurants" },
          { label: "Takeaway Indian restaurants in London", href: "/services/takeaway" }
        ]
      }
    ]
  }
];

const report = buildInternalLinkAuditReport(sample);
assert.equal(report.totals.sources, 3);
assert.ok(report.totals.blockers > 0, "noindex or invalid hrefs should be blockers");
assert.ok(report.totals.warnings > 0, "weak anchors/repeated labels/missing descriptions should be warnings");
assert.match(renderInternalLinkAuditReport(report), /Internal link governance audit/);

console.log("internal link audit tests passed");
