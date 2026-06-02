import { buildDraftArticleFromPlanAndResearch, buildResearchNotesFromSearchResults, fetchLiveSearchResults, researchNotesToMarkdown } from "../src/lib/article-generation";
import {
  findNextPlannedArticle,
  getArticlePlanDuplicateWarnings,
  getBlockingDuplicateWarnings
} from "../src/lib/article-planner";
import {
  argNumber,
  loadArticleWorkflowState,
  relativeContentPath,
  saveArticleDraft,
  saveArticlePlan,
  saveResearchMarkdown,
  updatePlanItem
} from "./article-script-utils";

let { plan, articles } = loadArticleWorkflowState();
const count = argNumber("count", 1);
let created = 0;

for (let index = 0; index < count; index += 1) {
  const next = findNextPlannedArticle(plan, articles);
  if (!next) break;

  const duplicateWarnings = getBlockingDuplicateWarnings(getArticlePlanDuplicateWarnings([next], articles));
  if (duplicateWarnings.length) {
    for (const warning of duplicateWarnings) {
      console.error(`Blocking duplicate warning for "${next.title}": ${warning.message}`);
    }
    process.exit(1);
  }

  const results = await fetchLiveSearchResults(next.primaryKeyword);
  const research = buildResearchNotesFromSearchResults(next, results);
  const researchPath = saveResearchMarkdown(next.slug, researchNotesToMarkdown(research));
  const draft = buildDraftArticleFromPlanAndResearch(next, research);

  saveArticleDraft(draft);
  plan = updatePlanItem(plan, next.id, {
    status: "drafted",
    draftPath: `content/articles/${next.slug}.json`,
    researchNotesPath: relativeContentPath(researchPath)
  });
  articles = [...articles, draft];
  created += 1;

  console.log(`Created draft "${next.title}" with research notes at ${relativeContentPath(researchPath)}.`);
}

saveArticlePlan(plan);

if (!created) {
  console.log("No planned article is ready. Add more planned topics to content/article-plan.json.");
}
