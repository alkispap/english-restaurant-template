import assert from "node:assert/strict";
import fs from "node:fs";

const guidesIndexSource = fs.readFileSync("src/app/guides/page.tsx", "utf8");
const guideArticleSource = fs.readFileSync("src/components/GuideArticleContent.tsx", "utf8");

assert.ok(
  guidesIndexSource.includes("Indian Food and Restaurant Guides in London"),
  "guides index H1 should target Indian food and restaurant guide intent in London"
);
assert.ok(
  guidesIndexSource.includes("Browse Indian Food and Restaurant Guides"),
  "guides index should have one keyword-focused H2 for the article list"
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
  guideArticleSource.includes("Related Indian Restaurant Directory Pages"),
  "guide articles should use a keyword-focused related directory H2"
);
assert.ok(
  guideArticleSource.includes("Indian Food and Restaurant FAQs"),
  "guide articles should use a topic-specific FAQ H2"
);
assert.ok(
  guideArticleSource.includes("Sources for This Indian Restaurant Guide"),
  "guide articles should use a guide-specific sources H2"
);
assert.ok(
  !guideArticleSource.includes("<h2 className=\"text-xl font-bold text-ink\">{block.title}</h2>"),
  "article CTA titles should not render as H2s"
);

console.log("guide heading tests passed");
