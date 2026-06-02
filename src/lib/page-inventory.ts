export type TemplatePageCategory =
  | "homepage-search"
  | "redirect"
  | "listing-detail"
  | "directory-index"
  | "dynamic-seo"
  | "article-guide"
  | "utility"
  | "trust-support"
  | "system-seo"
  | "api";

export type TemplateReusableStatus =
  | "helper-backed"
  | "shared-model-partial"
  | "partially-config-driven"
  | "content-helper"
  | "not-seo-content"
  | "system-generated";

export type TemplateStaleWordingRisk = "low" | "medium" | "high" | "none";
export type TemplateUpgradePriority = "high" | "medium" | "low" | "none";

export type TemplatePageInventoryItem = {
  id: string;
  category: TemplatePageCategory;
  urlPattern: string;
  routeFile: string;
  componentOrModel: string;
  headingSource: string;
  metadataSource: string;
  reusableStatus: TemplateReusableStatus;
  staleWordingRisk: TemplateStaleWordingRisk;
  upgradePriority: TemplateUpgradePriority;
  notes: string;
};

const pageInventory = [
  {
    id: "homepage",
    category: "homepage-search",
    urlPattern: "/",
    routeFile: "src/app/page.tsx",
    componentOrModel: "DirectoryListingsPage + HomepageSeoLinks",
    headingSource: "homepageHeadings helper + DirectoryListingsPage",
    metadataSource: "src/app/page.tsx generateMetadata + siteConfig",
    reusableStatus: "helper-backed",
    staleWordingRisk: "low",
    upgradePriority: "none",
    notes: "Already upgraded with reusable homepage SEO headings."
  },
  {
    id: "listings-redirect",
    category: "redirect",
    urlPattern: "/listings",
    routeFile: "src/app/listings/page.tsx",
    componentOrModel: "Next redirect to homepage",
    headingSource: "No rendered headings",
    metadataSource: "No standalone metadata",
    reusableStatus: "not-seo-content",
    staleWordingRisk: "none",
    upgradePriority: "none",
    notes: "Keeps old listing index route compatible by redirecting query state to /."
  },
  {
    id: "listing-detail",
    category: "listing-detail",
    urlPattern: "/listings/[slug]",
    routeFile: "src/app/listings/[slug]/page.tsx",
    componentOrModel: "Listing detail route",
    headingSource: "src/app/listings/[slug]/page.tsx inline detail sections",
    metadataSource: "generateMetadata from listingShareMetadata",
    reusableStatus: "partially-config-driven",
    staleWordingRisk: "medium",
    upgradePriority: "high",
    notes: "Core SEO page family; section headings should be moved toward reusable detail-page helpers."
  },
  {
    id: "areas-index",
    category: "directory-index",
    urlPattern: "/areas",
    routeFile: "src/app/areas/page.tsx",
    componentOrModel: "Areas index page",
    headingSource: "src/app/areas/page.tsx inline headings",
    metadataSource: "src/app/areas/page.tsx metadata",
    reusableStatus: "partially-config-driven",
    staleWordingRisk: "medium",
    upgradePriority: "medium",
    notes: "Uses config in places but still has generic restaurant wording and should get index-page helpers."
  },
  {
    id: "categories-index",
    category: "directory-index",
    urlPattern: "/categories",
    routeFile: "src/app/categories/page.tsx",
    componentOrModel: "Categories index page",
    headingSource: "src/app/categories/page.tsx inline headings",
    metadataSource: "src/app/categories/page.tsx metadata",
    reusableStatus: "partially-config-driven",
    staleWordingRisk: "medium",
    upgradePriority: "medium",
    notes: "Uses category config but needs reusable headings for future restaurant directory copies."
  },
  {
    id: "area-hub",
    category: "dynamic-seo",
    urlPattern: "/areas/[area]",
    routeFile: "src/app/areas/[area]/page.tsx",
    componentOrModel: "SeoLandingPage + getAreaSeoPage",
    headingSource: "SeoLandingPage model from getAreaSeoPage",
    metadataSource: "getSeoPageMetadata(page)",
    reusableStatus: "helper-backed",
    staleWordingRisk: "low",
    upgradePriority: "none",
    notes: "Shared SEO landing family; upgrade through seo-pages helpers rather than per route."
  },
  {
    id: "neighborhood-hub",
    category: "dynamic-seo",
    urlPattern: "/neighborhoods/[neighborhood]",
    routeFile: "src/app/neighborhoods/[neighborhood]/page.tsx",
    componentOrModel: "SeoLandingPage + getNeighborhoodSeoPage",
    headingSource: "SeoLandingPage model from getNeighborhoodSeoPage",
    metadataSource: "getSeoPageMetadata(page)",
    reusableStatus: "helper-backed",
    staleWordingRisk: "low",
    upgradePriority: "none",
    notes: "Shared SEO landing family for hyper-local pages."
  },
  {
    id: "category-hub",
    category: "dynamic-seo",
    urlPattern: "/categories/[category]",
    routeFile: "src/app/categories/[category]/page.tsx",
    componentOrModel: "SeoLandingPage + getCategorySeoPage",
    headingSource: "SeoLandingPage model from getCategorySeoPage",
    metadataSource: "getSeoPageMetadata(page)",
    reusableStatus: "helper-backed",
    staleWordingRisk: "low",
    upgradePriority: "none",
    notes: "Shared SEO landing family for cuisine/category pages."
  },
  {
    id: "area-category-hub",
    category: "dynamic-seo",
    urlPattern: "/areas/[area]/categories/[category]",
    routeFile: "src/app/areas/[area]/categories/[category]/page.tsx",
    componentOrModel: "SeoLandingPage + getAreaCategorySeoPage",
    headingSource: "SeoLandingPage model from getAreaCategorySeoPage",
    metadataSource: "getSeoPageMetadata(page)",
    reusableStatus: "helper-backed",
    staleWordingRisk: "low",
    upgradePriority: "none",
    notes: "High-intent local category page family; likely best SEO payoff after homepage."
  },
  {
    id: "best-hub",
    category: "dynamic-seo",
    urlPattern: "/best/[slug]",
    routeFile: "src/app/best/[slug]/page.tsx",
    componentOrModel: "SeoLandingPage + getPopularSearchSeoPage",
    headingSource: "SeoLandingPage model from getPopularSearchSeoPage",
    metadataSource: "getSeoPageMetadata(page)",
    reusableStatus: "helper-backed",
    staleWordingRisk: "low",
    upgradePriority: "none",
    notes: "Best-of search pages should use reusable ranking/review heading patterns."
  },
  {
    id: "service-facet",
    category: "dynamic-seo",
    urlPattern: "/services/[service]",
    routeFile: "src/app/services/[service]/page.tsx",
    componentOrModel: "SeoLandingPage + getFacetSeoPage('service')",
    headingSource: "SeoLandingPage model from getFacetSeoPage",
    metadataSource: "getSeoPageMetadata(page)",
    reusableStatus: "helper-backed",
    staleWordingRisk: "low",
    upgradePriority: "none",
    notes: "Service pages need reusable intent wording for takeaway, delivery, dine-in, and similar facets."
  },
  {
    id: "dietary-facet",
    category: "dynamic-seo",
    urlPattern: "/dietary/[dietary]",
    routeFile: "src/app/dietary/[dietary]/page.tsx",
    componentOrModel: "SeoLandingPage + getFacetSeoPage('dietary')",
    headingSource: "SeoLandingPage model from getFacetSeoPage",
    metadataSource: "getSeoPageMetadata(page)",
    reusableStatus: "helper-backed",
    staleWordingRisk: "low",
    upgradePriority: "none",
    notes: "Dietary pages need reusable heading patterns for vegan, vegetarian, halal, and similar needs."
  },
  {
    id: "offering-facet",
    category: "dynamic-seo",
    urlPattern: "/offerings/[offering]",
    routeFile: "src/app/offerings/[offering]/page.tsx",
    componentOrModel: "SeoLandingPage + getFacetSeoPage('offering')",
    headingSource: "SeoLandingPage model from getFacetSeoPage",
    metadataSource: "getSeoPageMetadata(page)",
    reusableStatus: "helper-backed",
    staleWordingRisk: "low",
    upgradePriority: "none",
    notes: "Offering pages share the facet model and should be covered by the same helper."
  },
  {
    id: "type-facet",
    category: "dynamic-seo",
    urlPattern: "/types/[type]",
    routeFile: "src/app/types/[type]/page.tsx",
    componentOrModel: "SeoLandingPage + getFacetSeoPage('type')",
    headingSource: "SeoLandingPage model from getFacetSeoPage",
    metadataSource: "getSeoPageMetadata(page)",
    reusableStatus: "helper-backed",
    staleWordingRisk: "low",
    upgradePriority: "none",
    notes: "Restaurant type pages should stay reusable for future restaurant directory niches."
  },
  {
    id: "guides-index",
    category: "article-guide",
    urlPattern: "/guides",
    routeFile: "src/app/guides/page.tsx",
    componentOrModel: "getPublicGuideArticles + article content files",
    headingSource: "src/app/guides/page.tsx inline guide headings",
    metadataSource: "src/app/guides/page.tsx generateMetadata + siteConfig",
    reusableStatus: "helper-backed",
    staleWordingRisk: "low",
    upgradePriority: "none",
    notes: "Public guide index for reviewed topical-authority articles; empty state is noindex until articles are published."
  },
  {
    id: "guide-article",
    category: "article-guide",
    urlPattern: "/guides/[slug]",
    routeFile: "src/app/guides/[slug]/page.tsx",
    componentOrModel: "getPublishedArticleBySlug + article content files",
    headingSource: "Article sections from content/articles",
    metadataSource: "getArticleRouteMetadata(article)",
    reusableStatus: "helper-backed",
    staleWordingRisk: "low",
    upgradePriority: "none",
    notes: "Article detail page only renders published guide content and emits Article/FAQ schema."
  },
  {
    id: "compare",
    category: "utility",
    urlPattern: "/compare",
    routeFile: "src/app/compare/page.tsx",
    componentOrModel: "CompareSavedListings",
    headingSource: "src/app/compare/page.tsx inline utility headings",
    metadataSource: "src/app/compare/page.tsx metadata",
    reusableStatus: "partially-config-driven",
    staleWordingRisk: "medium",
    upgradePriority: "low",
    notes: "Useful UX page, not a primary organic landing target."
  },
  {
    id: "about",
    category: "trust-support",
    urlPattern: "/about",
    routeFile: "src/app/about/page.tsx",
    componentOrModel: "TrustPage + getTrustPage",
    headingSource: "TrustPage from getTrustPage('about')",
    metadataSource: "trust page title/description",
    reusableStatus: "content-helper",
    staleWordingRisk: "medium",
    upgradePriority: "low",
    notes: "Trust page content should stay simple, config-aware, and reusable."
  },
  {
    id: "contact",
    category: "trust-support",
    urlPattern: "/contact",
    routeFile: "src/app/contact/page.tsx",
    componentOrModel: "TrustPage + getTrustPage",
    headingSource: "TrustPage from getTrustPage('contact')",
    metadataSource: "trust page title/description",
    reusableStatus: "content-helper",
    staleWordingRisk: "medium",
    upgradePriority: "low",
    notes: "Trust/support page, lower SEO priority than landing and detail pages."
  },
  {
    id: "privacy-policy",
    category: "trust-support",
    urlPattern: "/privacy-policy",
    routeFile: "src/app/privacy-policy/page.tsx",
    componentOrModel: "TrustPage + getTrustPage",
    headingSource: "TrustPage from getTrustPage('privacy')",
    metadataSource: "trust page title/description",
    reusableStatus: "content-helper",
    staleWordingRisk: "low",
    upgradePriority: "low",
    notes: "Policy page should avoid over-optimization."
  },
  {
    id: "terms",
    category: "trust-support",
    urlPattern: "/terms",
    routeFile: "src/app/terms/page.tsx",
    componentOrModel: "TrustPage + getTrustPage",
    headingSource: "TrustPage from getTrustPage('terms')",
    metadataSource: "trust page title/description",
    reusableStatus: "content-helper",
    staleWordingRisk: "low",
    upgradePriority: "low",
    notes: "Policy page should avoid over-optimization."
  },
  {
    id: "methodology",
    category: "trust-support",
    urlPattern: "/methodology",
    routeFile: "src/app/methodology/page.tsx",
    componentOrModel: "TrustPage + getTrustPage",
    headingSource: "TrustPage from getTrustPage('methodology')",
    metadataSource: "trust page title/description",
    reusableStatus: "content-helper",
    staleWordingRisk: "medium",
    upgradePriority: "low",
    notes: "Important trust page, but not the first reusable SEO heading target."
  },
  {
    id: "suggest-update",
    category: "trust-support",
    urlPattern: "/suggest-update",
    routeFile: "src/app/suggest-update/page.tsx",
    componentOrModel: "TrustPage + getTrustPage",
    headingSource: "TrustPage from getTrustPage('suggest-update')",
    metadataSource: "trust page title/description",
    reusableStatus: "content-helper",
    staleWordingRisk: "medium",
    upgradePriority: "low",
    notes: "Supports freshness and trust signals."
  },
  {
    id: "sitemap",
    category: "system-seo",
    urlPattern: "/sitemap.xml",
    routeFile: "src/app/sitemap.ts",
    componentOrModel: "Next MetadataRoute sitemap",
    headingSource: "No rendered headings",
    metadataSource: "src/app/sitemap.ts",
    reusableStatus: "system-generated",
    staleWordingRisk: "none",
    upgradePriority: "none",
    notes: "System SEO route, not a public content page."
  },
  {
    id: "robots",
    category: "system-seo",
    urlPattern: "/robots.txt",
    routeFile: "src/app/robots.ts",
    componentOrModel: "Next MetadataRoute robots",
    headingSource: "No rendered headings",
    metadataSource: "src/app/robots.ts",
    reusableStatus: "system-generated",
    staleWordingRisk: "none",
    upgradePriority: "none",
    notes: "System SEO route, not a public content page."
  },
  {
    id: "shortlist-api",
    category: "api",
    urlPattern: "/api/shortlist",
    routeFile: "src/app/api/shortlist/route.ts",
    componentOrModel: "Shortlist API route",
    headingSource: "No rendered headings",
    metadataSource: "No page metadata",
    reusableStatus: "not-seo-content",
    staleWordingRisk: "none",
    upgradePriority: "none",
    notes: "API route, excluded from public SEO heading work."
  }
] as const satisfies readonly TemplatePageInventoryItem[];

