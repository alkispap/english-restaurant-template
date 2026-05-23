import assert from "node:assert/strict";
import {
  LISTINGS_PAGE_SIZE,
  buildListingsPageHref,
  mapPointFromListing,
  mapPointsFromListings,
  paginateListings,
  type ListingsPageLinkValues
} from "../src/lib/listings-page";
import type { Listing } from "../src/data/listings";

const listings = Array.from({ length: 30 }, (_, index) => ({
  name: `Restaurant ${index + 1}`,
  slug: `restaurant-${index + 1}`,
  images: [],
  categories: ["Indian"],
  listingTypes: [],
  dietaryOptions: [],
  tags: []
})) as Listing[];

function paginationReturnsOnePageAndTotalCount() {
  const page = paginateListings(listings, 2);

  assert.equal(page.totalCount, 30);
  assert.equal(page.totalPages, 3);
  assert.equal(page.currentPage, 2);
  assert.equal(page.pageSize, LISTINGS_PAGE_SIZE);
  assert.equal(page.items.length, LISTINGS_PAGE_SIZE);
  assert.equal(page.items[0].slug, "restaurant-13");
  assert.equal(page.items.at(-1)?.slug, "restaurant-24");
}

function paginationUrlsPreserveActiveFilters() {
  const values: ListingsPageLinkValues = {
    q: "curry",
    category: "indian",
    service: "delivery",
    parking: "paid-street-parking",
    rating: "4.5",
    open: true,
    view: "grid"
  };

  const href = buildListingsPageHref(values, { page: 3 });

  assert.equal(
    href,
    "/?q=curry&category=indian&service=delivery&parking=paid-street-parking&rating=4.5&open=1&page=3"
  );
}

function openToggleUrlRemovesPageAndTogglesOpen() {
  const values: ListingsPageLinkValues = {
    category: "indian",
    page: 4,
    open: false
  };

  assert.equal(buildListingsPageHref(values, { open: true, page: 1 }), "/?category=indian&open=1");
  assert.equal(buildListingsPageHref({ ...values, open: true }, { open: false, page: 1 }), "/?category=indian");
}

function paginationUrlsUseDirectoryIndexByDefault() {
  assert.equal(buildListingsPageHref({}, {}), "/");
  assert.equal(buildListingsPageHref({ q: "dosa" }, {}), "/?q=dosa");
}

function paginationUrlsCanUseCustomBasePath() {
  const values: ListingsPageLinkValues = {
    basePath: "/best/best-rated",
    q: "curry",
    page: 1
  };

  assert.equal(buildListingsPageHref(values, { page: 2 }), "/best/best-rated?q=curry&page=2");
  assert.equal(buildListingsPageHref(values, { q: undefined, page: 1 }), "/best/best-rated");
}

function paginationUrlsCanUseHomepageBasePath() {
  const values: ListingsPageLinkValues = {
    basePath: "/",
    q: "curry",
    service: "delivery",
    open: true,
    page: 1
  };

  assert.equal(buildListingsPageHref(values, { page: 2 }), "/?q=curry&service=delivery&open=1&page=2");
  assert.equal(buildListingsPageHref(values, { q: undefined, service: undefined, open: false, page: 1 }), "/");
}

function mapPayloadIsLightweight() {
  const point = mapPointFromListing({
    name: "Sample Restaurant",
    slug: "sample-restaurant",
    description: "Long copy that should not be sent to the map",
    images: ["https://example.com/photo.jpg"],
    categories: ["Indian", "Punjabi", "Asian"],
    listingTypes: ["Casual Dining"],
    dietaryOptions: ["Vegan"],
    tags: ["Delivery"],
    area: "Ilford",
    rating: 4.7,
    reviewCount: 123,
    contact: {
      phone: "123",
      email: "hello@example.com"
    },
    details: {
      workingHoursText: "Monday: 9-5"
    },
    location: {
      latitude: 51.5,
      longitude: -0.1
    }
  });

  assert.deepEqual(point, {
    slug: "sample-restaurant",
    name: "Sample Restaurant",
    area: "Ilford",
    categories: ["Indian", "Punjabi"],
    rating: 4.7,
    reviewCount: 123,
    latitude: 51.5,
    longitude: -0.1
  });
  assert.ok(!("description" in point));
  assert.ok(!("images" in point));
  assert.ok(!("contact" in point));
}

function mapPointsExcludeObviousCoordinateOutliers() {
  const localListings = [
    listingWithLocation("ilford", 51.56, 0.07),
    listingWithLocation("shoreditch", 51.52, -0.08),
    listingWithLocation("covent-garden", 51.51, -0.12),
    listingWithLocation("soho", 51.51, -0.13),
    listingWithLocation("bad-import", 47.73855, 12.5088275)
  ];

  const points = mapPointsFromListings(localListings);
  const slugs = points.map((point) => point.slug);

  assert.ok(slugs.includes("ilford"));
  assert.ok(slugs.includes("shoreditch"));
  assert.ok(!slugs.includes("bad-import"), "far imported coordinate should not control map bounds");
}

function mapPointsKeepSmallDatasetsIntact() {
  const points = mapPointsFromListings([
    listingWithLocation("local", 51.56, 0.07),
    listingWithLocation("far-but-only-other-point", 47.73855, 12.5088275)
  ]);

  assert.deepEqual(points.map((point) => point.slug), ["local", "far-but-only-other-point"]);
}

function listingWithLocation(slug: string, latitude: number, longitude: number): Listing {
  return {
    name: slug,
    slug,
    images: [],
    categories: ["Indian"],
    listingTypes: [],
    dietaryOptions: [],
    tags: [],
    location: {
      latitude,
      longitude
    }
  };
}

paginationReturnsOnePageAndTotalCount();
paginationUrlsPreserveActiveFilters();
openToggleUrlRemovesPageAndTogglesOpen();
paginationUrlsUseDirectoryIndexByDefault();
paginationUrlsCanUseCustomBasePath();
paginationUrlsCanUseHomepageBasePath();
mapPayloadIsLightweight();
mapPointsExcludeObviousCoordinateOutliers();
mapPointsKeepSmallDatasetsIntact();

console.log("listings-page behavior tests passed");
