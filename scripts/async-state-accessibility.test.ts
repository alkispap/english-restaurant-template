import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), "utf8");

const accountProvider = read("src/components/AccountProvider.tsx");
const accountMenu = read("src/components/AccountMenu.tsx");
const privateNote = read("src/components/ListingPrivateNote.tsx");
const saveListing = read("src/components/SaveListingButton.tsx");
const savedListingsLink = read("src/components/SavedListingsLink.tsx");
const compare = read("src/components/CompareSavedListings.tsx");
const map = read("src/components/ListingMap.tsx");
const directoryEnhancer = read("src/components/DirectoryListingsQueryEnhancer.tsx");
const seoEnhancer = read("src/components/SeoLandingQueryEnhancer.tsx");

for (const operation of ["signInWithOAuth", "signInWithOtp", "signOut"] as const) {
  assert.match(
    accountProvider,
    new RegExp(`const \\{ error \\} = await supabase\\.auth\\.${operation}[\\s\\S]*if \\(error\\) throw error`),
    `${operation} should reject instead of reporting a failed account action as successful`
  );
}
assert.match(accountProvider, /listing_notes[\s\S]*if \(error\) throw error/, "private-note persistence should surface database errors");
assert.match(accountProvider, /saved_listings[\s\S]*if \(error\) throw error/, "saved-listing persistence should surface database errors");
assert.doesNotMatch(accountProvider, /dispatchEvent\(new Event\("directory-shortlist-change"\)\)/, "saved-listing writes should not trigger a stale same-tab remote re-sync");
assert.doesNotMatch(saveListing, /directory-shortlist-change/, "save buttons should consume the shared account snapshot directly");
assert.doesNotMatch(savedListingsLink, /directory-shortlist-change/, "saved-listing count should consume the shared account snapshot directly");
assert.doesNotMatch(compare, /directory-shortlist-change/, "compare should consume the shared account snapshot directly");

assert.match(accountMenu, /setActionPending\(true\)/, "account actions should expose a pending state");
assert.match(accountMenu, /The sign-in link could not be sent/, "email sign-in should expose a safe failure message");
assert.match(accountMenu, /Sign-in could not be started/, "provider sign-in should expose a safe failure message");
assert.match(accountMenu, /Sign-out failed/, "sign-out should expose a safe failure message");
assert.match(privateNote, /Note could not be saved/, "private notes should not report success after a failed save");
assert.match(privateNote, /aria-busy=\{saving\}/, "private-note submission should expose its busy state");
assert.match(saveListing, /aria-busy=\{pending\}/, "save controls should expose synchronization progress");
assert.match(saveListing, /account sync failed/, "save controls should distinguish browser persistence from failed account sync");
assert.match(saveListing, /role="status" aria-live="polite"/, "save controls should announce their outcome");

assert.match(compare, /role="status" aria-live="polite" aria-busy="true"/, "compare loading should be announced as busy");
assert.match(compare, /Saved listings could not be synced/, "compare should expose shortlist synchronization failures");
assert.match(compare, /aria-busy=\{removingSlug === listing\.slug\}/, "compare removal should expose per-listing progress");

assert.match(map, /\.catch\(\(\) => \{[\s\S]*setLoadError\(true\)/, "map initialization failures should leave the loading state");
assert.match(map, /aria-busy=\{!loaded && !loadError\}/, "map loading should expose its busy state");
assert.match(map, /role="alert"[\s\S]*The map could not be loaded/, "map failures should expose visible retry guidance");
assert.match(map, /!loaded && !loadError/, "map failures should replace rather than accompany the loading message");
assert.doesNotMatch(map, /#e67e22/i, "map popup action should not use the old failing orange contrast");
assert.match(map, /details\.style\.background = "#c2410c"/, "map popup action should use the accessible primary colour");

for (const [name, source, promiseName] of [
  ["directory", directoryEnhancer, "directoryListingsClientModulesPromise"],
  ["SEO landing", seoEnhancer, "seoLandingClientModulesPromise"]
] as const) {
  assert.match(source, /setQueryBusy\(true\)/, `${name} result updates should expose a busy state`);
  assert.match(source, /role=\{queryError \? "alert" : "status"\}/, `${name} result updates should expose success and failure announcements`);
  assert.match(source, /directoryConfig\.listingPluralLabel\.toLowerCase\(\)/, `${name} result updates should announce their configured result type`);
  assert.match(source, /could not be updated/, `${name} module failures should provide recovery guidance`);
  assert.match(source, new RegExp(`${promiseName} = null`), `${name} module loading should be retryable after failure`);
}

console.log("async state accessibility tests passed");
