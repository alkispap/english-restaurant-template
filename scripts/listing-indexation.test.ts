import assert from "node:assert/strict";
import sitemap from "../src/app/sitemap";
import { generateMetadata as listingMetadata } from "../src/app/listings/[slug]/page";
import { siteConfig } from "../src/config/site";
import { listings } from "../src/data/listings";
import { isListingIndexable } from "../src/lib/seo-policy";
import { listingDetailPath } from "../src/lib/routes";

const indexableListing = listings.find(isListingIndexable);
if (!indexableListing) {
  throw new Error("expected at least one indexable listing");
}
const activeListing = indexableListing;
const noindexListingCandidate = listings.find((listing) => !isListingIndexable(listing));
if (!noindexListingCandidate) {
  throw new Error("expected at least one non-indexable listing");
}
const noindexListing = noindexListingCandidate;

async function listingMetadataUsesQualityGate() {
  const metadata = await listingMetadata({ params: Promise.resolve({ slug: activeListing.slug }) });

  assert.equal(metadata.robots, undefined);
  assert.deepEqual(metadata.alternates, {
    canonical: `${siteConfig.url}${listingDetailPath(activeListing.slug)}`
  });
}

async function listingMetadataNoindexesWeakListings() {
  const metadata = await listingMetadata({ params: Promise.resolve({ slug: noindexListing.slug }) });

  assert.deepEqual(metadata.robots, { index: false, follow: true });
  assert.deepEqual(metadata.alternates, {
    canonical: `${siteConfig.url}${listingDetailPath(noindexListing.slug)}`
  });
}

function sitemapUsesListingQualityGate() {
  const sitemapListingUrls = sitemap()
    .map((entry) => entry.url)
    .filter((url) => url.includes(`/${siteConfig.listingBasePath}/`))
    .sort();
  const expectedListingUrls = listings
    .filter(isListingIndexable)
    .map((listing) => `${siteConfig.url}${listingDetailPath(listing.slug)}`)
    .sort();

  assert.deepEqual(sitemapListingUrls, expectedListingUrls);
}

listingMetadataUsesQualityGate().then(() => {
  listingMetadataNoindexesWeakListings().then(() => {
    sitemapUsesListingQualityGate();
    console.log("listing indexation tests passed");
  });
});
