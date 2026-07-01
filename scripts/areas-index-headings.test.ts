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

async function areasIndexUsesSeoFocusedHeadings() {
  const { default: AreasPage } = await import("../src/app/areas/page");
  const html = renderToStaticMarkup(React.createElement(AreasPage));
  const h1s = textFromTags(html, "h1");
  const h2s = textFromTags(html, "h2");
  const h3s = textFromTags(html, "h3");

  assert.deepEqual(h1s, ["Indian Restaurants in London by Area"], "areas index should have one local SEO H1");
  assert.deepEqual(
    h2s,
    ["Browse Indian Restaurants by London Area", "Popular Indian Restaurant Searches in London"],
    "areas index should use keyword-focused H2s"
  );

  ["Harrow", "Hounslow", "Redbridge"].forEach((area) => {
    assert.ok(!h3s.includes(area), `area card label "${area}" should not be promoted to an H3`);
  });
}

areasIndexUsesSeoFocusedHeadings().then(() => {
  console.log("areas index heading tests passed");
});
