import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { getCategories, slugify } from "../src/lib/directory";
import { getCategorySeoPage } from "../src/lib/seo-pages";

const category = getCategories().find((item) => slugify(item) === "indian") ?? getCategories()[0];
assert.ok(category, "expected category data");

const page = getCategorySeoPage(slugify(category), {});
assert.ok(page, "expected category SEO page model");

const copy = page.informationGainBlocks.flatMap((block) => [block.title, block.body, ...block.items]).join(" ");

assert.ok(page.informationGainBlocks.length >= 3, "SEO pages should expose reusable information-gain blocks");
assert.match(copy, /price|budget|review|rated/i, "information gain should include price or review signals");
assert.match(copy, /takeaway|delivery|vegetarian|vegan|halal|service/i, "information gain should include practical visit signals");
assert.ok(
  !/programmatic|generated|imported listing dataset|current directory data|implementation/i.test(copy),
  "information-gain copy should not expose implementation wording"
);

const componentSource = fs.readFileSync(path.join(process.cwd(), "src", "components", "SeoLandingPage.tsx"), "utf8");
assert.ok(componentSource.includes("InformationGain"), "SEO landing page should render information-gain blocks");

console.log("information gain tests passed");
