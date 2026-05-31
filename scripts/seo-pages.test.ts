import assert from "node:assert/strict";
import sitemap from "../src/app/sitemap";
import { siteConfig } from "../src/config/site";
import { getAreas, getCategories, getServiceOptions, slugify } from "../src/lib/directory";
import { getAreaCategoryCombinations } from "../src/lib/directory-growth";
import { seoLandingHeadings } from "../src/lib/seo-landing-headings";
import {
  getAreaSeoPage,
  getAreaCategorySeoPage,
  getCategorySeoPage,
  getFacetSeoPage,
  getPopularSearchSeoPage
} from "../src/lib/seo-pages";

function pageCopyDoesNotExposeImplementation() {
  const area = getAreas()[0];
  assert.ok(area, "expected imported area data");

  const page = getAreaSeoPage(slugify(area), {});

  assert.ok(page, "expected area SEO page model");
  assert.equal(page.metadata.canonical, `/areas/${slugify(area)}`);
  assert.ok(page.hero.description.includes(area), "area intro should mention the area");
  assert.ok(includesCount(page.hero.description, page.totalCount), "area intro should include result count");
  assert.ok(
    /\d[\d,]* (have Google reviews|show price data|offer takeaway|offer delivery)|close to .+ Station/i.test(
      page.hero.description
    ),
    "area intro should include a concrete data point beyond total count"
  );
  assert.ok(
    !/Compare ratings, prices|Use this page|individual restaurant profiles/i.test(page.hero.description),
    "area intro should not use generic instructional copy"
  );
  assert.ok(
    !/programmatic|generated|imported listing dataset|current directory data|use this page|individual restaurant profiles/i.test(
      [page.hero.description, page.guide.body, ...page.faqs.flatMap((faq) => [faq.question, faq.answer])].join(" ")
    ),
    "public SEO copy should not expose implementation wording"
  );
}

function categoryCopyUsesDataLedIntro() {
  const category = getCategories().find((item) => slugify(item) === "indian") ?? getCategories()[0];
  assert.ok(category, "expected category data");

  const page = getCategorySeoPage(slugify(category), {});
  assert.ok(page, "expected category SEO page model");

  assert.ok(page.hero.description.includes(category), "category intro should mention the category");
  assert.ok(includesCount(page.hero.description, page.totalCount), "category intro should include result count");
  assert.ok(
    !/Compare ratings, reviews, areas|Compare ratings, prices/i.test(page.hero.description),
    "category intro should not use the old generic compare copy"
  );
  assert.ok(
    !/\bindian restaurant listings\b/.test(page.hero.description),
    "category intro should preserve cuisine capitalization"
  );
}

function areaCategoryCopyUsesDataLedIntro() {
  const combination = getAreaCategoryCombinations().find((item) => item.count >= 5);
  assert.ok(combination, "expected an indexable area/category combination");

  const page = getAreaCategorySeoPage(combination.areaSlug, combination.categorySlug, {});
  assert.ok(page, "expected area/category SEO page model");

  assert.ok(page.hero.description.includes(combination.areaLabel), "area/category intro should mention the area");
  assert.ok(page.hero.description.includes(combination.categoryLabel), "area/category intro should mention the category");
  assert.ok(includesCount(page.hero.description, page.totalCount), "area/category intro should include result count");
  assert.ok(
    !/Compare ratings, prices|opening details, and service options/i.test(page.hero.description),
    "area/category intro should not use the old generic compare copy"
  );
  assert.ok(
    !/\bindian restaurant listings\b/.test(page.hero.description),
    "area/category intro should preserve cuisine capitalization"
  );
}

function popularSearchCopyUsesCorrectAgreement() {
  const page = getPopularSearchSeoPage("best-rated", {});
  assert.ok(page, "expected best-rated SEO page model");

  assert.ok(
    !/restaurants in London includes/i.test(page.hero.description),
    "popular search intro should use plural agreement"
  );
}

function thinCombinationsAreNoindexedAndExcludedFromSitemap() {
  const thin = getAreaCategoryCombinations().find((combination) => combination.count < 5);
  assert.ok(thin, "expected at least one thin area/category combination in sample data");

  const page = getAreaCategorySeoPage(thin.areaSlug, thin.categorySlug, {});
  assert.ok(page, "expected area/category SEO page model");
  assert.equal(page.isIndexable, false);
  const robots = page.metadata.robots;
  assert.equal(robots && typeof robots === "object" ? robots.index : undefined, false);

  const urls = sitemap().map((entry) => entry.url);
  assert.ok(!urls.includes(`${siteConfig.url}${thin.href}`), "thin area/category pages should stay out of sitemap");
}

function highValuePagesStayIndexable() {
  const category = getCategories().find((item) => slugify(item) === "indian") ?? getCategories()[0];
  const service = getServiceOptions().find((item) => slugify(item) === "takeaway");
  assert.ok(category, "expected category data");
  assert.ok(service, "expected takeaway service data");

  const categoryPage = getCategorySeoPage(slugify(category), {});
  const bestPage = getPopularSearchSeoPage("best-rated", {});
  const facetPage = getFacetSeoPage("service", slugify(service), {});

  assert.ok(categoryPage?.isIndexable, "category pages with enough results should be indexable");
  assert.ok(bestPage?.isIndexable, "best pages with enough results should be indexable");
  assert.ok(facetPage?.isIndexable, "high-intent service pages with enough results should be indexable");
  assert.equal(facetPage?.metadata.canonical, `/services/${slugify(service)}`);
}

