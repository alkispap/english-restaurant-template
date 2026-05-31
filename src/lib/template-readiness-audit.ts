import type { Listing } from "@/data/listings";
import type { DirectoryTemplatePresetKey } from "@/config/directory-presets";
import { getAreas, getCategories, getFacetLabels, filterListings, slugify, type FacetKey } from "@/lib/directory";
import { getAreaCategoryCombinations, getPopularSearches } from "@/lib/directory-growth";
import { isDirectoryFeatureEnabled } from "@/lib/directory-features";
import { buildFreshnessAuditReport } from "@/lib/freshness-audit";
import { SEO_POLICY, isApprovedHighIntentFacet, isListingIndexable } from "@/lib/seo-policy";

export type TemplateReadinessSeverity = "pass" | "info" | "warning" | "blocker";

export type TemplateReadinessIssue = {
  code: string;
  severity: Exclude<TemplateReadinessSeverity, "pass">;
  message: string;
  recommendation: string;
};

export type TemplateReadinessReport = {
  generatedAt: string;
  status: "ready" | "needs_review" | "blocked";
  totals: {
    blockers: number;
    warnings: number;
    info: number;
  };
  issues: TemplateReadinessIssue[];
  recommendations: string[];
};

export type TemplateReadinessSiteConfig = {
  siteName: string;
  name: string;
  niche: string;
  cityOrRegion: string;
  heroEyebrow?: string;
  heroCopy?: string;
  description?: string;
  navigation?: readonly { label: string; href: string }[];
};

export type TemplateReadinessDirectoryConfig = {
  templatePreset?: string;
  listingLabel: string;
  listingPluralLabel: string;
  categoryLabel: string;
  categoryPluralLabel: string;
};

export type TemplateReadinessOptions = {
  site: TemplateReadinessSiteConfig;
  directory: TemplateReadinessDirectoryConfig;
  listings: Listing[];
  importReportText?: string;
  env?: Record<string, string | undefined>;
  now?: Date;
};

type ParsedImportReport = {
  skippedRows: number;
  duplicateRows: number;
  nonOperationalRows: number;
  missingImageWarnings: number;
  missingCategoryWarnings: number;
  totalWarnings: number;
};

export function buildTemplateReadinessReport(options: TemplateReadinessOptions): TemplateReadinessReport {
  const issues: TemplateReadinessIssue[] = [];
  const now = options.now ?? new Date();

  issues.push(...identityIssues(options.site, options.directory));
  issues.push(...productionUrlIssues(options.env ?? process.env));
  issues.push(...importReportIssues(options.importReportText));
  issues.push(...listingQualityIssues(options.listings, now));
  issues.push(...hubStrengthIssues(options.listings));
  issues.push(...seoPolicyIssues(options.directory));
  issues.push(...supabaseIssues(options.env ?? process.env));
  issues.push({
    code: "verification_guidance",
    severity: "info",
    message: "Run the standard verification commands before launch or after copying the template.",
    recommendation: "Run npm test, npm run typecheck, npm run lint, npm run audit:seo, npm run audit:links, npm run audit:freshness, and npm run build."
  });

  const totals = {
    blockers: issues.filter((issue) => issue.severity === "blocker").length,
    warnings: issues.filter((issue) => issue.severity === "warning").length,
    info: issues.filter((issue) => issue.severity === "info").length
  };

  return {
    generatedAt: now.toISOString(),
    status: totals.blockers ? "blocked" : totals.warnings ? "needs_review" : "ready",
    totals,
    issues: sortIssues(issues),
    recommendations: recommendations(issues)
  };
}

export function renderTemplateReadinessReport(report: TemplateReadinessReport) {
  return [
    "Template readiness audit",
    `Generated: ${report.generatedAt}`,
    `Status: ${statusLabel(report.status)}`,
    "",
    `Blockers: ${report.totals.blockers}`,
    `Warnings: ${report.totals.warnings}`,
    `Info: ${report.totals.info}`,
    "",
    "Issues:",
    report.issues.length
      ? report.issues.map((issue) => `- [${issue.severity}] ${issue.message}`).join("\n")
      : "- None",
    "",
    "Recommended actions:",
    report.recommendations.map((recommendation) => `- ${recommendation}`).join("\n")
  ].join("\n");
}

