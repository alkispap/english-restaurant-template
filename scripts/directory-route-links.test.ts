import assert from "node:assert/strict";
import { directoryRouteLink, hasGeneratedDirectoryRoute } from "../src/lib/directory-route-links";

assert.equal(directoryRouteLink("category", "Indian"), "/categories/indian");
assert.equal(directoryRouteLink("category", "Mexican"), "/restaurants/?category=mexican");

assert.equal(directoryRouteLink("service", "Takeaway", { area: "Redbridge" }), "/services/takeaway");
assert.equal(
  directoryRouteLink("service", "Caterer", { area: "Redbridge" }),
  "/restaurants/?area=redbridge&service=caterer"
);

assert.equal(directoryRouteLink("offering", "Vegan options"), "/offerings/vegan-options");
assert.equal(directoryRouteLink("offering", "Alcohol"), "/restaurants/?offering=alcohol");
assert.equal(directoryRouteLink("dietary", "Kosher"), "/restaurants/?dietary=kosher");
assert.equal(directoryRouteLink("type", "Shisha bar"), "/restaurants/?type=shisha-bar");

assert.equal(hasGeneratedDirectoryRoute("service", "takeaway"), true);
assert.equal(hasGeneratedDirectoryRoute("service", "caterer"), false);

console.log("Directory route link tests passed");
