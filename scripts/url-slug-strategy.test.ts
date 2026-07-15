import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { getAllArticles } from "../src/lib/articles";
import { listings } from "../src/data/listings";
import { listingSlugRedirects, resolveListingSlugRedirect } from "../src/data/listing-slug-redirects";
import { getAreas, getCategories, getNeighborhoods, slugify } from "../src/lib/directory";
import { areaPath, categoryPath, directorySearchPath, listingDetailPath, neighborhoodPath } from "../src/lib/routes";
import { buildDetailFilterHref } from "../src/lib/listing-detail-filter-links";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function assertCleanUniqueSlugs(label: string, slugs: string[]) {
  const duplicates = duplicateValues(slugs);
  const badSlugs = slugs.filter((slug) => !slugPattern.test(slug));

  assert.deepEqual(duplicates, [], `${label} should not contain duplicate slugs`);
  assert.deepEqual(badSlugs, [], `${label} should use clean lowercase hyphenated slugs`);
}

function currentContentSlugsAreCleanAndUnique() {
  assertCleanUniqueSlugs("restaurant slugs", listings.map((listing) => listing.slug));
  assertCleanUniqueSlugs("area slugs", getAreas().map(slugify));
  assertCleanUniqueSlugs("neighborhood slugs", getNeighborhoods().map(slugify));
  assertCleanUniqueSlugs("category slugs", getCategories().map(slugify));
  assertCleanUniqueSlugs("guide slugs", getAllArticles().map((article) => article.slug));
}

function routeHelpersKeepCanonicalDirectoryUrls() {
  assert.equal(directorySearchPath(), "/restaurants/");
  assert.equal(listingDetailPath("dishoom-camden"), "/restaurants/dishoom-camden");
  assert.equal(areaPath("camden"), "/areas/camden");
  assert.equal(neighborhoodPath("camden-town"), "/neighborhoods/camden-town");
  assert.equal(categoryPath("south-indian"), "/categories/south-indian");
}

function detailFilterLinksUseCanonicalRestaurantSearchPath() {
  assert.equal(buildDetailFilterHref("service", "Takeaway", "Redbridge"), "/services/takeaway");
  assert.equal(buildDetailFilterHref("offering", "Vegan options", "Redbridge"), "/offerings/vegan-options");
  assert.equal(
    buildDetailFilterHref("highlight", "Great dessert", "Redbridge"),
    "/restaurants/?area=redbridge&highlight=great-dessert"
  );
}

function restaurantUiDoesNotLinkToHomepageQueryUrls() {
  const files = [
    "src/app/restaurants/[slug]/page.tsx",
    "src/components/ListingCard.tsx",
    "src/lib/listing-detail-filter-links.ts"
  ];
  const offenders = files.filter((file) =>
    fs.readFileSync(path.join(process.cwd(), file), "utf8").includes("directoryIndexPath(`?")
  );

  assert.deepEqual(offenders, [], "restaurant UI links should use /restaurants query URLs, not homepage query URLs");
}

function migratedDuplicateRestaurantSlugsUseLocalSeoContext() {
  const slugs = new Set(listings.map((listing) => listing.slug));

  assert.ok(!slugs.has("hyderabad-darbar-2"), "old numeric duplicate slug should be removed from current listings");
  assert.ok(slugs.has("hyderabad-darbar-redbridge"), "duplicate restaurant should use local SEO slug");
  assert.equal(resolveListingSlugRedirect("hyderabad-darbar-2"), "hyderabad-darbar-redbridge");
  assert.equal(listingSlugRedirects["hyderabad-darbar-2"], "hyderabad-darbar-redbridge");
}

function duplicateValues(values: string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  values.forEach((value) => {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  });
  return Array.from(duplicates).sort();
}

currentContentSlugsAreCleanAndUnique();
routeHelpersKeepCanonicalDirectoryUrls();
detailFilterLinksUseCanonicalRestaurantSearchPath();
restaurantUiDoesNotLinkToHomepageQueryUrls();
migratedDuplicateRestaurantSlugsUseLocalSeoContext();

console.log("URL and slug strategy tests passed");
