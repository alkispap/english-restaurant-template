import { siteConfig } from "@/config/site";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * The recognised page types in this directory.
 * Matches DIRECTORY_PAGE_TYPES in directory-analytics.ts.
 */
export type DirectoryPageTypeBrief =
  | "homepage"
  | "listing_detail"
  | "area_hub"
  | "category_hub"
  | "area_category_hub"
  | "neighborhood_hub"
  | "best_hub"
  | "facet_hub";

/**
 * The recognised EAV attribute groups used by listing templates.
 * These govern which database fields must be present on each page type.
 */
export type EavGroup =
  | "identity"
  | "location"
  | "category"
  | "reviews"
  | "price"
  | "services"
  | "dietary"
  | "transport"
  | "contactActions"
  | "freshness";

/**
 * PageBrief — the semantic content brief for a single page type.
 *
 * - primaryEntity:      The main real-world entity the page is about.
 * - macroContext:       The one overarching intent of the page. Must not drift.
 * - networkRole:        'core' pages are primary money/index targets.
 *                       'supporting' pages build trust but are secondary.
 * - searchIntent:       Plain-English description of why a user lands here.
 * - requiredEavGroups:  DB attribute groups that MUST be present for the page
 *                       to be considered semantically complete.
 * - allowedLinkTargets: Page types this page is permitted to link to.
 *                       Enforces directional link flow (hub-and-spoke).
 * - indexationRole:     How the SEO policy should treat this page type.
 */
export type PageBrief = {
  pageType: DirectoryPageTypeBrief;
  primaryEntity: string;
  macroContext: string;
  networkRole: "core" | "supporting";
  searchIntent: string;
  requiredEavGroups: EavGroup[];
  allowedLinkTargets: DirectoryPageTypeBrief[];
  indexationRole: "canonical_target" | "quality_gated" | "supporting_noindex_when_weak";
};

// ---------------------------------------------------------------------------
// Task 1A: Core Identity & Copy Safety
// ---------------------------------------------------------------------------

/**
 * directorySemanticMap – the central ontology object for this directory.
 *
 * Task 1A defines the site-wide identity signals:
 *   - centralEntity:           The primary topic of the entire site.
 *   - sourceContext:           The lens through which topics are discussed.
 *   - location:                The geographic scope of the directory.
 *   - requiredIdentityPhrases: N-grams that must appear site-wide to anchor
 *                              the vector centroid for search engines.
 *   - copySafety:              Rules to prevent stale wording when this
 *                              template is copied for a different niche.
 *
 * Task 1B extends this object with pageBriefs.
 */
