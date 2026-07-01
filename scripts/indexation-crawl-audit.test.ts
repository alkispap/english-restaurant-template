import assert from "node:assert/strict";
import sitemap from "../src/app/sitemap";
import { siteConfig } from "../src/config/site";
import { buildIndexationCrawlReport, renderIndexationCrawlReport } from "../src/lib/indexation-crawl-audit";

const report = buildIndexationCrawlReport({ sitemapEntries: sitemap(), now: new Date("2026-06-29T00:00:00.000Z") });

assert.equal(report.status, "pass");
assert.equal(report.totals.blockers, 0);
assert.equal(report.totals.warnings, 0);
assert.equal(report.summary.sitemapUrls, sitemap().length);
assert.ok(report.summary.expectedIndexableUrls > 0);

const rendered = renderIndexationCrawlReport(report);
assert.match(rendered, /Indexation crawl audit/);
assert.match(rendered, /Status: pass/);
assert.match(rendered, new RegExp(`Sitemap URLs: ${sitemap().length}`));

const duplicateReport = buildIndexationCrawlReport({
  sitemapEntries: [
    { url: `${siteConfig.url}/restaurants` },
    { url: `${siteConfig.url}/restaurants` }
  ],
  now: new Date("2026-06-29T00:00:00.000Z")
});

assert.equal(duplicateReport.status, "blocked");
assert.ok(duplicateReport.issues.some((issue) => issue.code === "duplicate-sitemap-url"));

const queryReport = buildIndexationCrawlReport({
  sitemapEntries: [{ url: `${siteConfig.url}/restaurants?area=soho` }],
  now: new Date("2026-06-29T00:00:00.000Z")
});

assert.equal(queryReport.status, "blocked");
assert.ok(queryReport.issues.some((issue) => issue.code === "query-url-in-sitemap"));

const staleRouteReport = buildIndexationCrawlReport({
  sitemapEntries: [{ url: `${siteConfig.url}/listings` }],
  now: new Date("2026-06-29T00:00:00.000Z")
});

assert.equal(staleRouteReport.status, "blocked");
assert.ok(staleRouteReport.issues.some((issue) => issue.code === "unexpected-sitemap-url"));