function seoPagesExposeReusableContentBlocks() {
  const page = getPopularSearchSeoPage("best-rated", {});
  assert.ok(page, "expected best-rated SEO page model");

  assert.ok(page.summaryStats.length >= 3, "SEO pages should expose dataset summary chips");
  assert.ok(page.relatedLinkGroups.length >= 2, "SEO pages should expose internal link groups");
  assert.ok(page.faqs.length >= 3, "SEO pages should expose visible FAQs");
  assert.ok(page.structuredData.length >= 2, "SEO pages should expose breadcrumb and ItemList structured data");
}

function seoPagesUseReusableLandingHeadings() {
  const area = getAreas()[0];
  const category = getCategories().find((item) => slugify(item) === "indian") ?? getCategories()[0];
  const combination = getAreaCategoryCombinations().find((item) => item.count >= 5);
  const service = getServiceOptions().find((item) => slugify(item) === "takeaway");
  assert.ok(area, "expected area data");
  assert.ok(category, "expected category data");
  assert.ok(combination, "expected area/category combination data");
  assert.ok(service, "expected service data");

  const areaHeadings = seoLandingHeadings.area(area);
  const areaPage = getAreaSeoPage(slugify(area), {});
  assert.equal(areaPage?.hero.eyebrow, areaHeadings.eyebrow);
  assert.equal(areaPage?.hero.title, areaHeadings.heroTitle);
  assert.equal(areaPage?.guide.title, areaHeadings.guideTitle);
  assert.deepEqual(areaPage?.faqs.map((faq) => faq.question), [
    areaHeadings.faq.chooseQuestion,
    areaHeadings.faq.filterQuestion,
    areaHeadings.faq.exploreQuestion
  ]);

  const categoryHeadings = seoLandingHeadings.category(category);
  const categoryPage = getCategorySeoPage(slugify(category), {});
  assert.equal(categoryPage?.hero.title, categoryHeadings.heroTitle);
  assert.equal(categoryPage?.guide.title, categoryHeadings.guideTitle);
  assert.ok(categoryPage?.relatedLinkGroups.some((group) => group.title === categoryHeadings.related.areaCategoryLinksTitle));
  assert.ok(categoryPage?.relatedLinkGroups.some((group) => group.title === categoryHeadings.related.categoryLinksTitle));

  const areaCategoryHeadings = seoLandingHeadings.areaCategory(combination.areaLabel, combination.categoryLabel);
  const areaCategoryPage = getAreaCategorySeoPage(combination.areaSlug, combination.categorySlug, {});
  assert.equal(areaCategoryPage?.hero.eyebrow, areaCategoryHeadings.eyebrow);
  assert.equal(areaCategoryPage?.hero.title, areaCategoryHeadings.heroTitle);
  assert.ok(
    areaCategoryPage?.relatedLinkGroups.some((group) => group.title === areaCategoryHeadings.related.usefulSearchesTitle)
  );

  const bestHeadings = seoLandingHeadings.best("Best-rated Indian restaurants in London");
  const bestPage = getPopularSearchSeoPage("best-rated", {});
  assert.equal(bestPage?.hero.eyebrow, bestHeadings.eyebrow);
  assert.equal(bestPage?.guide.title, bestHeadings.guideTitle);
  assert.ok(bestPage?.relatedLinkGroups.some((group) => group.title === bestHeadings.related.areaLinksTitle));

  const facetHeadings = seoLandingHeadings.facet(service);
  const facetPage = getFacetSeoPage("service", slugify(service), {});
  assert.equal(facetPage?.hero.eyebrow, facetHeadings.eyebrow);
  assert.equal(facetPage?.hero.title, facetHeadings.heroTitle);
  assert.equal(facetPage?.guide.title, facetHeadings.guideTitle);

  const controlledRelatedTitles = [
    ...(areaPage?.relatedLinkGroups ?? []),
    ...(categoryPage?.relatedLinkGroups ?? []),
    ...(areaCategoryPage?.relatedLinkGroups ?? []),
    ...(bestPage?.relatedLinkGroups ?? []),
    ...(facetPage?.relatedLinkGroups ?? [])
  ].map((group) => group.title);
  ["Related areas", "Useful searches", "Browse by area", "Useful combinations"].forEach((genericTitle) => {
    assert.ok(!controlledRelatedTitles.includes(genericTitle), `SEO page related headings should not include "${genericTitle}"`);
  });
}

function includesCount(copy: string, count: number) {
  return copy.includes(String(count)) || copy.includes(count.toLocaleString());
}

pageCopyDoesNotExposeImplementation();
categoryCopyUsesDataLedIntro();
areaCategoryCopyUsesDataLedIntro();
popularSearchCopyUsesCorrectAgreement();
thinCombinationsAreNoindexedAndExcludedFromSitemap();
highValuePagesStayIndexable();
seoPagesExposeReusableContentBlocks();
seoPagesUseReusableLandingHeadings();

console.log("SEO page behavior tests passed");
