import type { ArticleContent, ArticleDuplicateWarning, ArticlePlanItem } from "@/lib/article-types";

export function findNextPlannedArticle(plan: ArticlePlanItem[], articles: ArticleContent[] = []) {
  const existingSlugs = new Set(articles.map((article) => article.slug));

  return plan
    .filter((item) => item.status === "planned")
    .filter((item) => !existingSlugs.has(item.slug))
    .sort((a, b) => a.priority - b.priority || a.plannedPublishDate.localeCompare(b.plannedPublishDate) || a.title.localeCompare(b.title))[0];
}

export function getArticlePlanDuplicateWarnings(plan: ArticlePlanItem[], articles: ArticleContent[] = []): ArticleDuplicateWarning[] {
  const warnings: ArticleDuplicateWarning[] = [];

  warnings.push(...duplicatesBy(plan, (item) => item.slug, "duplicate-slug", true, "Multiple planned topics use the same slug."));
  warnings.push(
    ...duplicatesBy(plan, (item) => normalizeText(item.primaryKeyword), "duplicate-keyword", false, "Multiple planned topics target the same primary keyword.")
  );

  const articleSlugs = new Set(articles.map((article) => article.slug));
  for (const item of plan) {
    if (articleSlugs.has(item.slug)) {
      warnings.push({
        type: "existing-article",
        topicIds: [item.id],
        message: `Planned topic "${item.title}" already has an article file for slug "${item.slug}".`,
        blocking: true
      });
    }
  }

  for (let index = 0; index < plan.length; index += 1) {
    for (let compareIndex = index + 1; compareIndex < plan.length; compareIndex += 1) {
      const first = plan[index];
      const second = plan[compareIndex];
      if (first.slug === second.slug || normalizeText(first.primaryKeyword) === normalizeText(second.primaryKeyword)) continue;
      if (topicSimilarity(first, second) >= 0.72) {
        warnings.push({
          type: "similar-topic",
          topicIds: [first.id, second.id],
          message: `Planned topics "${first.title}" and "${second.title}" look very similar.`,
          blocking: false
        });
      }
    }
  }

  return warnings;
}

export function getBlockingDuplicateWarnings(warnings: ArticleDuplicateWarning[]) {
  return warnings.filter((warning) => warning.blocking);
}

function duplicatesBy(
  plan: ArticlePlanItem[],
  getKey: (item: ArticlePlanItem) => string,
  type: ArticleDuplicateWarning["type"],
  blocking: boolean,
  message: string
) {
  const groups = new Map<string, ArticlePlanItem[]>();
  for (const item of plan) {
    const key = getKey(item);
    if (!key) continue;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  return Array.from(groups.values())
    .filter((items) => items.length > 1)
    .map((items) => ({
      type,
      topicIds: items.map((item) => item.id),
      message,
      blocking
    }));
}

function topicSimilarity(first: ArticlePlanItem, second: ArticlePlanItem) {
  const firstTerms = significantTerms(`${first.title} ${first.primaryKeyword}`);
  const secondTerms = significantTerms(`${second.title} ${second.primaryKeyword}`);
  if (!firstTerms.size || !secondTerms.size) return 0;

  const shared = Array.from(firstTerms).filter((term) => secondTerms.has(term)).length;
  const total = new Set([...firstTerms, ...secondTerms]).size;
  return shared / total;
}

function significantTerms(value: string) {
  const stopWords = new Set(["a", "an", "and", "best", "for", "guide", "in", "is", "of", "the", "to", "what"]);
  return new Set(
    normalizeText(value)
      .split(" ")
      .filter((term) => term.length > 2)
      .filter((term) => !stopWords.has(term))
  );
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
