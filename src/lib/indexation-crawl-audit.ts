import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { listings } from "@/data/listings";
import { getPublicGuideArticles, guidePath } from "@/lib/articles";
import {
  filterListings,
  getAreas,
  getCategories,
  getFacetLabels,
  getNeighborhoods,
  slugify,
  type FacetKey
} from "@/lib/directory";
import { getEnabledSitemapRouteKinds } from "@/lib/directory-features";
import { getAreaCategoryCombinations, getPopularSearches } from "@/lib/directory-growth";
import { getIndexedListingFilterCount, getListingFilterCount } from "@/lib/listing-filter-counts";
import {
  SEO_POLICY,
  isApprovedHighIntentFacet,
  isListingIndexable
} from "@/lib/seo-policy";
import {
  areaCategoryPath,
  areaPath,
  categoryPath,
  dietaryPath,
  listingDetailPath,
  neighborhoodPath,
  offeringPath,
  popularSearchPath,
  servicePath,
  typePath
} from "@/lib/routes";

type IssueSeverity = "blocker" | "warning";

export type IndexationCrawlIssue = {
  code: string;
  severity: IssueSeverity;
  message: string;
  urls: string[];
  recommendation: string;
};

export type IndexationCrawlReport = {
  generatedAt: string;
  status: "pass" | "needs_review" | "blocked";
  summary: {
    sitemapUrls: number;
    expectedIndexableUrls: number;
    indexableListingUrls: number;
    indexableSeoHubUrls: number;
    publicGuideUrls: number;
  };
  totals: {
    blockers: number;
    warnings: number;
  };
  issues: IndexationCrawlIssue[];
};

type ExpectedIndexablePaths = {
  all: Set<string>;
  listings: string[];
  seoHubs: string[];
  guides: string[];
};

let expectedIndexablePathsCache: ExpectedIndexablePaths | undefined;

export function buildIndexationCrawlReport({
  sitemapEntries,
  now = new Date()
}: {
  sitemapEntries: MetadataRoute.Sitemap;
  now?: Date;
}): IndexationCrawlReport {
  const sitemapUrls = sitemapEntries.map((entry) => String(entry.url));
  const expectedPaths = getExpectedIndexablePaths();
  const sitemapPaths = sitemapUrls.flatMap((url) => pathFromSitemapUrl(url) ?? []);
  const issues: IndexationCrawlIssue[] = [];

  addDuplicateUrlIssues(sitemapUrls, issues);
  addInvalidOrExternalUrlIssues(sitemapUrls, issues);
  addQueryUrlIssues(sitemapUrls, issues);
  addUnexpectedPathIssues(sitemapPaths, expectedPaths.all, issues);
  addMissingPathIssues(sitemapPaths, expectedPaths.all, issues);

  const blockers = issues.filter((issue) => issue.severity === "blocker").length;
  const warnings = issues.filter((issue) => issue.severity === "warning").length;

  return {
    generatedAt: now.toISOString(),
    status: blockers > 0 ? "blocked" : warnings > 0 ? "needs_review" : "pass",
    summary: {
      sitemapUrls: sitemapUrls.length,
      expectedIndexableUrls: expectedPaths.all.size,
      indexableListingUrls: expectedPaths.listings.length,
      indexableSeoHubUrls: expectedPaths.seoHubs.length,
      publicGuideUrls: expectedPaths.guides.length
    },
    totals: {
      blockers,
      warnings
    },
    issues
  };
}

