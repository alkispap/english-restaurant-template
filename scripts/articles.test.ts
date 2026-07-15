import assert from "node:assert/strict";
import {
  articleSitemapRoutes,
  buildArticleFaqJsonLd,
  buildArticleJsonLd,
  getArticleBySlug,
  getArticlePrimaryImage,
  getDraftPreviewRouteMetadata,
  getPreviewArticleBySlug,
  getArticleRouteMetadata,
  getPublicGuideArticles,
  guidePath,
  guidePreviewPath
} from "../src/lib/articles";
import type { ArticleContent } from "../src/lib/article-types";
import { getSiteUrl } from "../src/lib/site-url";

function article(overrides: Partial<ArticleContent>): ArticleContent {
  return {
    slug: "sample-guide",
    status: "published",
    title: "Sample Guide",
    metaTitle: "Sample Guide Meta Title",
    metaDescription: "A sample guide meta description.",
    answer: "Sample guide answers the query immediately in the first visible sentence.",
    publishedAt: "2026-06-10",
    updatedAt: "2026-06-11",
    cluster: "core-topic-authority",
    primaryKeyword: "sample guide",
    heroImage: {
      src: "/images/articles/sample-guide/hero.svg",
      alt: "A sample guide visual",
      caption: "A useful sample guide image."
    },
    keyFacts: [
      {
        label: "Answer style",
        value: "Direct",
        detail: "The first visible sentence answers the query."
      }
    ],
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
assert.equal(guidePreviewPath("draft-guide"), "/guides/preview/draft-guide");
assert.deepEqual(
  getPublicGuideArticles([draft, published]).map((item) => item.slug),
  ["published-guide"],
  "only published articles should appear in public guide lists"
);
assert.equal(getArticleBySlug("draft-guide", [draft, published])?.slug, "draft-guide");
assert.equal(
  getPreviewArticleBySlug("draft-guide", [draft, published])?.slug,
  "draft-guide",
  "draft preview lookup should include drafted articles"
);
assert.equal(
  getPreviewArticleBySlug("published-guide", [draft, published]),
  undefined,
  "preview lookup should exclude published articles"
);

const metadata = getArticleRouteMetadata(published);
assert.equal(metadata.title, "Sample Guide Meta Title");
assert.equal(metadata.description, "A sample guide meta description.");
assert.equal(metadata.alternates?.canonical, "/guides/published-guide");

const guideSuffixMetadata = getArticleRouteMetadata(
  article({ slug: "guide-suffix", metaTitle: "How to Choose an Indian Restaurant in London | Guide" })
);
assert.equal(
  guideSuffixMetadata.title,
  "How to Choose an Indian Restaurant in London",
  "article metadata titles should remove a trailing Guide suffix before the root title template is applied"
);

const previewMetadata = getDraftPreviewRouteMetadata(draft);
assert.equal(previewMetadata.title, "Sample Guide Meta Title");
assert.equal(previewMetadata.description, "A sample guide meta description.");
assert.equal(previewMetadata.alternates?.canonical, "/guides/preview/draft-guide");
assert.deepEqual(previewMetadata.robots, { index: false, follow: false });

const guideSuffixPreviewMetadata = getDraftPreviewRouteMetadata(
  article({ slug: "preview-guide-suffix", status: "drafted", metaTitle: "Indian Takeaway in London | Guide" })
);
assert.equal(
  guideSuffixPreviewMetadata.title,
  "Indian Takeaway in London",
  "draft preview metadata titles should use the same cleaned article title"
);

const routes = articleSitemapRoutes("https://directory.example", [draft, published]);
assert.deepEqual(
  routes.map((route) => route.url),
  ["https://directory.example/guides/published-guide/"],
  "draft articles should be excluded from article sitemap routes"
);

const articleSchema = buildArticleJsonLd(published);
const siteUrl = getSiteUrl();
assert.equal(articleSchema["@type"], "Article");
assert.equal(articleSchema.headline, "Sample Guide");
assert.equal(articleSchema.mainEntityOfPage, `${siteUrl}/guides/published-guide/`);
assert.deepEqual(articleSchema.image, [`${siteUrl}/images/articles/sample-guide/hero.svg`]);
assert.equal(getArticlePrimaryImage(published), "/images/articles/sample-guide/hero.svg");

const faqSchema = buildArticleFaqJsonLd(published);
assert.equal(faqSchema?.["@type"], "FAQPage");
assert.equal((faqSchema?.mainEntity as unknown[] | undefined)?.length, 1);

const publicGuideLinks = getPublicGuideArticles()
  .filter((item) => item.slug !== "published-guide")
  .flatMap((item) => item.internalLinks.map((link) => `${link.label} -> ${link.href}`));
assert.ok(
  publicGuideLinks.some((link) => link.includes("Search Indian restaurants in London -> /restaurants")),
  "published guides should link to the restaurant search page with descriptive anchor text"
);
assert.ok(
  publicGuideLinks.some((link) => /Indian restaurant cuisines in London -> \/categories/.test(link)),
  "published guides should link to the cuisine hub with descriptive anchor text"
);
assert.ok(
  publicGuideLinks.some((link) => /Takeaway Indian restaurants in London -> \/services\/takeaway/.test(link)),
  "published guides should pass relevance to a high-intent service page"
);

console.log("article behavior tests passed");
