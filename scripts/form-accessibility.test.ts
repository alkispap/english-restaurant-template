import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), "utf8");

const headerSearch = read("src/components/HeaderSearch.tsx");
const privateNote = read("src/components/ListingPrivateNote.tsx");
const comments = read("src/components/ListingComments.tsx");
const accountMenu = read("src/components/AccountMenu.tsx");
const cardGrid = read("src/components/SearchableCardGrid.tsx");
const filterChoices = read("src/components/FilterCheckboxGroup.tsx");
const locateArea = read("src/components/LocateAreaButton.tsx");
const searchBarClient = read("src/components/SearchBarClient.tsx");

assert.match(headerSearch, /aria-label=\{`Search \$\{directoryConfig\.listingPluralLabel/, "header search input should have a persistent programmatic label");

for (const [name, source, label] of [
  ["private note", privateNote, "Private note"],
  ["comment", comments, "Comment"]
] as const) {
  assert.match(source, new RegExp(`<label htmlFor=\\{[^}]+\\} className="sr-only">\\s*${label}`), `${name} textarea should have a persistent label`);
  assert.match(source, /<textarea[\s\S]*aria-describedby=/, `${name} textarea should expose its supporting text`);
  assert.match(source, /role="status"[\s\S]*aria-live="polite"[\s\S]*aria-atomic="true"/, `${name} updates should be announced`);
}

assert.match(comments, /aria-label=\{`Remove comment posted/, "comment removal controls should have contextual accessible names");
assert.match(accountMenu, /type="email"[\s\S]*required[\s\S]*autoComplete="email"[\s\S]*aria-describedby="account-email-status"/, "email sign-in should expose validation, autocomplete, and status help");
assert.match(accountMenu, /id="account-email-status"[\s\S]*role="status"/, "email sign-in result should be announced");

assert.match(cardGrid, /role="group" aria-label=\{alphabetLabel/, "alphabet controls should expose a named group");
assert.match(cardGrid, /role="status"[\s\S]*\{visibleItems\.length\.toLocaleString\(\)\} results/, "filtered card count should be announced");
assert.match(filterChoices, /role="status"[\s\S]*\{filteredOptions\.length\.toLocaleString\(\)\} choices available/, "filtered modal choices should be announced");

for (const [name, source] of [
  ["location button", locateArea],
  ["client search bar", searchBarClient]
] as const) {
  assert.match(source, /role="status"[\s\S]*aria-live="polite"[\s\S]*Finding your area\./, `${name} should announce location progress and failures`);
}

console.log("form accessibility tests passed");
