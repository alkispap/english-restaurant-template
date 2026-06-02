import { findNextPlannedArticle } from "../src/lib/article-planner";
import { loadArticleWorkflowState } from "./article-script-utils";

const { plan, articles } = loadArticleWorkflowState();
const next = findNextPlannedArticle(plan, articles);

if (!next) {
  console.log("No planned article is ready. Add more planned topics to content/article-plan.json.");
  process.exit(0);
}

console.log(JSON.stringify(next, null, 2));
