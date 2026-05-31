import type { DirectoryPageTypeBrief } from "@/lib/directory-semantic-map";
import { directorySemanticMap, getPageBrief } from "@/lib/directory-semantic-map";
import { filterListings, type FacetKey } from "@/lib/directory";
import { SEO_POLICY, isApprovedHighIntentFacet } from "@/lib/seo-policy";

export type InternalLinkAuditLink = {
  label: string;
  href: string;
};

export type InternalLinkAuditGroup = {
  title: string;
  description?: string;
  links: InternalLinkAuditLink[];
};

export type InternalLinkAuditInput = {
  sourcePageType: DirectoryPageTypeBrief;
  sourceLabel: string;
  groups: InternalLinkAuditGroup[];
};

export type InternalLinkAuditIssue = {
  severity: "blocker" | "warning";
  code: string;
  source: string;
  message: string;
};

export type InternalLinkAuditReport = {
  totals: {
    sources: number;
    links: number;
    blockers: number;
    warnings: number;
  };
  issues: InternalLinkAuditIssue[];
};

const weakAnchors = new Set(["click here", "explore more", "read more", "more", "view"]);
const hrefIndexabilityCache = new Map<string, boolean>();

export function buildInternalLinkAuditReport(sources: InternalLinkAuditInput[]): InternalLinkAuditReport {
  const issues: InternalLinkAuditIssue[] = [];
  let links = 0;

  for (const source of sources) {
    const labels = new Map<string, number>();
    const allowedTargets = getPageBrief(source.sourcePageType).allowedLinkTargets;

    for (const group of source.groups) {
      if (!group.description?.trim()) {
        issues.push({
          severity: "warning",
          code: "bridge_description_missing",
          source: source.sourceLabel,
          message: `${group.title} is missing a contextual bridge description.`
        });
      }

      for (const link of group.links) {
        links += 1;
        const labelKey = link.label.trim().toLowerCase();
        labels.set(labelKey, (labels.get(labelKey) ?? 0) + 1);

        if (weakAnchors.has(labelKey)) {
          issues.push({
            severity: "warning",
            code: "weak_anchor",
            source: source.sourceLabel,
            message: `${link.href} uses weak anchor text "${link.label}".`
          });
        }

        const targetPageType = pageTypeForHref(link.href);
        if (!targetPageType || !isInternalHrefIndexable(link.href)) {
          issues.push({
            severity: "blocker",
            code: "noindex_or_invalid_target",
            source: source.sourceLabel,
            message: `${link.href} is not a valid indexable internal target.`
          });
        } else if (!allowedTargets.includes(targetPageType)) {
          issues.push({
            severity: "warning",
            code: "unexpected_link_flow",
            source: source.sourceLabel,
            message: `${source.sourcePageType} links to ${targetPageType}, outside the semantic page brief.`
          });
        }
      }
    }

    for (const [label, count] of labels) {
      if (count > 1) {
        issues.push({
          severity: "warning",
          code: "repeated_anchor",
          source: source.sourceLabel,
          message: `Anchor "${label}" appears ${count} times on the same source.`
        });
      }
    }
  }

  return {
    totals: {
      sources: sources.length,
      links,
      blockers: issues.filter((issue) => issue.severity === "blocker").length,
      warnings: issues.filter((issue) => issue.severity === "warning").length
    },
    issues
  };
}

export function renderInternalLinkAuditReport(report: InternalLinkAuditReport) {
  return [
    "Internal link governance audit",
    "",
    `Sources: ${report.totals.sources}`,
    `Links: ${report.totals.links}`,
    `Blockers: ${report.totals.blockers}`,
    `Warnings: ${report.totals.warnings}`,
    "",
    "Issues:",
    report.issues.length
      ? report.issues.map((issue) => `- [${issue.severity}] ${issue.source}: ${issue.message}`).join("\n")
      : "- None"
  ].join("\n");
}

export function isInternalHrefIndexable(href: string) {
  const cached = hrefIndexabilityCache.get(href);
  if (cached !== undefined) return cached;

  const result = computeInternalHrefIndexability(href);
  hrefIndexabilityCache.set(href, result);
  return result;
}

function computeInternalHrefIndexability(href: string) {
  const pageType = pageTypeForHref(href);
  if (!pageType) return false;

  const areaCategoryMatch = href.match(/^\/areas\/([^/?]+)\/categories\/([^/?]+)$/);
  if (areaCategoryMatch) {
    const count = filterListings({ area: areaCategoryMatch[1], category: areaCategoryMatch[2] }).length;
    return count >= SEO_POLICY.routeThresholds.areaCategory;
  }

  const areaMatch = href.match(/^\/areas\/([^/?]+)$/);
  if (areaMatch) {
    return filterListings({ area: areaMatch[1] }).length >= SEO_POLICY.routeThresholds.area;
  }

  const neighborhoodMatch = href.match(/^\/neighborhoods\/([^/?]+)$/);
  if (neighborhoodMatch) {
    return filterListings({ neighborhood: neighborhoodMatch[1] }).length >= SEO_POLICY.routeThresholds.neighborhood;
  }

  const categoryMatch = href.match(/^\/categories\/([^/?]+)$/);
  if (categoryMatch) {
    return filterListings({ category: categoryMatch[1] }).length >= SEO_POLICY.routeThresholds.category;
  }

  const facetMatch = href.match(/^\/(services|dietary|types|offerings)\/([^/?]+)$/);
  if (facetMatch) {
    const facet = facetKeyForPrefix(facetMatch[1]);
    const slug = facetMatch[2];
    return Boolean(
      facet &&
        isApprovedHighIntentFacet(facet, slug) &&
        filterListings({ [facet]: slug }).length >= SEO_POLICY.routeThresholds.facet
    );
  }

  if (href.match(/^\/best\/[^/?]+$/)) return true;
  if (href.match(/^\/listings\/[^/?]+$/)) return true;
  if (href === "/") return true;

  return false;
}

function pageTypeForHref(href: string): DirectoryPageTypeBrief | undefined {
  if (href === "/") return "homepage";
  if (href.match(/^\/listings\/[^/?]+$/)) return "listing_detail";
  if (href.match(/^\/areas\/[^/?]+\/categories\/[^/?]+$/)) return "area_category_hub";
  if (href.match(/^\/areas\/[^/?]+$/)) return "area_hub";
  if (href.match(/^\/neighborhoods\/[^/?]+$/)) return "neighborhood_hub";
  if (href.match(/^\/categories\/[^/?]+$/)) return "category_hub";
  if (href.match(/^\/best\/[^/?]+$/)) return "best_hub";
  if (href.match(/^\/(services|dietary|types|offerings)\/[^/?]+$/)) return "facet_hub";

  return undefined;
}

function facetKeyForPrefix(prefix: string): FacetKey | undefined {
  if (prefix === "services") return "service";
  if (prefix === "dietary") return "dietary";
  if (prefix === "types") return "type";
  if (prefix === "offerings") return "offering";
  return undefined;
}

export function allKnownPageTypesHaveBriefs() {
  return directorySemanticMap.pageBriefs.every((brief) => Boolean(getPageBrief(brief.pageType)));
}
