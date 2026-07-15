import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const read = (relativePath: string) => fs.readFileSync(path.join(process.cwd(), ...relativePath.split("/")), "utf8");
const form = read("src/components/SuggestUpdateForm.tsx");
const page = read("src/app/suggest-update/page.tsx");
const listingPage = read("src/app/restaurants/[slug]/page.tsx");

assert.match(form, /<form[\s\S]*onSubmit=\{generateDraft\}/, "correction workflow should use an explicit local form action");
for (const name of ["restaurant", "area", "issueType", "currentInformation", "suggestedCorrection", "evidenceUrl"]) {
  assert.match(form, new RegExp(`name=["']${name}["']`), `correction form should collect ${name}`);
}
assert.match(form, /type="url"[\s\S]*required/, "public evidence URL should be required");
assert.match(form, /role="status"[\s\S]*aria-live="polite"[\s\S]*aria-atomic="true"/, "form outcomes should be announced accessibly");
assert.doesNotMatch(form, /fetch\(|sendBeacon|XMLHttpRequest|localStorage|sessionStorage/, "correction draft must stay local and ephemeral");
assert.match(form, /mailto:/, "a configured mailbox should use the visitor's email app rather than a hidden website submission");
assert.match(page, /process\.env\.CORRECTIONS_EMAIL/, "corrections destination must be environment-configured");
assert.match(form, /useSearchParams\(\)/, "restaurant query prefill should be read in the client without making the route dynamic");
assert.match(form, /slice\(0, 200\)/, "query prefills should be length-bounded");
assert.match(page, /<Suspense[\s\S]*<SuggestUpdateForm/, "search-parameter enhancement should stay behind a static Suspense boundary");
assert.match(listingPage, /\/suggest-update\?restaurant=/, "each restaurant page should link to its prefilled correction request");

console.log("suggest update workflow tests passed");
