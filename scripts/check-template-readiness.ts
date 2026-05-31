import fs from "node:fs";
import path from "node:path";
import { directoryConfig } from "../src/config/directory";
import { siteConfig } from "../src/config/site";
import { listings } from "../src/data/listings";
import { buildTemplateReadinessReport, renderTemplateReadinessReport } from "../src/lib/template-readiness-audit";

const importReportPath = path.join(process.cwd(), "data", "import-report.md");
const importReportText = fs.existsSync(importReportPath) ? fs.readFileSync(importReportPath, "utf8") : undefined;

if (require.main === module) {
  console.log(
    renderTemplateReadinessReport(
      buildTemplateReadinessReport({
        site: siteConfig,
        directory: directoryConfig,
        listings,
        importReportText
      })
    )
  );
}
