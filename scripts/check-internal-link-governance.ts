import { listings } from "../src/data/listings";
import { getFooterGroups, getListingExploreLinks } from "../src/lib/directory-growth";
import { getHomepageSeoFeatureGroups } from "../src/lib/directory-ux";
import {
  getIndexableAreaSeoPages,
  getIndexableCategorySeoPages,
  getIndexableFacetSeoPages,
  getIndexablePopularSearchSeoPages
} from "../src/lib/seo-pages";
import { getPublicGuideArticles } from "../src/lib/articles";
import { buildInternalLinkAuditReport, renderInternalLinkAuditReport } from "../src/lib/internal-link-audit";

async function runAudit() {
  const listingSources = listings.map((listing) => ({
    sourcePageType: "listing_detail" as const,
    sourceLabel: listing.slug,
    groups: getListingExploreLinks(listing)
  }));

  const homepageSources = [
    {
      sourcePageType: "homepage" as const,
      sourceLabel: "homepage SEO links",
      groups: getHomepageSeoFeatureGroups().map((group) => ({
        title: group.title,
        description: group.copy,
        links: group.links
      }))
    },
    {
      sourcePageType: "homepage" as const,
      sourceLabel: "footer links",
      groups: getFooterGroups().map((group) => ({
        title: group.title,
        description: `${group.title} footer navigation links.`,
        links: group.links
      }))
    }
  ];

  const seoSources = [
    ...getIndexableAreaSeoPages(),
    ...getIndexableCategorySeoPages(),
    ...getIndexablePopularSearchSeoPages(),
    ...getIndexableFacetSeoPages()
  ].map((page) => ({
    sourcePageType: page.kind === "area"
      ? "area_hub" as const
      : page.kind === "category"
        ? "category_hub" as const
        : page.kind === "best"
          ? "best_hub" as const
          : "facet_hub" as const,
    sourceLabel: page.metadata.canonical,
    groups: page.relatedLinkGroups.map((group) => ({
      title: group.title,
      description: `${group.title} related internal links.`,
      links: group.links
    }))
  }));

  const guideSources = getPublicGuideArticles().map((article) => ({
    sourcePageType: "guide_article" as const,
    sourceLabel: `/guides/${article.slug}`,
    groups: [
      {
        title: "Related directory pages",
        description: "Guide links that move readers into useful directory pages.",
        links: article.internalLinks
      }
    ]
  }));

  const report = buildInternalLinkAuditReport([...listingSources, ...homepageSources, ...seoSources, ...guideSources]);
  console.log(renderInternalLinkAuditReport(report));

  if (report.totals.blockers > 0) {
    process.exit(1);
  }
}

runAudit().catch((error) => {
  console.error(error);
  process.exit(1);
});
