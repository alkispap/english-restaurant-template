import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ActiveFilterCountBadge } from "../src/components/FilterPanel";

const globalsCss = fs.readFileSync(path.join(process.cwd(), "src", "app", "globals.css"), "utf8");
const filterPanelSource = fs.readFileSync(path.join(process.cwd(), "src", "components", "FilterPanel.tsx"), "utf8");
const responsiveFiltersSource = fs.readFileSync(
  path.join(process.cwd(), "src", "components", "ResponsiveDirectoryFilters.tsx"),
  "utf8"
);
(globalThis as typeof globalThis & { React: typeof React }).React = React;

const markup = renderToStaticMarkup(React.createElement(ActiveFilterCountBadge, { count: 1 }));

assert.match(markup, />1 active<\//, "the rendered active-filter badge should expose its count");
assert.match(markup, /\btext-muted-strong\b/, "the rendered active-filter badge should use the accessible text token");
assert.match(markup, /\bbg-slate-100\b/, "the rendered active-filter badge should retain its existing background");
assert.match(
  filterPanelSource,
  /<ActiveFilterCountBadge count=\{filters\.length\} \/>/,
  "the desktop selected-filter summary should use the accessible badge"
);
assert.match(
  responsiveFiltersSource,
  /<ActiveFilterCountBadge count=\{selectedFilters\.length\} \/>/,
  "the mobile filter trigger should use the accessible badge"
);

const foreground = colorToken("muted-strong");
const background = "#f1f5f9";
const ratio = contrastRatio(foreground, background);

assert.ok(ratio >= 4.5, `active-filter badge contrast should be at least 4.5:1; got ${ratio.toFixed(2)}:1`);

console.log(`filter badge accessibility test passed (${ratio.toFixed(2)}:1)`);

function colorToken(name: string) {
  const match = globalsCss.match(new RegExp(`--color-${name}:\\s*(#[0-9a-f]{6})`, "i"));
  assert.ok(match, `globals.css should define a hexadecimal ${name} colour token`);
  return match[1];
}

function contrastRatio(foreground: string, background: string) {
  const light = Math.max(luminance(foreground), luminance(background));
  const dark = Math.min(luminance(foreground), luminance(background));
  return (light + 0.05) / (dark + 0.05);
}

function luminance(hex: string) {
  const [red, green, blue] = hexToRgb(hex).map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function hexToRgb(hex: string) {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((index) => Number.parseInt(value.slice(index, index + 2), 16) / 255);
}
