import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, ...relativePath.split("/")), "utf8");

const popoverHook = read("src/lib/use-dismissible-popover.ts");
const header = read("src/components/HeaderControls.tsx");
const account = read("src/components/AccountMenu.tsx");
const share = read("src/components/ShareButton.tsx");
const listingCard = read("src/components/ListingCard.tsx");
const listingRow = read("src/components/ListingResultsRow.tsx");
const mobileChrome = read("src/components/ListingDetailMobileChrome.tsx");
const listingNav = read("src/components/ListingNav.tsx");
const listingMap = read("src/components/ListingMap.tsx");

assert.match(popoverHook, /event\.key\s*!==\s*"Escape"/, "popover behavior should close on Escape");
assert.match(popoverHook, /triggerRef\.current\?\.focus\(\)/, "Escape should restore focus to the trigger");
assert.match(popoverHook, /document\.addEventListener\("mousedown"/, "popover behavior should close on outside pointer input");
assert.match(popoverHook, /querySelector<HTMLElement>\(initialFocusSelector\)\?\.focus\(\)/, "popover behavior should move focus inside on open");

[header, account, share].forEach((source, index) => {
  const label = ["mobile navigation", "account menu", "share options"][index];
  assert.match(source, /useDismissiblePopover/, `${label} should use the shared keyboard-safe popover behavior`);
  assert.match(source, /aria-expanded=\{is(?:Menu)?Open\}/, `${label} trigger should expose expanded state`);
  assert.match(source, /aria-controls=\{[^}]+Id\}/, `${label} trigger should identify its controlled content`);
});
assert.match(header, /aria-label="Mobile navigation"/, "mobile navigation should have a programmatic name");
assert.match(share, /aria-label="Close share options"/, "share close button should have a programmatic name");
assert.match(share, /copyStatus === "error" \? "alert" : "status"/, "share copy failures should be announced assertively");
assert.match(share, /The link could not be copied/, "share copy failures should provide recovery guidance");
assert.doesNotMatch(share, /console\.error/, "recoverable share failures should not create browser console errors");

[listingCard, listingRow].forEach((source, index) => {
  const label = index === 0 ? "listing card" : "listing result row";
  assert.match(source, /aria-roledescription=\{hasCarousel \? "carousel"/, `${label} image carousel should expose carousel semantics`);
  assert.match(source, /role="status"[\s\S]*aria-live="polite"[\s\S]*aria-atomic="true"/, `${label} should announce image position changes`);
});

assert.match(mobileChrome, /aria-hidden=\{!showStickyAreaBar\}/, "hidden sticky actions should be removed from the accessibility tree");
assert.match(mobileChrome, /inert=\{!showStickyAreaBar\}/, "hidden sticky actions should not remain keyboard-focusable");
assert.match(mobileChrome, /aria-hidden=\{showStickyAreaBar\}/, "scrolled-off original actions should leave the accessibility tree when sticky actions appear");
assert.match(mobileChrome, /inert=\{showStickyAreaBar\}/, "scrolled-off original actions should not duplicate sticky keyboard stops");
assert.match(mobileChrome, /pointer-events-none/, "hidden sticky actions should not accept pointer input");
assert.match(mobileChrome, /aria-label="Restaurant sections"/, "mobile detail navigation should have a programmatic name");
assert.match(
  mobileChrome,
  /role="img" aria-label=\{`\$\{rating\.toFixed\(1\)\} out of 5`\}/,
  "mobile rating dots should expose their accessible name through a permitted image role"
);
assert.match(
  mobileChrome,
  /\[1, 2, 3, 4, 5\][\s\S]*aria-hidden/,
  "decorative rating dots should remain hidden from assistive technology"
);
assert.match(listingNav, /aria-label="Restaurant sections"/, "desktop detail navigation should have a programmatic name");
assert.match(listingNav, /aria-current=\{activeTab === tab\.href \? "location"/, "desktop detail navigation should expose the current section");
assert.match(listingMap, /role="region"/, "interactive listing map should expose region semantics");
assert.match(listingMap, /aria-label=\{`Map showing/, "interactive listing map should have a result-count label");

console.log("interactive controls accessibility tests passed");
