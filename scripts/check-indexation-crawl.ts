import sitemap from "../src/app/sitemap";
import { buildIndexationCrawlReport, renderIndexationCrawlReport } from "../src/lib/indexation-crawl-audit";

const report = buildIndexationCrawlReport({ sitemapEntries: sitemap() });

console.log(renderIndexationCrawlReport(report));

if (report.totals.blockers > 0) {
  process.exit(1);
}
