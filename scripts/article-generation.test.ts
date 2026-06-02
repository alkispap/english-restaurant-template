import assert from "node:assert/strict";
import {
  buildDraftArticleFromPlanAndResearch,
  buildResearchNotesFromSearchResults,
  type SearchResult
} from "../src/lib/article-generation";
import type { ArticlePlanItem } from "../src/lib/article-types";

const plan: ArticlePlanItem = {
  id: "sample-topic",
  cluster: "core-topic-authority",
  title: "What Is Indian Food?",
  slug: "what-is-indian-food",
  primaryKeyword: "what is Indian food",
  supportingKeywords: ["Indian cuisine guide", "Indian dishes for beginners"],
  intent: "informational",
  priority: 1,
  status: "planned",
  plannedPublishDate: "2026-06-12",
  draftPath: "content/articles/what-is-indian-food.json",
  internalLinks: [
    { label: "Indian restaurants in London", href: "/" },
    { label: "Indian restaurant categories", href: "/categories" }
  ],
  researchNotesPath: "content/research/what-is-indian-food.md",
  similarTopicIds: []
};

const results: SearchResult[] = [
  {
    title: "Indian food guide for beginners",
    url: "https://example.com/indian-food-guide",
    snippet: "A beginner guide covering popular dishes, regional styles, spices, breads, and what to order first."
  },
  {
    title: "North Indian and South Indian cuisine explained",
    url: "https://example.com/regional-indian-food",
    snippet: "Explains regional cuisine, common restaurant dishes, vegetarian options, and practical ordering tips."
  }
];

const research = buildResearchNotesFromSearchResults(plan, results, "2026-06-02T10:00:00.000Z");

assert.equal(research.articleId, "sample-topic");
assert.equal(research.query, "what is Indian food");
assert.equal(research.sources.length, 2);
assert.ok(research.commonThemes.includes("regional styles"), "research should identify competitor themes");
assert.ok(research.contentGaps.includes("local directory connection"), "research should include a local directory angle");

const draft = buildDraftArticleFromPlanAndResearch(plan, research, "2026-06-02");

assert.equal(draft.status, "drafted");
assert.equal(draft.slug, "what-is-indian-food");
assert.equal(draft.primaryKeyword, "what is Indian food");
assert.ok(draft.metaTitle.includes("What Is Indian Food?"));
assert.ok(draft.sections.length >= 4, "drafts should contain enough sections for a useful review draft");
assert.ok(draft.faqs.length >= 2, "drafts should include FAQs");
assert.deepEqual(draft.internalLinks, plan.internalLinks);
assert.deepEqual(
  draft.researchSources.map((source) => source.url),
  results.map((result) => result.url)
);

console.log("article generation tests passed");
