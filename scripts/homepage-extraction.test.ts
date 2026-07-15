import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { getFooterGroups } from "../src/lib/directory-growth";
import { getDirectorySummary } from "../src/lib/directory-summary";

const landingSource = fs.readFileSync(path.join(process.cwd(), "src/components/DirectoryLandingPage.tsx"), "utf8");
const footerSource = fs.readFileSync(path.join(process.cwd(), "src/components/Footer.tsx"), "utf8");

assert.equal(
  getDirectorySummary(),
  "Browse Indian restaurants in London by area, rating, cuisine, takeaway, delivery, halal options, vegetarian options, and dining style."
);
assert.ok(
  landingSource.indexOf("{model.summary}") < landingSource.indexOf("<LandingCardSection section={model.primaryNeeds}"),
  "the clean directory summary should appear before minimal homepage browse links"
);
assert.ok(
  landingSource.indexOf("section={model.primaryNeeds}") < landingSource.indexOf("section={model.diningHubs}") &&
    landingSource.indexOf("section={model.diningHubs}") < landingSource.indexOf("model.restaurantRows.map") &&
    landingSource.indexOf("model.restaurantRows.map") < landingSource.indexOf("section={model.serviceNeeds}") &&
    landingSource.indexOf("section={model.serviceNeeds}") < landingSource.indexOf("section={model.regionLinks}"),
  "homepage source should preserve the agreed intent-first section order"
);
assert.ok(!landingSource.includes("model.popularSearches"));
assert.ok(!landingSource.includes("model.guides"));
assert.ok(!landingSource.includes("model.allAreas"));
assert.ok(landingSource.includes('fallbackLabel="Photo unavailable"'));
assert.ok(!landingSource.includes("fallbackLabel={item.title}"));
assert.ok(!landingSource.includes("fallbackLabel={item.name}"));

assert.ok(footerSource.includes("<nav key={group.title} aria-labelledby={headingId}>"));
assert.ok(footerSource.includes('<ul className="grid gap-2 text-sm text-slate-300">'));
assert.ok(footerSource.includes("<li key={item.href}>"));
assert.ok(
  getFooterGroups().some((group) => group.title === "Services and dietary needs"),
  "the footer should use a natural heading instead of the old keyword-style heading"
);

console.log("homepage extraction tests passed");
