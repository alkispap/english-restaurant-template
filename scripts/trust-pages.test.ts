import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { getFooterGroups } from "../src/lib/directory-growth";
import { getTrustPages } from "../src/lib/trust-pages";

const expectedPages = [
  {
    title: "About",
    metadataTitle: "About This Indian Restaurant Directory",
    href: "/about",
    routeFile: "src/app/about/page.tsx"
  },
  {
    title: "Contact",
    metadataTitle: "Contact the Indian Restaurants in London Directory",
    href: "/contact",
    routeFile: "src/app/contact/page.tsx"
  },
  {
    title: "Privacy Policy",
    metadataTitle: "Privacy Policy for This Restaurant Directory",
    href: "/privacy-policy",
    routeFile: "src/app/privacy-policy/page.tsx"
  },
  {
    title: "Terms",
    metadataTitle: "Terms for Using This Restaurant Directory",
    href: "/terms",
    routeFile: "src/app/terms/page.tsx"
  },
  {
    title: "How We Rank",
    metadataTitle: "How We Rank Indian Restaurants in London",
    href: "/methodology",
    routeFile: "src/app/methodology/page.tsx"
  },
  {
    title: "Suggest an Update",
    metadataTitle: "Suggest an Indian Restaurant Update",
    href: "/suggest-update",
    routeFile: "src/app/suggest-update/page.tsx"
  }
];

function trustPagesExposeExpectedRoutes() {
  const pages = getTrustPages();

  assert.deepEqual(
    pages.map((page) => ({ title: page.title, href: page.href })),
    expectedPages.map(({ title, href }) => ({ title, href }))
  );

  assert.deepEqual(
    pages.map((page) => ({ metadataTitle: page.metadataTitle, href: page.href })),
    expectedPages.map(({ metadataTitle, href }) => ({ metadataTitle, href })),
    "trust pages should expose SEO-focused metadata titles separately from short nav titles"
  );

  for (const expected of expectedPages) {
    assert.ok(fs.existsSync(path.join(process.cwd(), expected.routeFile)), `${expected.routeFile} should exist`);
  }
}

function footerLinksToTrustPages() {
  const trustGroup = getFooterGroups().find((group) => group.title === "About This Indian Restaurant Directory");

  assert.ok(trustGroup, "footer should include an SEO-focused trust group");
  assert.deepEqual(
    trustGroup.links.map((link) => link.href),
    expectedPages.map((page) => page.href)
  );
}

trustPagesExposeExpectedRoutes();
footerLinksToTrustPages();

console.log("trust pages tests passed");
