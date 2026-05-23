import assert from "node:assert/strict";
import { buildSearchHref } from "../src/lib/search-url";

assert.equal(buildSearchHref({ q: "Dishoom", area: "" }), "/?q=Dishoom");
assert.equal(buildSearchHref({ q: "", area: "camden" }), "/?area=camden");
assert.equal(buildSearchHref({ q: "  ", area: "" }), "/");
assert.equal(buildSearchHref({ q: "vegan curry", area: "westminster" }), "/?q=vegan+curry&area=westminster");
assert.equal(buildSearchHref({ q: "Dishoom", area: "" }, "/"), "/?q=Dishoom");
assert.equal(buildSearchHref({ q: "", area: "" }, "/"), "/");

console.log("search url tests passed");
