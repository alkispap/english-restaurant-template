import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { getArticlePlan, getPublicGuideArticles } from "../src/lib/articles";

const placeholderPattern = /\b(TODO|placeholder|Generated image|Publication pending|Example source|lorem)\b/i;

function articlePlanMatchesPublishedArticleStatus() {
  const planBySlug = new Map(getArticlePlan().map((item) => [item.slug, item]));
  const staleStatuses = getPublicGuideArticles()
    .map((article) => ({
      slug: article.slug,
      articleStatus: article.status,
      planStatus: planBySlug.get(article.slug)?.status
    }))
    .filter((item) => item.planStatus !== "published");

  assert.deepEqual(staleStatuses, [], "published guide articles should also be marked published in content/article-plan.json");
}

function publishedGuidesHaveSeoContentDepth() {
  const weakGuides = getPublicGuideArticles()
    .map((article) => ({
      slug: article.slug,
      sections: article.sections.length,
      researchSources: article.researchSources.length,
      internalLinks: article.internalLinks.length,
      metaDescriptionLength: article.metaDescription.length,
      hasPlaceholderCopy: placeholderPattern.test(JSON.stringify(article))
    }))
    .filter(
      (article) =>
        article.sections < 4 ||
        article.researchSources < 3 ||
        article.internalLinks < 2 ||
        article.metaDescriptionLength < 90 ||
        article.metaDescriptionLength > 160 ||
        article.hasPlaceholderCopy
    );

  assert.deepEqual(
    weakGuides,
    [],
    "published guides should have enough sections, sources, internal links, SEO meta description length, and no placeholder copy"
  );
}

function publishedGuideImagesExistAndStayOptimized() {
  const imageProblems = getPublicGuideArticles()
    .flatMap((article) =>
      [
        ...(article.heroImage ? [article.heroImage] : []),
        ...(article.visualBlocks ?? []).map((block) => block.image)
      ].map((image) => ({ article: article.slug, src: image.src }))
    )
    .filter((image) => image.src.startsWith("/"))
    .flatMap((image) => {
      const filePath = path.join(process.cwd(), "public", image.src.replace(/^\//, ""));
      if (!fs.existsSync(filePath)) return [{ ...image, problem: "missing" }];
      if (!image.src.endsWith(".svg") && (!image.src.endsWith(".webp") || fs.statSync(filePath).size > 450_000)) {
        return [{ ...image, problem: "not optimized WebP under 450 KB" }];
      }
      return [];
    });

  assert.deepEqual(imageProblems, [], "published guide images should exist and raster images should be optimized WebP assets");
}

articlePlanMatchesPublishedArticleStatus();
publishedGuidesHaveSeoContentDepth();
publishedGuideImagesExistAndStayOptimized();

console.log("guide content hygiene tests passed");