function identityIssues(site: TemplateReadinessSiteConfig, directory: TemplateReadinessDirectoryConfig) {
  const issues: TemplateReadinessIssue[] = [];
  const mainCopy = [
    site.siteName,
    site.name,
    site.niche,
    site.heroEyebrow,
    site.heroCopy,
    site.description,
    ...(site.navigation ?? []).map((item) => item.label)
  ]
    .filter(Boolean)
    .join(" ");
  const expectedNicheTerms = nicheTerms(site);
  const oldTerms = ["indian"];
  const staleTerms = oldTerms.filter((term) => !expectedNicheTerms.includes(term) && includesWord(mainCopy, term));

  if (!site.siteName || !site.name || !site.niche || !site.cityOrRegion) {
    issues.push({
      code: "site_identity_incomplete",
      severity: "warning",
      message: "Site identity fields are incomplete.",
      recommendation: "Review siteName, name, niche, and cityOrRegion in the site config."
    });
  }

  if (!directory.listingLabel || !directory.listingPluralLabel || !directory.categoryLabel || !directory.categoryPluralLabel) {
    issues.push({
      code: "directory_labels_incomplete",
      severity: "warning",
      message: "Directory labels are incomplete.",
      recommendation: "Review listing and category labels before copying or launching the template."
    });
  }

  if (staleTerms.length) {
    issues.push({
      code: "copied_template_old_niche",
      severity: "warning",
      message: `Copied-template wording still mentions ${staleTerms.join(", ")} even though the current niche appears different.`,
      recommendation: "Update site copy, hero copy, description, navigation labels, and footer labels for the copied directory."
    });
  }

  return issues;
}

function productionUrlIssues(env: Record<string, string | undefined>) {
  const value = env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!value) {
    return [
      {
        code: "production_url_missing",
        severity: "blocker",
        message: "NEXT_PUBLIC_SITE_URL is missing.",
        recommendation: "Set NEXT_PUBLIC_SITE_URL to the public production domain before launching."
      } satisfies TemplateReadinessIssue
    ];
  }

  try {
    const url = new URL(value);
    const isLocal = ["localhost", "127.0.0.1", "0.0.0.0"].includes(url.hostname);
    if (url.protocol !== "https:" && !isLocal) {
      return [
        {
          code: "production_url_insecure",
          severity: "warning",
          message: "NEXT_PUBLIC_SITE_URL is not using HTTPS.",
          recommendation: "Use an HTTPS production URL for public launch."
        } satisfies TemplateReadinessIssue
      ];
    }
    if (isLocal) {
      return [
        {
          code: "production_url_local",
          severity: "blocker",
          message: "NEXT_PUBLIC_SITE_URL points to a local development URL.",
          recommendation: "Set NEXT_PUBLIC_SITE_URL to the public production domain before launching."
        } satisfies TemplateReadinessIssue
      ];
    }
  } catch {
    return [
      {
        code: "production_url_invalid",
        severity: "blocker",
        message: "NEXT_PUBLIC_SITE_URL is not a valid URL.",
        recommendation: "Set NEXT_PUBLIC_SITE_URL to a valid public URL, such as https://example.com."
      } satisfies TemplateReadinessIssue
    ];
  }

  return [];
}

