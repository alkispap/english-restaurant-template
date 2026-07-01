import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

function textFromTags(html: string, tag: "h1" | "h2" | "h3") {
  return Array.from(html.matchAll(new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, "gis"))).map((match) =>
    decodeHtml(match[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim())
  );
}

function decodeHtml(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&#x27;", "'")
    .replaceAll("&quot;", '"');
}

async function categoriesIndexUsesSeoFocusedHeadings() {
  const { default: CategoriesPage } = await import("../src/app/categories/page");
  const html = renderToStaticMarkup(React.createElement(CategoriesPage));
  const h1s = textFromTags(html, "h1");
  const h2s = textFromTags(html, "h2");
  const h3s = textFromTags(html, "h3");

  assert.deepEqual(h1s, ["Indian Restaurants in London by Cuisine"], "categories index should have one local SEO H1");
  assert.deepEqual(
    h2s,
    ["Browse Indian Restaurants by Cuisine", "Popular Indian Restaurant Searches in London"],
    "categories index should use keyword-focused H2s"
  );

  ["Indian", "Vegetarian", "Fast food"].forEach((category) => {
    assert.ok(!h3s.includes(category), `category card label "${category}" should not be promoted to an H3`);
  });
}

categoriesIndexUsesSeoFocusedHeadings().then(() => {
  console.log("categories index heading tests passed");
});
