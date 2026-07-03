import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { default as AreaPage, generateMetadata as areaMetadata } from "../src/app/areas/[area]/page";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const areaRouteSource = fs.readFileSync(path.join(process.cwd(), "src", "app", "areas", "[area]", "page.tsx"), "utf8");

function areaRouteStaysStaticExportable() {
  assert.doesNotMatch(
    areaRouteSource,
    /searchParams/,
    "static area routes should not read searchParams during server render"
  );
  assert.match(
    areaRouteSource,
    /getAreaSeoPage\(area, \{\}\)/,
    "area route should render the static area SEO model"
  );
}

async function areaMetadataUsesStaticCanonical() {
  const metadata = await areaMetadata({
    params: Promise.resolve({ area: "barnet" })
  });

  assert.deepEqual(metadata.alternates, { canonical: "/areas/barnet" });
  assert.equal(metadata.robots, undefined);
}

async function areaPageRendersStaticModel() {
  const element = await AreaPage({
    params: Promise.resolve({ area: "barnet" })
  });

  assert.equal(element.type, Symbol.for("react.fragment"));
}

areaRouteStaysStaticExportable();
Promise.all([areaMetadataUsesStaticCanonical(), areaPageRendersStaticModel()]).then(() => {
  console.log("area route static export tests passed");
});
