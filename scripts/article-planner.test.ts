import assert from "node:assert/strict";
import {
  findNextPlannedArticle,
  getArticlePlanDuplicateWarnings,
  getBlockingDuplicateWarnings
} from "../src/lib/article-planner";
import type { ArticleContent, ArticlePlanItem } from "../src/lib/article-types";

function planItem(overrides: Partial<ArticlePlanItem>): ArticlePlanItem {
  return {
    id: "sample",
    cluster: "core-topic-authority",
    title: "Sample Guide",
    slug: "sample-guide",
    primaryKeyword: "sample guide",
    supportingKeywords: [],
    intent: "informational",
    priority: 10,
    status: "planned",
    plannedPublishDate: "2026-06-10",
    draftPath: "",
    internalLinks: [],
    researchNotesPath: "",
    similarTopicIds: [],
    ...overrides
  };
}

function article(overrides: Partial<ArticleContent>): ArticleContent {
  return {
    slug: "sample-guide",
    status: "drafted",
    title: "Sample Guide",
    metaTitle: "Sample Guide",
    metaDescription: "A sample guide used by tests.",
    publishedAt: "",
    updatedAt: "2026-06-02",
    cluster: "core-topic-authority",
    primaryKeyword: "sample guide",
    sections: [],
    faqs: [],
    internalLinks: [],
    researchSources: [],
    ...overrides
  };
}

const existingDraft = article({ slug: "already-drafted", status: "drafted" });

const next = findNextPlannedArticle(
  [
    planItem({ id: "low-priority", slug: "low-priority", priority: 5 }),
    planItem({ id: "already-drafted", slug: "already-drafted", priority: 1 }),
    planItem({ id: "next-topic", slug: "next-topic", priority: 2 }),
    planItem({ id: "idea-only", slug: "idea-only", priority: 0, status: "idea" })
  ],
  [existingDraft]
);

assert.equal(next?.id, "next-topic", "planner should select the highest-priority planned topic without an existing draft");

const warnings = getArticlePlanDuplicateWarnings(
  [
    planItem({ id: "first", slug: "what-is-indian-food", primaryKeyword: "what is indian food" }),
    planItem({ id: "second", slug: "what-is-indian-food", primaryKeyword: "indian food explained" }),
    planItem({ id: "third", slug: "indian-food-guide", primaryKeyword: "what is indian food" })
  ],
  [article({ slug: "indian-food-guide", status: "published" })]
);

assert.ok(
  warnings.some((warning) => warning.type === "duplicate-slug" && warning.topicIds.includes("first") && warning.topicIds.includes("second")),
  "duplicate planner slugs should be reported"
);
assert.ok(
  warnings.some((warning) => warning.type === "duplicate-keyword" && warning.topicIds.includes("first") && warning.topicIds.includes("third")),
  "duplicate primary keywords should be reported"
);
assert.ok(
  warnings.some((warning) => warning.type === "existing-article" && warning.topicIds.includes("third")),
  "planned topics matching existing articles should be reported"
);
assert.ok(getBlockingDuplicateWarnings(warnings).length >= 2, "duplicate slugs and existing articles should block draft creation");

console.log("article planner tests passed");
