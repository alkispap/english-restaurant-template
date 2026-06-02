import assert from "node:assert/strict";
import {
  articleSitemapRoutes,
  buildArticleFaqJsonLd,
  buildArticleJsonLd,
  getArticleRouteMetadata,
  getPublicGuideArticles,
  guidePath
} from "../src/lib/articles";
import type { ArticleContent } from "../src/lib/article-types";

function article(overrides: Partial<ArticleContent>): ArticleContent {
  return {
    slug: "sample-guide",
    status: "published",
    title: "Sample Guide",
    metaTitle: "Sample Guide Meta Title",
    metaDescription: "A sample guide meta description.",
    publishedAt: "2026-06-10",
    updatedAt: "2026-06-11",
    cluster: "core-topic-authority",
    primaryKeyword: "sample guide",
    sections: [
      {
        heading: "First section",
        body: ["This is the first section."]
      }
    ],
    faqs: [
      {
        question: "Is this a useful sample?",
        answer: "Yes, it proves article schema and guide filtering work."
      }
    ],
    internalLinks: [{ label: "Restaurants", href: "/" }],
    researchSources: [{ title: "Example source", url: "https://example.com/source", note: "Used as a test source." }],
    ...overrides
  };
}

const draft = article({ slug: "draft-guide", status: "drafted" });
const published = article({ slug: "published-guide", status: "published" });

assert.equal(guidePath("published-guide"), "/guides/published-guide");
assert.deepEqual(
  getPublicGuideArticles([draft, published]).map((item) => item.slug),
  ["published-guide"],
  "only published articles should appear in public guide lists"
);

const metadata = getArticleRouteMetadata(published);
assert.equal(metadata.title, "Sample Guide Meta Title");
assert.equal(metadata.description, "A sample guide meta description.");
assert.equal(metadata.alternates?.canonical, "/guides/published-guide");

const routes = articleSitemapRoutes("https://directory.example", [draft, published]);
assert.deepEqual(
  routes.map((route) => route.url),
  ["https://directory.example/guides/published-guide"],
  "draft articles should be excluded from article sitemap routes"
);

const articleSchema = buildArticleJsonLd(published);
assert.equal(articleSchema["@type"], "Article");
assert.equal(articleSchema.headline, "Sample Guide");
assert.equal(articleSchema.mainEntityOfPage, "http://localhost:3001/guides/published-guide");

const faqSchema = buildArticleFaqJsonLd(published);
assert.equal(faqSchema?.["@type"], "FAQPage");
assert.equal((faqSchema?.mainEntity as unknown[] | undefined)?.length, 1);

console.log("article behavior tests passed");
