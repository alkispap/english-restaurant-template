import { getArticlePlanDuplicateWarnings } from "../src/lib/article-planner";
import { loadArticleWorkflowState } from "./article-script-utils";

const { plan, articles } = loadArticleWorkflowState();
const warnings = getArticlePlanDuplicateWarnings(plan, articles);

if (!warnings.length) {
  console.log("No article duplicate warnings found.");
  process.exit(0);
}

for (const warning of warnings) {
  console.log(`${warning.blocking ? "BLOCKING" : "REVIEW"} ${warning.type}: ${warning.message} (${warning.topicIds.join(", ")})`);
}

process.exit(warnings.some((warning) => warning.blocking) ? 1 : 0);
