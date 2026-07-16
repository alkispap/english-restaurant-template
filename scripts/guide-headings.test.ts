import assert from "node:assert/strict";
import fs from "node:fs";

const guidesIndexSource = fs.readFileSync("src/app/guides/page.tsx", "utf8");
const guideArticleSource = fs.readFileSync("src/components/GuideArticleContent.tsx", "utf8");

assert.ok(
  guidesIndexSource.includes("siteConfig.cuisineLabel") && guidesIndexSource.includes("siteConfig.cityOrRegion"),
  "guides index H1 should derive cuisine and location intent from the active directory pack"
);
assert.ok(
  guidesIndexSource.includes("Browse {siteConfig.cuisineLabel} Food and Restaurant Guides"),
  "guides index should derive its article-list H2 from the active directory pack"
);
assert.ok(
  !guidesIndexSource.includes("<h2 className=\"mt-2 text-xl font-bold text-ink\">"),
  "guide card article titles should not be H2s"
);
assert.ok(
  guidesIndexSource.includes("<h3 className=\"mt-2 text-xl font-bold text-ink\">"),
  "guide card article titles should render as H3s under the article-list H2"
);

assert.ok(
  guideArticleSource.includes("siteConfig.localNicheSingularTitle"),
  "guide articles should derive the related-directory H2 from the active pack"
);
assert.ok(
  guideArticleSource.includes("{siteConfig.cuisineLabel} Food and Restaurant FAQs"),
  "guide articles should derive the topic-specific FAQ H2 from the active pack"
);
assert.ok(
  guideArticleSource.includes("Sources for This {siteConfig.cuisineLabel} Restaurant Guide"),
  "guide articles should derive the sources H2 from the active pack"
);
assert.ok(
  !guideArticleSource.includes("<h2 className=\"text-xl font-bold text-ink\">{block.title}</h2>"),
  "article CTA titles should not render as H2s"
);

console.log("guide heading tests passed");