export function getTemplatePageInventory(): TemplatePageInventoryItem[] {
  return pageInventory.map((page) => ({ ...page }));
}

export function groupTemplatePagesByCategory(): Map<TemplatePageCategory, TemplatePageInventoryItem[]> {
  const grouped = new Map<TemplatePageCategory, TemplatePageInventoryItem[]>();

  getTemplatePageInventory().forEach((page) => {
    grouped.set(page.category, [...(grouped.get(page.category) ?? []), page]);
  });

  return grouped;
}

export function getPublicSeoUpgradeTargets(): TemplatePageInventoryItem[] {
  const priorityRank: Record<TemplateUpgradePriority, number> = {
    high: 0,
    medium: 1,
    low: 2,
    none: 3
  };
  const categoryRank: Record<TemplatePageCategory, number> = {
    "dynamic-seo": 0,
    "listing-detail": 1,
    "directory-index": 2,
    "article-guide": 3,
    "trust-support": 4,
    utility: 5,
    "homepage-search": 6,
    redirect: 7,
    "system-seo": 8,
    api: 9
  };

  return getTemplatePageInventory()
    .filter((page) => page.upgradePriority !== "none")
    .filter((page) => page.category !== "api" && page.category !== "system-seo" && page.category !== "redirect")
    .sort(
      (a, b) =>
        priorityRank[a.upgradePriority] - priorityRank[b.upgradePriority] ||
        categoryRank[a.category] - categoryRank[b.category]
    );
}

export function getTemplatePageSeoUpgradeSummary() {
  const targets = getPublicSeoUpgradeTargets();

  return {
    publicSeoUpgradeIds: targets.map((page) => page.id),
    highPriorityIds: targets.filter((page) => page.upgradePriority === "high").map((page) => page.id),
    mediumPriorityIds: targets.filter((page) => page.upgradePriority === "medium").map((page) => page.id),
    lowerPriorityIds: targets.filter((page) => page.upgradePriority === "low").map((page) => page.id)
  };
}

