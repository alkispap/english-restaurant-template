import { buildDraftArticleFromPlanAndResearch, researchNotesFromMarkdown } from "../src/lib/article-generation";
import { findNextPlannedArticle, getArticlePlanDuplicateWarnings, getBlockingDuplicateWarnings } from "../src/lib/article-planner";
import {
  argValue,
  loadArticleWorkflowState,
  readResearchMarkdown,
  saveArticleDraft,
  saveArticlePlan,
  updatePlanItem
} from "./article-script-utils";

const { plan, articles } = loadArticleWorkflowState();
const requestedId = argValue("id");
const item = requestedId
  ? plan.find((topic) => topic.id === requestedId)
  : plan.find((topic) => topic.status === "researched") ?? findNextPlannedArticle(plan, articles);

if (!item) {
  console.error("No matching article topic found for draft creation.");
  process.exit(1);
}

const blockingWarnings = getBlockingDuplicateWarnings(getArticlePlanDuplicateWarnings([item], articles));
if (blockingWarnings.length) {
  for (const warning of blockingWarnings) {
    console.error(`Blocking duplicate warning: ${warning.message}`);
  }
  process.exit(1);
}

const markdown = readResearchMarkdown(item);
if (!markdown) {
  console.error(`No research notes found for "${item.title}". Run article-live-research first.`);
  process.exit(1);
}

const research = researchNotesFromMarkdown(markdown, item);
const draft = buildDraftArticleFromPlanAndResearch(item, research);
saveArticleDraft(draft);
saveArticlePlan(updatePlanItem(plan, item.id, { status: "drafted", draftPath: `content/articles/${item.slug}.json` }));

console.log(`Created draft article at content/articles/${item.slug}.json.`);