export const directorySemanticMap = {
  // --- Core identity -------------------------------------------------------
  centralEntity: siteConfig.niche,
  sourceContext: "local business comparison directory" as const,
  location: siteConfig.cityOrRegion,

  // Required n-grams / identity phrases that should appear site-wide.
  // These reinforce the central entity and prevent semantic drift.
  requiredIdentityPhrases: [
    siteConfig.niche,                                           // "Indian restaurants in London"
    `${siteConfig.cityOrRegion} ${siteConfig.niche}`,           // "London Indian restaurants in London"
    siteConfig.siteName                                         // "Indian Restaurants London"
  ] as string[],

  // --- Copy safety ---------------------------------------------------------
  // When this template is cloned for a different niche (e.g. "Plumbers in Dublin"),
  // these checks alert the developer to update niche-specific wording.
  copySafety: {
    // Terms that must be replaced before going live with a different niche.
    blockedStaleTerms: ["indian", "curry", "tandoor", "biryani"],

    // Config fields that MUST be updated in siteConfig / directoryConfig
    // before launching a copied directory.
    requiredIdentityFields: [
      "siteName",
      "niche",
      "cityOrRegion",
      "listingLabel",
      "categoryLabel"
    ]
  },

  // ---------------------------------------------------------------------------
  // Task 1B: Page Briefs
  // ---------------------------------------------------------------------------
  // One brief per page type. Each brief defines:
  //   - The single macro context (one intent per page — no thematic drift)
  //   - Which EAV groups must be populated for the page to be complete
  //   - Which page types this page is allowed to link to (directional flow)
  //   - How search engines should index this page type
  pageBriefs: [
    {
      pageType: "homepage" as const,
      primaryEntity: "local directory",
      macroContext: "citywide directory comparison",
      networkRole: "core" as const,
      searchIntent: "compare all Indian restaurants across London",
      requiredEavGroups: ["identity", "location", "category", "freshness"] as EavGroup[],
      allowedLinkTargets: ["area_hub", "category_hub", "area_category_hub", "best_hub", "facet_hub"] as DirectoryPageTypeBrief[],
      indexationRole: "canonical_target" as const
    },
    {
      pageType: "listing_detail" as const,
      primaryEntity: "local business listing",
      macroContext: "single business evaluation",
      networkRole: "core" as const,
      searchIntent: "evaluate one restaurant before visiting or contacting it",
      requiredEavGroups: ["identity", "location", "reviews", "services", "contactActions", "freshness"] as EavGroup[],
      allowedLinkTargets: ["area_hub", "neighborhood_hub", "category_hub", "area_category_hub", "facet_hub"] as DirectoryPageTypeBrief[],
      indexationRole: "quality_gated" as const
    },
    {
      pageType: "area_hub" as const,
      primaryEntity: "area directory hub",
      macroContext: "local area comparison",
      networkRole: "core" as const,
      searchIntent: "compare Indian restaurants in one local area of London",
      requiredEavGroups: ["location", "category", "reviews", "services"] as EavGroup[],
      allowedLinkTargets: ["category_hub", "area_category_hub", "listing_detail", "facet_hub"] as DirectoryPageTypeBrief[],
      indexationRole: "supporting_noindex_when_weak" as const
    },
    {
      pageType: "category_hub" as const,
      primaryEntity: "category directory hub",
      macroContext: "category comparison across the city",
      networkRole: "core" as const,
      searchIntent: "compare all restaurants in one cuisine category across London",
      requiredEavGroups: ["category", "location", "reviews", "services"] as EavGroup[],
      allowedLinkTargets: ["area_hub", "area_category_hub", "listing_detail", "facet_hub"] as DirectoryPageTypeBrief[],
      indexationRole: "supporting_noindex_when_weak" as const
    },
    {
      pageType: "area_category_hub" as const,
      primaryEntity: "area and category directory hub",
      macroContext: "local category comparison",
      networkRole: "core" as const,
      searchIntent: "compare restaurants of one cuisine type in one specific area of London",
      requiredEavGroups: ["location", "category", "reviews", "services", "freshness"] as EavGroup[],
      allowedLinkTargets: ["area_hub", "category_hub", "listing_detail"] as DirectoryPageTypeBrief[],
      indexationRole: "supporting_noindex_when_weak" as const
    },
    {
      pageType: "neighborhood_hub" as const,
      primaryEntity: "neighborhood directory hub",
      macroContext: "hyper-local neighborhood comparison",
      networkRole: "supporting" as const,
      searchIntent: "find Indian restaurants within a specific London neighborhood",
      requiredEavGroups: ["location", "category", "reviews"] as EavGroup[],
      allowedLinkTargets: ["area_hub", "listing_detail"] as DirectoryPageTypeBrief[],
      indexationRole: "supporting_noindex_when_weak" as const
    },
    {
      pageType: "best_hub" as const,
      primaryEntity: "best-of directory hub",
      macroContext: "curated ranked comparison",
      networkRole: "supporting" as const,
      searchIntent: "find the top-rated or most-reviewed Indian restaurants in London",
      requiredEavGroups: ["reviews", "category", "location"] as EavGroup[],
      allowedLinkTargets: ["listing_detail", "area_hub", "category_hub"] as DirectoryPageTypeBrief[],
      indexationRole: "supporting_noindex_when_weak" as const
    },
    {
      pageType: "facet_hub" as const,
      primaryEntity: "service or feature directory hub",
      macroContext: "attribute-filtered comparison",
      networkRole: "supporting" as const,
      searchIntent: "find restaurants matching a specific service, dietary option, or feature",
      requiredEavGroups: ["services", "dietary", "category", "location"] as EavGroup[],
      allowedLinkTargets: ["listing_detail", "area_hub", "category_hub"] as DirectoryPageTypeBrief[],
      indexationRole: "supporting_noindex_when_weak" as const
    }
  ] satisfies PageBrief[]
} as const;

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/**
 * getPageBrief — returns the semantic brief for a given page type.
 * Throws if the page type has no registered brief, so missing briefs
 * are caught at build/test time rather than silently ignored at runtime.
 */
export function getPageBrief(pageType: DirectoryPageTypeBrief): PageBrief {
  const brief = directorySemanticMap.pageBriefs.find((item) => item.pageType === pageType);
  if (!brief) throw new Error(`Missing semantic page brief for page type: "${pageType}"`);
  return brief as PageBrief;
}

