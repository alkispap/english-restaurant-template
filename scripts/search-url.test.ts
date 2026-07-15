import assert from "node:assert/strict";
import { buildSearchHref } from "../src/lib/search-url";

assert.equal(buildSearchHref({ q: "Dishoom", area: "" }), "/restaurants/?q=Dishoom");
assert.equal(buildSearchHref({ q: "", area: "camden" }), "/restaurants/?area=camden");
assert.equal(buildSearchHref({ q: "  ", area: "" }), "/restaurants/");
assert.equal(buildSearchHref({ q: "vegan curry", area: "westminster" }), "/restaurants/?q=vegan+curry&area=westminster");
assert.equal(buildSearchHref({ q: "Dishoom", area: "" }, "/"), "/?q=Dishoom");
assert.equal(buildSearchHref({ q: "", area: "" }, "/"), "/");

console.log("search url tests passed");