export function renderIndexationCrawlReport(report: IndexationCrawlReport) {
  const lines = [
    "Indexation crawl audit",
    `Generated: ${report.generatedAt}`,
    `Status: ${report.status}`,
    "",
    `Sitemap URLs: ${report.summary.sitemapUrls}`,
    `Expected indexable URLs: ${report.summary.expectedIndexableUrls}`,
    `Indexable restaurant URLs: ${report.summary.indexableListingUrls}`,
    `Indexable SEO hub URLs: ${report.summary.indexableSeoHubUrls}`,
    `Public guide URLs: ${report.summary.publicGuideUrls}`,
    `Blockers: ${report.totals.blockers}`,
    `Warnings: ${report.totals.warnings}`
  ];

  if (report.issues.length === 0) {
    lines.push("", "No sitemap, canonical, or indexation crawl issues found.");
    return lines.join("\n");
  }

  lines.push("", "Issues");
  report.issues.forEach((issue) => {
    lines.push(`- [${issue.severity}] ${issue.code}: ${issue.message}`);
    issue.urls.slice(0, 10).forEach((url) => lines.push(`  - ${url}`));
    if (issue.urls.length > 10) lines.push(`  - ...and ${issue.urls.length - 10} more`);
    lines.push(`  Recommendation: ${issue.recommendation}`);
  });

  return lines.join("\n");
}

function getExpectedIndexablePaths() {
  if (expectedIndexablePathsCache) return expectedIndexablePathsCache;

  const listingPaths = getIndexableListingPaths();
  const seoHubPaths = getIndexableSeoHubPaths();
  const guidePaths = getPublicGuidePaths();

  expectedIndexablePathsCache = {
    all: new Set([
      "/",
      "/restaurants",
      "/areas",
      "/categories",
      ...listingPaths,
      ...seoHubPaths,
      ...guidePaths
    ]),
    listings: listingPaths,
    seoHubs: seoHubPaths,
    guides: guidePaths
  };

  return expectedIndexablePathsCache;
}

function getIndexableListingPaths() {
  return listings.filter(isListingIndexable).map((listing) => listingDetailPath(listing.slug));
}

function getIndexableSeoHubPaths() {
  const enabledRoutes = getEnabledSitemapRouteKinds();
  return [
    ...getAreas()
      .filter((area) => getListingFilterCount("area", slugify(area)) >= SEO_POLICY.routeThresholds.area)
      .map((area) => areaPath(slugify(area))),
    ...getNeighborhoods()
      .filter((neighborhood) => getListingFilterCount("neighborhood", slugify(neighborhood)) >= SEO_POLICY.routeThresholds.neighborhood)
      .map((neighborhood) => neighborhoodPath(slugify(neighborhood))),
    ...getCategories()
      .filter((category) => getListingFilterCount("category", slugify(category)) >= SEO_POLICY.routeThresholds.category)
      .map((category) => categoryPath(slugify(category))),
    ...(enabledRoutes.areaCategories
      ? getAreaCategoryCombinations()
          .filter((combination) => combination.count >= SEO_POLICY.routeThresholds.areaCategory)
          .map((combination) => areaCategoryPath(combination.areaSlug, combination.categorySlug))
      : []),
    ...(enabledRoutes.popularSearches
      ? getPopularSearches()
          .filter((search) => routeFilterCount(search.filters) >= SEO_POLICY.routeThresholds.best)
          .map((search) => popularSearchPath(search.slug))
      : []),
    ...(enabledRoutes.types ? getFacetPaths("type") : []),
    ...(enabledRoutes.dietary ? getFacetPaths("dietary") : []),
    ...(enabledRoutes.services ? getFacetPaths("service") : []),
    ...(enabledRoutes.offerings ? getFacetPaths("offering") : [])
  ];
}

function getPublicGuidePaths() {
  return getPublicGuideArticles().map((article) => guidePath(article.slug));
}

function getFacetPaths(facet: FacetKey) {
  return getFacetLabels(facet)
    .filter((label) => isApprovedHighIntentFacet(facet, slugify(label)))
    .filter((label) => getListingFilterCount(facet, slugify(label)) >= SEO_POLICY.routeThresholds.facet)
    .map((label) => facetPath(facet, slugify(label)));
}

function routeFilterCount(filters: Parameters<typeof getIndexedListingFilterCount>[0]) {
  const indexedCount = getIndexedListingFilterCount(filters);
  if (indexedCount !== undefined) return indexedCount;
  if (Object.keys(filters).length === 0) return listings.length;
  return filterListings(filters).length;
}

