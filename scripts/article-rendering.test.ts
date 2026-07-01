import assert from "node:assert/strict";
import fs from "node:fs";
import type { ArticleContent } from "../src/lib/article-types";

const guidePageSource = fs.readFileSync("src/components/GuideArticleContent.tsx", "utf8");
const previewPageSource = fs.readFileSync("src/app/guides/preview/[slug]/page.tsx", "utf8");

assert.ok(
  guidePageSource.includes("article.answer"),
  "guide article pages should render the direct answer field"
);
assert.ok(
  !guidePageSource.includes("text-lg text-muted\">{article.metaDescription}"),
  "guide article pages should not render the SEO meta description as the first visible answer"
);
assert.ok(guidePageSource.includes("heroImage"), "guide article pages should render hero images when present");
assert.ok(guidePageSource.includes("keyFacts"), "guide article pages should render key facts when present");
assert.ok(guidePageSource.includes("dataBlocks"), "guide article pages should render data blocks when present");
assert.ok(guidePageSource.includes("comparisonTables"), "guide article pages should render comparison tables when present");
assert.ok(
  guidePageSource.includes("publishedAt ?") || guidePageSource.includes("Publication pending"),
  "draft preview article pages should not format an empty publishedAt value"
);

const sampleArticle = JSON.parse(fs.readFileSync("content/articles/what-is-indian-food.json", "utf8")) as ArticleContent;

assert.equal(
  sampleArticle.answer,
  "Indian food is a wide collection of regional cuisines shaped by local ingredients, religion, trade, climate, migration, and family traditions across India and the Indian diaspora.",
  "the sample article should answer the query in the first visible sentence"
);
assert.ok(sampleArticle.heroImage, "the sample article should include a hero image");
assert.ok((sampleArticle.keyFacts ?? []).length >= 3, "the sample article should include key facts");
assert.ok((sampleArticle.dataBlocks ?? []).length >= 1, "the sample article should include local data blocks");
assert.ok((sampleArticle.comparisonTables ?? []).length >= 1, "the sample article should include a comparison table");
assert.ok((sampleArticle.ctaBlocks ?? []).length >= 1, "the sample article should include clear directory CTAs");
assert.ok(
  previewPageSource.includes("getPreviewArticleBySlug"),
  "draft preview pages should render drafted articles through the preview lookup"
);
assert.ok(
  previewPageSource.includes("index: false"),
  "draft preview pages should be blocked from indexing"
);

console.log("article rendering tests passed");
