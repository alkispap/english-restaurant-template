import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function seoLandingPageDoesNotRenderSummaryCards() {
  const componentPath = path.join(process.cwd(), "src", "components", "SeoLandingPage.tsx");
  const source = fs.readFileSync(componentPath, "utf8");
  const componentBody = source.split("function Breadcrumbs")[0];

  assert.ok(
    !componentBody.includes("<SummaryStats"),
    "SEO pages should not render the summary cards block"
  );
  assert.ok(
    !source.includes('aria-label="Directory summary"'),
    "SEO landing page should not include directory summary card markup"
  );
}

seoLandingPageDoesNotRenderSummaryCards();

console.log("SEO landing page render tests passed");
