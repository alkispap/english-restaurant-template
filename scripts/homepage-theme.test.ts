import assert from "node:assert/strict";
import fs from "node:fs";

const homepageSource = fs.readFileSync("src/components/DirectoryLandingPage.tsx", "utf8");
const listingsSource = fs.readFileSync("src/components/DirectoryListingsPage.tsx", "utf8");
const globalStylesSource = fs.readFileSync("src/app/globals.css", "utf8");

assert.ok(homepageSource.includes('className="directory-home"'), "homepage should expose a theme scope root");

for (const variant of ["ivory", "plain", "pale-green"]) {
  assert.ok(homepageSource.includes(`home-band--${variant}`), `homepage should render the ${variant} section treatment`);
}

assert.ok(homepageSource.includes("home-band--ornament"), "dietary discovery should include the editorial ornament");
assert.ok(homepageSource.includes("home-band--hubs"), "dining hubs should include the lighter editorial ornament");
assert.ok(homepageSource.includes("home-band--botanical"), "region links should include the botanical accent");
assert.ok(homepageSource.includes("home-discovery-card"), "discovery cards should use the editorial card treatment");
assert.ok(homepageSource.includes("home-restaurant-card"), "restaurant cards should use the quieter card treatment");
assert.ok(homepageSource.includes("home-cta-band"), "final CTA should use the deep-green band treatment");
assert.ok(
  homepageSource.includes('className="home-heading-accent" aria-hidden'),
  "heading ornaments should stay outside the accessibility tree"
);

const themeSelectorLines = globalStylesSource
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line.includes(".home-") && (line.endsWith("{") || line.endsWith(",")));

assert.ok(themeSelectorLines.length > 0, "homepage theme should define scoped CSS rules");
assert.deepEqual(
  themeSelectorLines.filter((selector) => !selector.includes(".directory-home")),
  [],
  "every homepage theme selector should remain scoped beneath .directory-home"
);

assert.ok(
  globalStylesSource.includes("@media (prefers-reduced-motion: reduce)"),
  "homepage theme should respect reduced-motion preferences"
);
assert.ok(
  globalStylesSource.includes(".directory-home .home-discovery-card:focus-visible"),
  "homepage discovery cards should expose a visible keyboard focus state"
);
assert.ok(
  globalStylesSource.includes(".directory-home .home-band--hubs::before"),
  "dining-hub ornament styling should remain scoped to the homepage"
);

const imageCardSource = homepageSource.slice(
  homepageSource.indexOf("function ImageCard"),
  homepageSource.indexOf("function RestaurantRow")
);
assert.ok(imageCardSource.includes("item.description"), "discovery cards should retain their natural count descriptions");
assert.ok(!/listings/i.test(imageCardSource), "discovery cards should not repeat counts as listings metadata");
assert.ok(
  homepageSource.includes("{item.count.toLocaleString()} listings"),
  "compact region links should retain their listings metadata"
);

const photoCreditsSource = homepageSource.slice(
  homepageSource.indexOf("function PhotoCredits"),
  homepageSource.indexOf("function SectionIntro")
);
assert.ok(photoCreditsSource.includes("<details"), "photo credits should use a collapsed native disclosure");
assert.ok(photoCreditsSource.includes("<summary"), "photo credits disclosure should expose a summary label");
assert.ok(!/<details[^>]*\sopen(?:=|\s|>)/.test(photoCreditsSource), "photo credits should be collapsed by default");
for (const field of ["credit.title", "credit.author", "credit.sourceUrl", "credit.licenseLabel", "credit.licenseUrl", "credit.note"]) {
  assert.ok(photoCreditsSource.includes(field), `photo credits should retain ${field}`);
}
assert.ok(!listingsSource.includes("home-band"), "directory listing pages should not use homepage theme bands");
assert.ok(!listingsSource.includes("directory-home"), "directory listing pages should remain outside the homepage theme scope");

console.log("homepage theme tests passed");
