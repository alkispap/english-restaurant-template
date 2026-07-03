import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { default as AreaPage, generateMetadata as areaMetadata } from "../src/app/areas/[area]/page";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const areaRouteSource = fs.readFileSync(path.join(process.cwd(), "src", "app", "areas", "[area]", "page.tsx"), "utf8");

function areaRouteAcceptsSearchParams() {
  assert.match(areaRouteSource, /searchParams\?: Promise<SeoPageSearchParams>/, "area route props should accept filter query state");
  assert.match(
    areaRouteSource,
    /getAreaSeoPage\(area, \(await searchParams\) \?\? \{\}\)/,
    "area route should pass query filters into the area SEO model"
  );
  assert.doesNotMatch(areaRouteSource, /getAreaSeoPage\(area, \{\}\)/, "area route should not drop query filters");
}

async function areaMetadataNoindexesFilteredQueryState() {
  const metadata = await areaMetadata({
    params: Promise.resolve({ area: "barnet" }),
    searchParams: Promise.resolve({ open: "1", service: "takeaway" })
  });

  assert.deepEqual(metadata.alternates, { canonical: "/areas/barnet" });
  assert.deepEqual(metadata.robots, { index: false, follow: true });
}

async function areaPageUsesFilteredQueryState() {
  const element = await AreaPage({
    params: Promise.resolve({ area: "barnet" }),
    searchParams: Promise.resolve({ rating: "4" })
  });

  assert.equal(element.type, Symbol.for("react.fragment"));
}

areaRouteAcceptsSearchParams();
Promise.all([areaMetadataNoindexesFilteredQueryState(), areaPageUsesFilteredQueryState()]).then(() => {
  console.log("area route query state tests passed");
});
