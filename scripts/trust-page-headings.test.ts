import assert from "node:assert/strict";
import fs from "node:fs";
import { getTrustPages } from "../src/lib/trust-pages";

const expected = [
  {
    href: "/about",
    title: "About",
    heading: "About This Indian Restaurant Directory",
    sectionHeadings: [
      "What This Indian Restaurant Directory Does",
      "Restaurant Data Sources",
      "What This Directory Is Not",
      "How to Use the Indian Restaurant Directory"
    ]
  },
  {
    href: "/contact",
    title: "Contact",
    heading: "Contact the Indian Restaurants in London Directory",
    sectionHeadings: [
      "General Directory Questions",
      "Indian Restaurant Listing Updates",
      "What to Include in Your Message"
    ]
  },
  {
    href: "/privacy-policy",
    title: "Privacy Policy",
    heading: "Privacy Policy for This Restaurant Directory",
    sectionHeadings: [
      "Current Analytics and Data Collection",
      "Browser Storage for Saved Listings and Comments",
      "Location Permission",
      "Optional Account Synchronisation",
      "Contact and Update Requests",
      "Third-Party Restaurant Links",
      "Advertising and Cookies"
    ]
  },
  {
    href: "/terms",
    title: "Terms",
    heading: "Terms for Using This Restaurant Directory",
    sectionHeadings: [
      "Indian Restaurant Directory Information",
      "Check Details Before Visiting",
      "External Restaurant Services"
    ]
  },
  {
    href: "/methodology",
    title: "How We Rank",
    heading: "How We Rank Indian Restaurants in London",
    sectionHeadings: [
      "How Indian Restaurant Listings Are Selected",
      "Data Sources and Review Signals",
      "Review and Rating Limits",
      "How Sorting and Filters Work",
      "Quality and Indexation Rules",
      "Paid Placement Disclosure"
    ]
  },
  {
    href: "/suggest-update",
    title: "Suggest an Update",
    heading: "Suggest an Indian Restaurant Update",
    sectionHeadings: [
      "What Restaurant Details to Report",
      "What to Include in an Update",
      "How Restaurant Updates Are Reviewed"
    ]
  }
];

const pages = getTrustPages();

assert.deepEqual(
  pages.map((page) => ({ title: page.title, href: page.href })),
  expected.map(({ title, href }) => ({ title, href })),
  "trust page short titles should stay stable for nav and footer labels"
);

for (const page of pages) {
  const expectedPage = expected.find((item) => item.href === page.href);
  assert.ok(expectedPage, `${page.href} should be covered by heading expectations`);
  assert.equal(page.heading, expectedPage.heading, `${page.href} should have a focused H1 heading`);
  assert.deepEqual(
    page.sections.map((section) => section.heading),
    expectedPage.sectionHeadings,
    `${page.href} should have focused H2 section headings`
  );
}

const trustPageSource = fs.readFileSync("src/components/TrustPage.tsx", "utf8");

assert.ok(
  trustPageSource.includes("{page.heading ?? page.title}"),
  "TrustPage should render the focused H1 while preserving short titles"
);
assert.ok(!trustPageSource.includes("<h3"), "TrustPage should not introduce H3 headings");

console.log("trust page heading tests passed");
