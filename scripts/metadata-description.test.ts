import assert from "node:assert/strict";
import { generateMetadata as homepageMetadata } from "../src/app/page";
import { generateMetadata as restaurantIndexMetadata } from "../src/app/restaurants/page";
import { metadata as areasIndexMetadata } from "../src/app/areas/page";
import { metadata as categoriesIndexMetadata } from "../src/app/categories/page";
import { generateMetadata as guidesIndexMetadata } from "../src/app/guides/page";
import { generateMetadata as listingDetailMetadata } from "../src/app/restaurants/[slug]/page";
import { generateMetadata as areaMetadata } from "../src/app/areas/[area]/page";
import { generateMetadata as categoryMetadata } from "../src/app/categories/[category]/page";
import { generateMetadata as popularSearchMetadata } from "../src/app/best/[slug]/page";
import { generateMetadata as serviceMetadata } from "../src/app/services/[service]/page";
import { getAreaSeoPage, getFacetSeoPage, getPopularSearchSeoPage } from "../src/lib/seo-pages";

async function homepageAndIndexDescriptionsAreSpecific() {
  const homepage = await homepageMetadata();
  const restaurants = restaurantIndexMetadata();

  assert.equal(
    homepage.description,
    "Browse Indian restaurants in London by area, rating, cuisine, takeaway, delivery, halal options, vegetarian options, and dining style."
  );
  assert.equal(
    restaurants.description,
    "Search Indian restaurants in London by area, cuisine, rating, service options, dietary needs, transport links, and dining style."
  );
  assert.notEqual(restaurants.description, homepage.description, "/restaurants should not reuse the homepage description");
  assert.equal(
    areasIndexMetadata.description,
    "Browse Indian restaurants in London by area, then narrow by cuisine, rating, price, service options, and opening status."
  );
  assert.equal(
    categoriesIndexMetadata.description,
    "Browse Indian restaurant cuisines and styles in London, then compare matching restaurants by area, rating, price, and service options."
  );
}

async function guidesDescriptionDoesNotRepeatLondon() {
  const guides = guidesIndexMetadata();

  assert.equal(
    guides.description,
    "Indian food and restaurant guides for understanding dishes, cuisines, takeaway, dietary options, and local restaurant choices in London."
  );
  assert.ok(!(guides.description as string).includes("in London in London"), "/guides should not repeat London");
}

async function dynamicDescriptionsUseSnippetFocusedCopy() {
  const areaModel = getAreaSeoPage("barnet", {});
  const bestModel = getPopularSearchSeoPage("best-rated", {});
  const serviceModel = getFacetSeoPage("service", "takeaway", {});
  assert.ok(areaModel, "expected Barnet SEO page model");
  assert.ok(bestModel, "expected best-rated SEO page model");
  assert.ok(serviceModel, "expected takeaway SEO page model");

  const area = await areaMetadata({ params: Promise.resolve({ area: "barnet" }) });
  const category = await categoryMetadata({ params: Promise.resolve({ category: "afghan" }) });
  const best = await popularSearchMetadata({ params: Promise.resolve({ slug: "best-rated" }) });
  const service = await serviceMetadata({ params: Promise.resolve({ service: "takeaway" }) });

  assert.equal(
    area.description,
    "Compare 115 Indian restaurants in Barnet, London by rating, reviews, cuisine, takeaway, delivery, price data, and nearby transport."
  );
  assert.equal(
    category.description,
    "Compare 33 Afghan restaurants in London by rating, reviews, area, takeaway, delivery, and price data."
  );
  assert.equal(
    best.description,
    "Compare best rated Indian restaurants in London by rating, reviews, cuisine, area, takeaway, delivery, and price data."
  );
  assert.equal(
    service.description,
    "Compare Indian restaurants with Takeaway in London by rating, reviews, area, cuisine, delivery options, and price data."
  );
  assert.ok((area.description as string).length < areaModel.hero.description.length);
  assert.ok((best.description as string).length < bestModel.hero.description.length);
  assert.ok((service.description as string).length < serviceModel.hero.description.length);
}

async function restaurantDetailDescriptionStaysSpecific() {
  const metadata = await listingDetailMetadata({ params: Promise.resolve({ slug: "the-curry-club-london" }) });

  assert.equal(
    metadata.description,
    "The Curry Club London in Ilford, Redbridge is an Indian restaurant rated 5.0 from 254 reviews. Check menu, address, hours, delivery, takeaway, and nearby restaurants."
  );
  assert.ok((metadata.description as string).length <= 170, "restaurant detail description should stay snippet sized");
}

Promise.all([
  homepageAndIndexDescriptionsAreSpecific(),
  guidesDescriptionDoesNotRepeatLondon(),
  dynamicDescriptionsUseSnippetFocusedCopy(),
  restaurantDetailDescriptionStaysSpecific()
]).then(() => {
  console.log("metadata description tests passed");
});
