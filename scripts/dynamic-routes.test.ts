import assert from "node:assert/strict";
import { dynamic as categoryDynamic } from "../src/app/categories/[category]/page";
import { dynamic as areaCategoryDynamic } from "../src/app/areas/[area]/categories/[category]/page";
import { dynamic as popularSearchDynamic } from "../src/app/best/[slug]/page";

assert.equal(categoryDynamic, "force-dynamic");
assert.equal(areaCategoryDynamic, "force-dynamic");
assert.equal(popularSearchDynamic, "force-dynamic");

console.log("dynamic route config tests passed");