function facetPath(facet: FacetKey, slug: string) {
  if (facet === "type") return typePath(slug);
  if (facet === "dietary") return dietaryPath(slug);
  if (facet === "service") return servicePath(slug);
  return offeringPath(slug);
}

function addDuplicateUrlIssues(urls: string[], issues: IndexationCrawlIssue[]) {
  const counts = countValues(urls);
  const duplicates = [...counts.entries()].filter(([, count]) => count > 1).map(([url]) => url);
  if (duplicates.length === 0) return;

  issues.push({
    code: "duplicate-sitemap-url",
    severity: "blocker",
    message: `${duplicates.length} sitemap URL${duplicates.length === 1 ? "" : "s"} appear more than once.`,
    urls: duplicates,
    recommendation: "Keep one canonical sitemap entry per page so Google does not receive conflicting crawl signals."
  });
}

function addInvalidOrExternalUrlIssues(urls: string[], issues: IndexationCrawlIssue[]) {
  const invalidOrExternal = urls.filter((url) => !pathFromSitemapUrl(url));
  if (invalidOrExternal.length === 0) return;

  issues.push({
    code: "invalid-or-external-sitemap-url",
    severity: "blocker",
    message: `${invalidOrExternal.length} sitemap URL${invalidOrExternal.length === 1 ? "" : "s"} are invalid or outside ${siteConfig.url}.`,
    urls: invalidOrExternal,
    recommendation: "Only include valid absolute URLs from the configured production domain."
  });
}

function addQueryUrlIssues(urls: string[], issues: IndexationCrawlIssue[]) {
  const queryUrls = urls.filter((url) => {
    try {
      const parsed = new URL(url);
      return parsed.search.length > 0 || parsed.hash.length > 0;
    } catch {
      return false;
    }
  });
  if (queryUrls.length === 0) return;

  issues.push({
    code: "query-url-in-sitemap",
    severity: "blocker",
    message: `${queryUrls.length} sitemap URL${queryUrls.length === 1 ? "" : "s"} include query strings or hashes.`,
    urls: queryUrls,
    recommendation: "Keep filtered/search-state URLs out of the sitemap and point them back to clean canonicals."
  });
}

function addUnexpectedPathIssues(paths: string[], expectedPaths: Set<string>, issues: IndexationCrawlIssue[]) {
  const unexpected = unique(paths.filter((path) => !expectedPaths.has(path)));
  if (unexpected.length === 0) return;

  issues.push({
    code: "unexpected-sitemap-url",
    severity: "blocker",
    message: `${unexpected.length} sitemap path${unexpected.length === 1 ? "" : "s"} are not approved indexable routes.`,
    urls: unexpected,
    recommendation: "Remove stale, noindex, draft, query-state, or legacy paths from sitemap generation."
  });
}

function addMissingPathIssues(paths: string[], expectedPaths: Set<string>, issues: IndexationCrawlIssue[]) {
  const sitemapPathSet = new Set(paths);
  const missing = [...expectedPaths].filter((path) => !sitemapPathSet.has(path));
  if (missing.length === 0) return;

  issues.push({
    code: "missing-indexable-sitemap-url",
    severity: "warning",
    message: `${missing.length} approved indexable path${missing.length === 1 ? "" : "s"} are missing from the sitemap.`,
    urls: missing,
    recommendation: "Add approved indexable pages to the sitemap so Google can discover them consistently."
  });
}

function pathFromSitemapUrl(url: string) {
  try {
    const parsed = new URL(url);
    const expectedOrigin = new URL(siteConfig.url).origin;
    if (parsed.origin !== expectedOrigin) return undefined;
    if (parsed.search || parsed.hash) return parsed.pathname;
    return parsed.pathname;
  } catch {
    return undefined;
  }
}

function countValues(values: string[]) {
  return values.reduce((counts, value) => counts.set(value, (counts.get(value) ?? 0) + 1), new Map<string, number>());
}

function unique(values: string[]) {
  return [...new Set(values)];
}
