import { buildResearchNotesFromSearchResults, fetchLiveSearchResults, researchNotesToMarkdown } from "../src/lib/article-generation";
import { findNextPlannedArticle } from "../src/lib/article-planner";
import {
  argValue,
  loadArticleWorkflowState,
  relativeContentPath,
  saveArticlePlan,
  saveResearchMarkdown,
  updatePlanItem
} from "./article-script-utils";

const { plan, articles } = loadArticleWorkflowState();
const requestedId = argValue("id");
const item = requestedId ? plan.find((topic) => topic.id === requestedId) : findNextPlannedArticle(plan, articles);

if (!item) {
  console.error("No matching planned article found for live research.");
  process.exit(1);
}

const results = await fetchLiveSearchResults(item.primaryKeyword);
const research = buildResearchNotesFromSearchResults(item, results);
const researchPath = saveResearchMarkdown(item.slug, researchNotesToMarkdown(research));
saveArticlePlan(updatePlanItem(plan, item.id, { status: "researched", researchNotesPath: relativeContentPath(researchPath) }));

console.log(`Saved live research notes for "${item.title}" to ${relativeContentPath(researchPath)}.`);
