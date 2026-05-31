import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { getFooterGroups } from "../src/lib/directory-growth";
import { getTrustPages } from "../src/lib/trust-pages";

const expectedPages = [
  { title: "About", href: "/about", routeFile: "src/app/about/page.tsx" },
  { title: "Contact", href: "/contact", routeFile: "src/app/contact/page.tsx" },
  { title: "Privacy Policy", href: "/privacy-policy", routeFile: "src/app/privacy-policy/page.tsx" },
  { title: "Terms", href: "/terms", routeFile: "src/app/terms/page.tsx" },
  { title: "How We Rank", href: "/methodology", routeFile: "src/app/methodology/page.tsx" },
  { title: "Suggest an Update", href: "/suggest-update", routeFile: "src/app/suggest-update/page.tsx" }
];

function trustPagesExposeExpectedRoutes() {
  const pages = getTrustPages();

  assert.deepEqual(
    pages.map((page) => ({ title: page.title, href: page.href })),
    expectedPages.map(({ title, href }) => ({ title, href }))
  );

  for (const expected of expectedPages) {
    assert.ok(fs.existsSync(path.join(process.cwd(), expected.routeFile)), `${expected.routeFile} should exist`);
  }
}

function footerLinksToTrustPages() {
  const trustGroup = getFooterGroups().find((group) => group.title === "Trust");

  assert.ok(trustGroup, "footer should include a Trust group");
  assert.deepEqual(
    trustGroup.links.map((link) => link.href),
    expectedPages.map((page) => page.href)
  );
}

trustPagesExposeExpectedRoutes();
footerLinksToTrustPages();

console.log("trust pages tests passed");