function importReportIssues(text?: string) {
  if (!text?.trim()) {
    return [
      {
        code: "import_report_missing",
        severity: "warning",
        message: "data/import-report.md was not found or is empty.",
        recommendation: "Run the directory import and review data/import-report.md before launch."
      } satisfies TemplateReadinessIssue
    ];
  }

  const parsed = parseImportReport(text);
  const issues: TemplateReadinessIssue[] = [];

  if (parsed.skippedRows > 0) {
    issues.push({
      code: "import_report_skipped_rows",
      severity: "warning",
      message: `Import report shows ${parsed.skippedRows.toLocaleString()} skipped rows.`,
      recommendation: "Review skipped rows and confirm they are intentional."
    });
  }
  if (parsed.duplicateRows > 0) {
    issues.push({
      code: "import_report_duplicates",
      severity: "warning",
      message: `Import report shows ${parsed.duplicateRows.toLocaleString()} duplicate rows skipped.`,
      recommendation: "Review duplicate source records before launch."
    });
  }
  if (parsed.nonOperationalRows > 0) {
    issues.push({
      code: "import_report_non_operational",
      severity: "warning",
      message: `Import report shows ${parsed.nonOperationalRows.toLocaleString()} non-operational rows flagged.`,
      recommendation: "Review non-operational listings and confirm closed businesses are handled correctly."
    });
  }
  if (parsed.missingImageWarnings > 0) {
    issues.push({
      code: "import_report_missing_images",
      severity: "warning",
      message: `Import report includes ${parsed.missingImageWarnings.toLocaleString()} missing-image warnings.`,
      recommendation: "Prioritize image enrichment for high-value listings and hubs."
    });
  }
  if (parsed.missingCategoryWarnings > 0) {
    issues.push({
      code: "import_report_missing_categories",
      severity: "warning",
      message: `Import report includes ${parsed.missingCategoryWarnings.toLocaleString()} missing-category warnings.`,
      recommendation: "Fix missing category values so category and area/category hubs stay useful."
    });
  }

  if (!issues.length) {
    issues.push({
      code: "import_report_reviewed",
      severity: "info",
      message: "Import report is present and does not show duplicate, skipped, non-operational, missing-image, or missing-category warnings.",
      recommendation: "Review data/import-report.md after each future import."
    });
  }

  return issues;
}

function listingQualityIssues(listings: Listing[], now: Date) {
  const issues: TemplateReadinessIssue[] = [];
  const total = listings.length;
  if (!total) {
    return [
      {
        code: "listings_missing",
        severity: "blocker",
        message: "No listings are available.",
        recommendation: "Import directory listings before launching or copying the template."
      } satisfies TemplateReadinessIssue
    ];
  }

  const indexableCount = listings.filter(isListingIndexable).length;
  const lowQualityCount = total - indexableCount;
  const freshness = buildFreshnessAuditReport(listings, { now });
  const lowQualityRatio = lowQualityCount / total;
  const highFreshnessRatio = freshness.totals.high / total;

  if (lowQualityRatio > 0.2) {
    issues.push({
      code: "listing_quality_risk",
      severity: "warning",
      message: `${lowQualityCount.toLocaleString()} of ${total.toLocaleString()} listings fail the SEO quality gate.`,
      recommendation: "Review low-quality listings before expanding or launching the copied directory."
    });
  }

  if (highFreshnessRatio > 0.05) {
    issues.push({
      code: "freshness_high_risk",
      severity: "warning",
      message: `${freshness.totals.high.toLocaleString()} listings are high-risk in the freshness audit.`,
      recommendation: "Run npm run audit:freshness and review high-risk listings first."
    });
  }

  return issues;
}

function hubStrengthIssues(listings: Listing[]) {
  if (!listings.length) {
    return [
      {
        code: "weak_hub_coverage",
        severity: "warning",
        message: "Hub coverage is weak because there are no listings to support area, category, or facet pages.",
        recommendation: "Import enough listings to satisfy SEO policy thresholds for important hubs."
      } satisfies TemplateReadinessIssue
    ];
  }

  const areaCount = getAreas().filter((area) => filterListings({ area: slugify(area) }).length >= SEO_POLICY.routeThresholds.area).length;
  const categoryCount = getCategories().filter((category) => filterListings({ category: slugify(category) }).length >= SEO_POLICY.routeThresholds.category).length;
  const areaCategoryCount = getAreaCategoryCombinations().filter((item) => item.count >= SEO_POLICY.routeThresholds.areaCategory).length;
  const popularCount = getPopularSearches().filter((search) => filterListings(search.filters).length >= SEO_POLICY.routeThresholds.best).length;
  const facetCount = countIndexableFacetHubs();

  if (areaCount === 0 || categoryCount === 0 || areaCategoryCount === 0 || popularCount === 0 || facetCount === 0) {
    return [
      {
        code: "weak_hub_coverage",
        severity: "warning",
        message: "One or more SEO hub groups have no indexable pages under the current thresholds.",
        recommendation: "Review area, category, area/category, popular-search, and high-intent facet coverage before launch."
      } satisfies TemplateReadinessIssue
    ];
  }

  return [];
}

