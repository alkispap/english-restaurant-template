import assert from "node:assert/strict";
import sitemap from "../src/app/sitemap";
import { siteConfig } from "../src/config/site";
import { listings } from "../src/data/listings";
import { metadata as compareMetadata } from "../src/app/compare/page";
import { metadata as areasIndexMetadata } from "../src/app/areas/page";
import { metadata as categoriesIndexMetadata } from "../src/app/categories/page";
import { metadata as aboutMetadata } from "../src/app/about/page";
import { generateMetadata as homepageMetadata } from "../src/app/page";
import { generateMetadata as restaurantIndexMetadata } from "../src/app/restaurants/page";
import { generateMetadata as listingDetailMetadata } from "../src/app/restaurants/[slug]/page";
import { generateMetadata as areaMetadata } from "../src/app/areas/[area]/page";
import { generateMetadata as guidesIndexMetadata } from "../src/app/guides/page";
import { getArticleRouteMetadata, getDraftPreviewRouteMetadata, getPreviewArticleBySlug, getPublishedArticleBySlug } from "../src/lib/articles";
import { getAreaSeoPage } from "../src/lib/seo-pages";
import { isListingIndexable } from "../src/lib/seo-policy";
import { listingDetailPath } from "../src/lib/routes";

async function corePagesDeclareCanonicalUrls() {
  const homepage = await homepageMetadata();
  const restaurants = restaurantIndexMetadata();
  const guides = guidesIndexMetadata();

  assert.deepEqual(homepage.alternates, { canonical: "/" });
  assert.deepEqual(restaurants.alternates, { canonical: "/restaurants" });
  assert.deepEqual(areasIndexMetadata.alternates, { canonical: "/areas" });
  assert.deepEqual(categoriesIndexMetadata.alternates, { canonical: "/categories" });
  assert.deepEqual(guides.alternates, { canonical: "/guides" });
  assert.deepEqual(aboutMetadata.alternates, { canonical: "/about" });
}

async function restaurantPagesUseAbsoluteCanonicalUrls() {
  const listing = listings.find(isListingIndexable) ?? listings[0];
  assert.ok(listing, "expected at least one listing fixture");

  const metadata = await listingDetailMetadata({ params: Promise.resolve({ slug: listing.slug }) });

  assert.deepEqual(metadata.alternates, {
    canonical: `${siteConfig.url}${listingDetailPath(listing.slug)}`
  });
}

async function generatedSeoPagesNoindexQueryStates() {
  const cleanArea = await areaMetadata({ params: Promise.resolve({ area: "barnet" }) });
  const queriedArea = getAreaSeoPage("barnet", { open: "1", service: "takeaway" });

  assert.deepEqual(cleanArea.alternates, { canonical: "/areas/barnet" });
  assert.ok(queriedArea, "expected queried area SEO page model");
  assert.equal(queriedArea.metadata.canonical, "/areas/barnet");
  assert.deepEqual(queriedArea.metadata.robots, { index: false, follow: true });
}

function guidePagesSeparatePublishedAndPreviewIndexation() {
  const published = getPublishedArticleBySlug("what-is-indian-food");
  const draft = getPreviewArticleBySlug("how-to-choose-indian-restaurant-london");

  assert.ok(published, "expected published guide article fixture");
  assert.ok(draft, "expected draft guide article fixture");

  assert.deepEqual(getArticleRouteMetadata(published).alternates, {
    canonical: "/guides/what-is-indian-food"
  });
  assert.deepEqual(getDraftPreviewRouteMetadata(draft).alternates, {
    canonical: "/guides/preview/how-to-choose-indian-restaurant-london"
  });
  assert.deepEqual(getDraftPreviewRouteMetadata(draft).robots, { index: false, follow: false });
}

function comparePageIsAUtilityNoindexPage() {
  assert.deepEqual(compareMetadata.alternates, { canonical: "/compare" });
  assert.deepEqual(compareMetadata.robots, { index: false, follow: true });
}

function sitemapOnlyIncludesCanonicalIndexableUrls() {
  const urls = sitemap().map((entry) => entry.url);

  assert.ok(urls.includes(siteConfig.url), "homepage should be in sitemap");
  assert.ok(urls.includes(`${siteConfig.url}/restaurants`), "/restaurants should be in sitemap");
  assert.ok(!urls.includes(`${siteConfig.url}/listings`), "legacy /listings should not be in sitemap");
  assert.ok(!urls.includes(`${siteConfig.url}/compare`), "/compare utility page should not be in sitemap");
  assert.ok(!urls.some((url) => url.includes("?")), "query URLs should not be in sitemap");
}

Promise.all([
  corePagesDeclareCanonicalUrls(),
  restaurantPagesUseAbsoluteCanonicalUrls(),
  generatedSeoPagesNoindexQueryStates()
]).then(() => {
  guidePagesSeparatePublishedAndPreviewIndexation();
  comparePageIsAUtilityNoindexPage();
  sitemapOnlyIncludesCanonicalIndexableUrls();
  console.log("canonical governance tests passed");
});
