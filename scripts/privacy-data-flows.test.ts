import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { getTrustPage } from "../src/lib/trust-pages";

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, ...relativePath.split("/")), "utf8");
const privacyText = getTrustPage("privacy").sections.map((section) => `${section.heading} ${section.body}`).join("\n");
const analyticsSource = read("src/lib/directory-analytics.ts");
const adsSource = read("src/config/adsterra.ts");
const contactSource = read("src/app/contact/page.tsx");
const updateSource = read("src/app/suggest-update/page.tsx");
const updateFormSource = read("src/components/SuggestUpdateForm.tsx");

assert.doesNotMatch(analyticsSource, /fetch\(|sendBeacon|XMLHttpRequest/, "current analytics should not transmit events externally");
assert.match(adsSource, /adsterraAdsEnabled\s*=\s*false/, "advertising network loading should remain disabled");
assert.doesNotMatch(contactSource, /<form|fetch\(/, "contact page should not claim to submit data when it only provides guidance");
assert.doesNotMatch(`${updateSource}\n${updateFormSource}`, /fetch\(|sendBeacon|XMLHttpRequest/, "update request builder should not transmit data from the website");
assert.match(updateFormSource, /does not automatically submit, store, or publish/, "update form should disclose its local-only behavior");

[
  /does not send analytics events to an external analytics provider/,
  /does not set analytics cookies/,
  /saved and compared restaurant identifiers and listing comments are stored in the visitor's browser/i,
  /comments are private to that browser/i,
  /Coordinates are used in the browser/,
  /are not stored or sent to this directory/,
  /Account synchronisation is currently disabled/,
  /suggest-an-update form prepares correction text in the visitor's browser/,
  /does not automatically submit, publish, or retain it/,
  /advertising network loading is currently disabled/,
  /consent controls required for cookies/
].forEach((pattern) => assert.match(privacyText, pattern, `privacy policy should disclose ${pattern}`));

assert.doesNotMatch(
  allApplicationSource(),
  /document\.cookie\s*=|cookieStore\./,
  "application source should not set cookies while no consent mechanism exists"
);

console.log("privacy data-flow tests passed");

function allApplicationSource() {
  return findSourceFiles(path.join(root, "src")).map((filePath) => fs.readFileSync(filePath, "utf8")).join("\n");
}

function findSourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return findSourceFiles(entryPath);
    return /\.[cm]?[jt]sx?$/.test(entry.name) ? [entryPath] : [];
  });
}