function seoPolicyIssues(directory: TemplateReadinessDirectoryConfig) {
  const preset = directory.templatePreset as DirectoryTemplatePresetKey | undefined;
  if (preset && preset !== "restaurant") {
    return [
      {
        code: "seo_policy_facet_review",
        severity: "warning",
        message: "High-intent SEO facets still include restaurant-specific values.",
        recommendation: "Review SEO_POLICY.highIntentFacetSlugs for the copied business type before launching."
      } satisfies TemplateReadinessIssue
    ];
  }

  return [];
}

function supabaseIssues(env: Record<string, string | undefined>) {
  const hasUrl = Boolean(env.NEXT_PUBLIC_SUPABASE_URL?.trim());
  const hasAnonKey = Boolean(env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim());

  if (hasUrl !== hasAnonKey) {
    return [
      {
        code: "supabase_partial_config",
        severity: "warning",
        message: "Supabase account sync is partially configured.",
        recommendation: "Set both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, or leave both empty to disable account sync."
      } satisfies TemplateReadinessIssue
    ];
  }

  if (hasUrl && hasAnonKey) {
    return [
      {
        code: "supabase_enabled",
        severity: "info",
        message: "Supabase account sync appears configured.",
        recommendation: "Confirm the Supabase schema and auth redirect URLs are configured for this directory."
      } satisfies TemplateReadinessIssue
    ];
  }

  return [
    {
      code: "supabase_disabled",
      severity: "info",
      message: "Supabase account sync is disabled safely.",
      recommendation: "Visitors can still save and compare listings locally without Supabase."
    } satisfies TemplateReadinessIssue
  ];
}

function parseImportReport(text: string): ParsedImportReport {
  return {
    skippedRows: numberAfter(text, "Skipped rows"),
    duplicateRows: numberAfter(text, "Duplicate rows skipped"),
    nonOperationalRows: numberAfter(text, "Non-operational rows flagged"),
    missingImageWarnings: countMatches(text, /has no images?/gi),
    missingCategoryWarnings: countMatches(text, /has no category values?/gi),
    totalWarnings: countMatches(text, /^- Row\s+\d+:/gim)
  };
}

function numberAfter(text: string, label: string) {
  const match = text.match(new RegExp(`- ${escapeRegExp(label)}:\\s*([\\d,]+)`, "i"));
  return match ? Number(match[1].replace(/,/g, "")) : 0;
}

function countMatches(text: string, pattern: RegExp) {
  return text.match(pattern)?.length ?? 0;
}

function countIndexableFacetHubs() {
  const facets: FacetKey[] = ["type", "dietary", "service", "offering"];
  return facets
    .filter((facet) => {
      if (facet === "type") return isDirectoryFeatureEnabled("listingTypePages");
      if (facet === "dietary") return isDirectoryFeatureEnabled("dietaryPages");
      if (facet === "service") return isDirectoryFeatureEnabled("servicePages");
      return isDirectoryFeatureEnabled("offeringPages");
    })
    .flatMap((facet) => getFacetLabels(facet).map((label) => ({ facet, slug: slugify(label) })))
    .filter(
      (value) =>
        isApprovedHighIntentFacet(value.facet, value.slug) &&
        filterListings({ [value.facet]: value.slug }).length >= SEO_POLICY.routeThresholds.facet
    ).length;
}

function recommendations(issues: TemplateReadinessIssue[]) {
  const items = Array.from(new Set(issues.map((issue) => issue.recommendation)));
  return items.length ? items : ["No major template readiness issues found."];
}

function sortIssues(issues: TemplateReadinessIssue[]) {
  return [...issues].sort((a, b) => severityWeight(b.severity) - severityWeight(a.severity) || a.code.localeCompare(b.code));
}

function severityWeight(severity: TemplateReadinessIssue["severity"]) {
  if (severity === "blocker") return 3;
  if (severity === "warning") return 2;
  return 1;
}

function statusLabel(status: TemplateReadinessReport["status"]) {
  if (status === "blocked") return "blocked";
  if (status === "needs_review") return "needs review";
  return "ready";
}

function nicheTerms(site: TemplateReadinessSiteConfig) {
  return `${site.siteName} ${site.name} ${site.niche}`
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function includesWord(text: string, term: string) {
  return new RegExp(`\\b${escapeRegExp(term)}\\b`, "i").test(text);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
