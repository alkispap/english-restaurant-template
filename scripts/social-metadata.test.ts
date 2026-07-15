import assert from "node:assert/strict";
import { siteConfig } from "../src/config/site";
import { listings } from "../src/data/listings";
import { metadata as aboutMetadata } from "../src/app/about/page";
import { metadata as areasMetadata } from "../src/app/areas/page";
import { metadata as categoriesMetadata } from "../src/app/categories/page";
import { metadata as compareMetadata } from "../src/app/compare/page";
import { generateMetadata as homepageMetadata } from "../src/app/page";
import { generateMetadata as restaurantsMetadata } from "../src/app/restaurants/page";
import { generateMetadata as guidesMetadata } from "../src/app/guides/page";
import { getArticleRouteMetadata, getPublishedArticleBySlug } from "../src/lib/articles";
import { getAreaSeoPage, getFacetSeoPage, toSeoMetadata } from "../src/lib/seo-pages";
import { listingShareMetadata } from "../src/lib/share-metadata";

type MetadataLike = {
  title?: unknown;
  description?: unknown;
  alternates?: unknown;
  openGraph?: {
    title?: unknown;
    description?: unknown;
    url?: unknown;
    images?: unknown;
  } | null;
  twitter?: {
    card?: unknown;
    title?: unknown;
    description?: unknown;
    images?: unknown;
  } | null;
};

function imageUrls(images: unknown): string[] {
  if (!Array.isArray(images)) return [];
  return images
    .map((image) => {
      if (typeof image === "string") return image;
      if (image && typeof image === "object" && "url" in image) return String((image as { url: unknown }).url);
      return "";
    })
    .filter(Boolean);
}

function assertSocialMetadata(metadata: MetadataLike, canonical: string, image: string = siteConfig.heroImage) {
  assert.equal(metadata.openGraph?.title, metadata.title);
  assert.equal(metadata.openGraph?.description, metadata.description);
  assert.equal(metadata.openGraph?.url, canonical);
  assert.ok(imageUrls(metadata.openGraph?.images).includes(image), `${canonical} should expose OG image ${image}`);
  assert.equal(metadata.twitter?.card, "summary_large_image");
  assert.equal(metadata.twitter?.title, metadata.title);
  assert.equal(metadata.twitter?.description, metadata.description);
  assert.ok(imageUrls(metadata.twitter?.images).includes(image), `${canonical} should expose Twitter image ${image}`);
}

async function corePagesExposeSocialMetadata() {
  assertSocialMetadata(await homepageMetadata(), "/");
  assertSocialMetadata(restaurantsMetadata(), "/restaurants/");
  assertSocialMetadata(areasMetadata, "/areas");
  assertSocialMetadata(categoriesMetadata, "/categories");
  assertSocialMetadata(await guidesMetadata(), "/guides");
  assertSocialMetadata(aboutMetadata, "/about");
  assertSocialMetadata(compareMetadata, "/compare");
}

function generatedSeoPagesExposeSocialMetadata() {
  const areaPage = getAreaSeoPage("barnet", {});
  const servicePage = getFacetSeoPage("service", "takeaway", {});

  assert.ok(areaPage, "expected Barnet SEO page model");
  assert.ok(servicePage, "expected takeaway SEO page model");
  assertSocialMetadata(toSeoMetadata(areaPage), "/areas/barnet");
  assertSocialMetadata(toSeoMetadata(servicePage), "/services/takeaway");
}

function guideArticlesUseArticleHeroForSocialMetadata() {
  const article = getPublishedArticleBySlug("what-is-indian-food");
  assert.ok(article, "expected published guide article");

  const metadata = getArticleRouteMetadata(article);
  assertSocialMetadata(metadata, "/guides/what-is-indian-food", "/images/articles/what-is-indian-food/hero.webp");
}

function restaurantShareMetadataFallsBackToSiteImage() {
  const listing = listings.find((item) => item.images.length === 0) ?? listings[0];
  assert.ok(listing, "expected listing fixture");

  const metadata = listingShareMetadata({ ...listing, images: [] });

  assert.deepEqual(metadata.images, [siteConfig.heroImage]);
}

Promise.all([corePagesExposeSocialMetadata()]).then(() => {
  generatedSeoPagesExposeSocialMetadata();
  guideArticlesUseArticleHeroForSocialMetadata();
  restaurantShareMetadataFallsBackToSiteImage();
  console.log("social metadata tests passed");
});
