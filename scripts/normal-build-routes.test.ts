import assert from "node:assert/strict";

delete process.env.NEXT_STATIC_EXPORT;

void run();

async function run() {
  const { generateStaticParams: listingStaticParams } = await import("../src/app/restaurants/[slug]/page");
  const { generateStaticParams: areaStaticParams } = await import("../src/app/areas/[area]/page");

  assert.equal(listingStaticParams().length, 0, "normal builds should not prerender every listing detail page");
  assert.equal(areaStaticParams().length, 0, "normal builds should not prerender every SEO area page");

  console.log("normal build route tests passed");
}
