import assert from "node:assert/strict";
import { filterListings } from "../src/lib/directory";
import { getDirectoryLandingModel } from "../src/lib/directory-landing";

const model = getDirectoryLandingModel();

assert.equal(
  model.summary,
  "Browse Indian restaurants in London by area, rating, cuisine, takeaway, delivery, halal options, vegetarian options, and dining style."
);
assert.equal(model.hero.title, "Indian Restaurants in London");
assert.equal(model.hero.searchBasePath, "/restaurants/");

assert.deepEqual(
  model.primaryNeeds.items.map((item) => item.title),
  ["Halal", "Vegetarian", "Vegan", "Gluten-free"],
  "homepage should lead with four useful dietary options"
);
assert.deepEqual(
  model.primaryNeeds.items.map((item) => item.href),
  ["/dietary/halal", "/dietary/vegetarian", "/dietary/vegan", "/dietary/gluten-free"],
  "dietary cards should use existing dietary routes"
);
assert.deepEqual(
  model.primaryNeeds.items.map((item) => item.image),
  [
    "/images/homepage/dietary/halal.webp",
    "/images/homepage/dietary/vegetarian.webp",
    "/images/homepage/dietary/vegan.webp",
    "/images/homepage/dietary/gluten-free.webp"
  ],
  "dietary cards should use the coordinated local illustration set"
);
assert.ok(
  model.primaryNeeds.items.every(
    (item) => item.count === filterListings({ dietary: item.href.split("/").at(-1) }).length && item.imageAlt.length >= 40
  ),
  "dietary cards should expose data-driven counts and meaningful alt text"
);
assert.ok(!model.primaryNeeds.items.some((item) => item.title.includes("Verified")), "homepage should not claim dietary verification");

assert.deepEqual(
  model.diningHubs.items.map((item) => item.title),
  ["Southall", "Wembley", "Harrow", "Tooting", "Brick Lane"],
  "homepage should expose the planned dining hubs"
);
assert.deepEqual(
  model.diningHubs.items.map((item) => item.href),
  ["/neighborhoods/southall", "/neighborhoods/wembley", "/neighborhoods/harrow", "/neighborhoods/tooting", "/neighborhoods/brick-lane"],
  "dining hubs should use existing neighborhood routes"
);
assert.deepEqual(
  model.diningHubs.items.map((item) => item.image),
  [
    "/images/homepage/dining-hubs/southall.webp",
    "/images/homepage/dining-hubs/wembley.webp",
    "/images/homepage/dining-hubs/harrow.webp",
    "/images/homepage/dining-hubs/tooting.webp",
    "/images/homepage/dining-hubs/brick-lane.webp"
  ],
  "dining hubs should use fixed local representative images"
);
assert.ok(
  model.diningHubs.items.every(
    (item) =>
      item.count === filterListings({ neighborhood: item.href.split("/").at(-1) }).length &&
      item.imageAlt.length >= 30 &&
      item.imageCredit?.title &&
      item.imageCredit.author &&
      item.imageCredit.sourceUrl.startsWith("https://commons.wikimedia.org/") &&
      item.imageCredit.licenseLabel.startsWith("CC BY") &&
      item.imageCredit.licenseUrl.startsWith("https://creativecommons.org/")
  ),
  "dining hubs should expose data-driven counts, meaningful alt text, and photo credit metadata"
);

assert.deepEqual(
  model.serviceNeeds.items.map((item) => item.title),
  ["Takeaway", "Delivery", "Outdoor seating"],
  "homepage should keep service needs in a separate later section"
);
assert.deepEqual(
  model.serviceNeeds.items.map((item) => item.href),
  ["/services/takeaway", "/services/delivery", "/services/outdoor-seating"],
  "service cards should use existing service routes"
);

assert.deepEqual(
  model.regionLinks.items.map((item) => item.title),
  ["Central London", "North London", "South London", "East London", "West London"],
  "homepage should retain all broad London regions as compact links"
);
const centralLink = model.regionLinks.items.find((item) => item.title === "Central London");
assert.ok(centralLink, "central London link should be present");
const centralAreaParams = new URLSearchParams(centralLink.href.replace(/^\/restaurants\/\?/, "")).getAll("area");
assert.ok(centralAreaParams.length >= 2, "region links should use repeated area params for grouped boroughs");
assert.ok(centralAreaParams.includes("westminster"), "central London should include existing central boroughs");
assert.equal(centralLink.count, filterListings({ area: centralAreaParams }).length, "region counts should match their filters");

assert.deepEqual(
  model.restaurantRows.map((row) => row.id),
  ["best-rated"],
  "minimal homepage should expose one compact restaurant row"
);
assert.ok(model.restaurantRows.every((row) => row.items.length > 0 && row.seeAllHref.startsWith("/restaurants")));

assert.equal(model.finalCta.href, "/restaurants/");

console.log("directory landing model tests passed");
