import assert from "node:assert/strict";
import { siteConfig } from "../src/config/site";
import { generateMetadata as categoryMetadata } from "../src/app/categories/[category]/page";
import { generateMetadata as areaCategoryMetadata } from "../src/app/areas/[area]/categories/[category]/page";
import { generateMetadata as popularSearchMetadata } from "../src/app/best/[slug]/page";

async function pageMetadataDoesNotRepeatRootTitleTemplate() {
  const metadata = await Promise.all([
    categoryMetadata({ params: Promise.resolve({ category: "indian" }), searchParams: Promise.resolve({}) }),
    areaCategoryMetadata({
      params: Promise.resolve({ area: "redbridge", category: "indian" }),
      searchParams: Promise.resolve({})
    }),
    popularSearchMetadata({ params: Promise.resolve({ slug: "best-rated" }), searchParams: Promise.resolve({}) })
  ]);

  metadata.forEach((entry) => {
    assert.equal(typeof entry.title, "string");
    assert.ok(
      !(entry.title as string).includes(`| ${siteConfig.siteName}`),
      "page metadata title should let the root title template append the site name"
    );
  });
}

pageMetadataDoesNotRepeatRootTitleTemplate().then(() => {
  console.log("metadata title tests passed");
});
