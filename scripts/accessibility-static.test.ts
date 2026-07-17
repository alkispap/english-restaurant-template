import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const listingsResults = read("src/components/ListingsResults.tsx");
const header = read("src/components/Header.tsx");
const ratingPill = read("src/components/RatingPill.tsx");
const openStatusBadge = read("src/components/OpenStatusBadge.tsx");
const globalsCss = read("src/app/globals.css");
const searchBar = read("src/components/SearchBar.tsx");
const directoryLandingPage = read("src/components/DirectoryLandingPage.tsx");
const restaurantDetailPage = read("src/app/restaurants/[slug]/page.tsx");

assert.ok(
  !listingsResults.includes("aria-pressed"),
  "ListingsResults links should not use aria-pressed; pressed state belongs on buttons, not navigation links"
);
assert.ok(
  !listingsResults.includes('aria-label="Grid view"'),
  "List view link should not expose the mismatched accessible label 'Grid view'"
);
assert.ok(
  listingsResults.includes('aria-label="List view"'),
  "List view link should expose an accessible label that matches its visible meaning"
);
assert.ok(
  !header.includes("bg-primary text-white"),
  "Header logo badge should not use failing white-on-primary contrast"
);
assert.ok(
  !ratingPill.includes("opacity-85"),
  "RatingPill review count should not reduce contrast with opacity"
);
assert.ok(
  !openStatusBadge.includes("bg-red-50 text-red-600"),
  "Closed status badge should use a darker red text color that passes contrast"
);

assertContrast("Header logo badge", "#1f2933", "#ffedd5");
assertContrast("Rating pill text", "#ffffff", "#15803d");
assertContrast("Closed status badge", "#b91c1c", "#fef2f2");
assertContrast("Primary text and white background", primaryColor(), "#ffffff");
assertContrast("Primary text and paper background", primaryColor(), "#fffaf3");
assertContrast("White text and primary action", "#ffffff", primaryColor());
assertContrast("White text and primary hover", "#ffffff", "#9a3412");
assertContrast("Strong muted text and pale green background", mutedStrongColor(), "#f2f7ef");
assertContrast("Strong muted text and disabled background", mutedStrongColor(), "#f1f5f9");

assert.match(
  directoryLandingPage,
  /SectionIntro[\s\S]*text-muted-strong[^\n]*\{description\}/,
  "homepage section descriptions should use the stronger accessible muted foreground"
);
assert.match(
  listingsResults,
  /bg-slate-100[^\n]*text-muted-strong/,
  "disabled pagination should retain a distinct state with accessible text contrast"
);
assert.equal(
  (restaurantDetailPage.match(/text-muted-strong/g) ?? []).length,
  2,
  "both transport descriptions should use the stronger accessible muted foreground"
);

for (const [label, source] of [
  ["SearchBar", searchBar],
  ["DirectoryLandingPage", directoryLandingPage]
] as const) {
  assert.ok(!source.includes("hover:bg-orange-600"), `${label} should not lighten white-text actions to a failing hover colour`);
  assert.ok(source.includes("hover:bg-orange-800"), `${label} should retain accessible contrast on hover`);
}

console.log("accessibility static tests passed");

function read(relativePath: string) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assertContrast(label: string, foreground: string, background: string) {
  const ratio = contrastRatio(foreground, background);
  assert.ok(ratio >= 4.5, `${label} contrast should be at least 4.5; got ${ratio.toFixed(2)}`);
}

function primaryColor() {
  const match = globalsCss.match(/--color-primary:\s*(#[0-9a-f]{6})/i);
  assert.ok(match, "globals.css should define a hexadecimal primary colour token");
  return match[1];
}

function mutedStrongColor() {
  const match = globalsCss.match(/--color-muted-strong:\s*(#[0-9a-f]{6})/i);
  assert.ok(match, "globals.css should define a hexadecimal strong muted colour token");
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
