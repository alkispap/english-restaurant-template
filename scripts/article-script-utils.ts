import fs from "node:fs";
import path from "node:path";
import { ARTICLE_PLAN_FILE, articleContentPath, articleResearchNotesPath, getAllArticles, getArticlePlan } from "../src/lib/articles";
import type { ArticleContent, ArticlePlanItem } from "../src/lib/article-types";

export function loadArticleWorkflowState() {
  return {
    plan: getArticlePlan(),
    articles: getAllArticles()
  };
}

export function saveArticlePlan(plan: ArticlePlanItem[]) {
  writeJsonFile(ARTICLE_PLAN_FILE, plan);
}

export function saveArticleDraft(article: ArticleContent) {
  writeJsonFile(articleContentPath(article.slug), article);
}

export function saveResearchMarkdown(slug: string, markdown: string) {
  const filePath = articleResearchNotesPath(slug);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, markdown, "utf8");
  return filePath;
}

export function readResearchMarkdown(plan: ArticlePlanItem) {
  const filePath = path.join(process.cwd(), plan.researchNotesPath || `content/research/${plan.slug}.md`);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}

export function updatePlanItem(plan: ArticlePlanItem[], id: string, changes: Partial<ArticlePlanItem>) {
  return plan.map((item) => (item.id === id ? { ...item, ...changes } : item));
}

export function relativeContentPath(filePath: string) {
  return path.relative(process.cwd(), filePath).replace(/\\/g, "/");
}

export function argValue(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

export function argNumber(name: string, fallback: number) {
  const value = argValue(name);
  const parsed = value ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function writeJsonFile(filePath: string, value: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
