import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const sourceFiles = collectSourceFiles(path.join(process.cwd(), "src"));
const rootEntries = fs.readdirSync(process.cwd(), { withFileTypes: true });
const listingsSourcePath = path.join(process.cwd(), "src", "data", "listings.ts");
const listingsJsonPath = path.join(process.cwd(), "data", "listings.json");
const listingSearchRecordsJsonPath = path.join(process.cwd(), "data", "listing-search-records.json");
const listingSearchIndexJsonPath = path.join(process.cwd(), "data", "listing-search-index.json");
const directoryListingsPagePath = path.join(process.cwd(), "src", "components", "DirectoryListingsPage.tsx");
const listingsPagePath = path.join(process.cwd(), "src", "app", "listings", "page.tsx");
const restaurantsPagePath = path.join(process.cwd(), "src", "app", "restaurants", "page.tsx");
const directoryListingsInteractiveShellPath = path.join(process.cwd(), "src", "components", "DirectoryListingsInteractiveShell.tsx");
const filterPanelOptionsPath = path.join(process.cwd(), "src", "lib", "filter-panel-options.ts");
const searchBarPath = path.join(process.cwd(), "src", "components", "SearchBar.tsx");
const directorySidebarPath = path.join(process.cwd(), "src", "components", "DirectorySidebar.tsx");
const homepageSeoLinksPath = path.join(process.cwd(), "src", "components", "HomepageSeoLinks.tsx");
const geoAreaPath = path.join(process.cwd(), "src", "lib", "geo-area.ts");
const shortlistSummariesPath = path.join(process.cwd(), "src", "data", "shortlist-summaries.ts");
const shortlistIndexJsonPath = path.join(process.cwd(), "data", "shortlist-index.json");
const globalsCssPath = path.join(process.cwd(), "src", "app", "globals.css");
const listingMapPath = path.join(process.cwd(), "src", "components", "ListingMap.tsx");
const supabaseBrowserPath = path.join(process.cwd(), "src", "lib", "supabase-browser.ts");
const siteConfigPath = path.join(process.cwd(), "src", "config", "site.ts");
const directoryPresetsPath = path.join(process.cwd(), "src", "config", "directory-presets.ts");

for (const file of sourceFiles) {
  const content = fs.readFileSync(file, "utf8");
  const relative = path.relative(process.cwd(), file);

  assert.ok(!content.includes("eslint-disable-next-line react-hooks/exhaustive-deps"), `${relative} should not suppress hook dependency checks`);
  assert.ok(!relative.startsWith(path.join("src", "app", "admin")), "browser admin pages should not ship in the template");
  assert.ok(!relative.startsWith(path.join("src", "app", "api", "admin")), "browser admin API routes should not ship in the template");
}

for (const entry of rootEntries) {
  assert.ok(!/^next-.*(\.(out|err))?\.log$/.test(entry.name), `${entry.name} should not be kept in the template root`);
  assert.ok(!/^codex-review-.*\.log$/.test(entry.name), `${entry.name} should not be kept in the template root`);
  assert.ok(!/\.png$/i.test(entry.name), `${entry.name} should not be kept in the template root`);
  assert.ok(entry.name !== "scratch", "scratch review artifacts should not be kept in the template root");
  assert.ok(entry.name !== "homepage.html", "generated homepage.html should not be kept in the template root");
}

assert.ok(fs.existsSync(listingsJsonPath), "large listing records should live in data/listings.json");
assert.ok(
  fs.existsSync(listingSearchRecordsJsonPath),
  "browser-facing search records should live in data/listing-search-records.json"
);
assert.ok(
  fs.existsSync(listingSearchIndexJsonPath),
  "browser-facing search records should have a generated packed index"
);
assert.ok(fs.existsSync(shortlistIndexJsonPath), "compare summaries should have a generated packed index");

const listingsSource = fs.readFileSync(listingsSourcePath, "utf8");
const listingsSourceSize = fs.statSync(listingsSourcePath).size;
assert.ok(
  listingsSourceSize < 20000,
  "src/data/listings.ts should stay small so Next dev does not repeatedly parse a huge generated source file"
);
assert.ok(
  !listingsSource.includes("const listingsJson"),
  "src/data/listings.ts should load JSON data instead of embedding it as a TypeScript string"
);

const globalsCss = fs.readFileSync(globalsCssPath, "utf8");
assert.ok(
  !globalsCss.includes("leaflet/dist/leaflet.css") &&
    !globalsCss.includes(".leaflet-container") &&
    !globalsCss.includes(".leaflet-popup") &&
    !globalsCss.includes(".directory-map-cluster"),
  "map-only Leaflet CSS should not be bundled into the global first-load stylesheet"
);

const listingMap = fs.readFileSync(listingMapPath, "utf8");
assert.ok(
  listingMap.includes("/vendor/leaflet/leaflet.css") &&
    listingMap.includes("/vendor/leaflet/directory-map.css"),
  "ListingMap should load map-only CSS assets when map view is used"
);

const supabaseBrowser = fs.readFileSync(supabaseBrowserPath, "utf8");
assert.ok(
  !/import\s+\{[^}]*createClient[^}]*\}\s+from\s+["']@supabase\/supabase-js["']/.test(supabaseBrowser),
  "Supabase client creation should be lazy-loaded so auth code is not bundled into the homepage first load"
);

const directoryListingsPage = fs.readFileSync(directoryListingsPagePath, "utf8");
assert.ok(
  !directoryListingsPage.includes('"use client"') && !directoryListingsPage.includes("'use client'"),
  "DirectoryListingsPage should be a server component so listing search data is not bundled into the homepage client JS"
);
assert.ok(
  !directoryListingsPage.includes("DirectoryListingsInteractiveShell"),
  "DirectoryListingsPage should render the directory view server-side instead of wrapping the homepage in a client shell"
);
assert.ok(
  !directoryListingsPage.includes('from "@/lib/directory"'),
  "DirectoryListingsPage should use compact client search records instead of importing the full directory dataset"
);

const listingsPage = fs.readFileSync(listingsPagePath, "utf8");
assert.ok(
  listingsPage.includes('redirect("/restaurants")'),
  "legacy /listings page should redirect to the restaurants search workspace"
);

const restaurantsPage = fs.readFileSync(restaurantsPagePath, "utf8");
assert.ok(
  !restaurantsPage.includes("searchParams"),
  "static /restaurants page should not read searchParams during server render; client query enhancer handles filter URLs"
);

for (const configPath of [siteConfigPath, directoryPresetsPath]) {
  const content = fs.readFileSync(configPath, "utf8");
  assert.ok(
    !content.includes('href: "/?') && !content.includes('seeAllHref: "/?'),
    `${path.relative(process.cwd(), configPath)} should send user filter links to the listing search route, not homepage query URLs`
  );
}

const filterPanelOptions = fs.readFileSync(filterPanelOptionsPath, "utf8");
assert.ok(
  !filterPanelOptions.includes('from "@/lib/directory"') && !filterPanelOptions.includes('from "@/lib/directory-growth"'),
  "filter-panel-options should use compact client search records instead of importing full directory modules"
);

for (const browserComponentPath of [
  directoryListingsInteractiveShellPath,
  searchBarPath,
  directorySidebarPath,
  homepageSeoLinksPath
]) {
  if (!fs.existsSync(browserComponentPath)) continue;
  const content = fs.readFileSync(browserComponentPath, "utf8");
  assert.ok(
    !content.includes('from "@/data/listings"') &&
      !content.includes('from "@/data/listing-search-records"') &&
      !content.includes('from "@/lib/listing-search"') &&
      !content.includes('from "@/lib/directory-listings-model"') &&
      !content.includes('from "@/lib/directory"') &&
      !content.includes('from "@/lib/directory-ux"') &&
      !content.includes('from "@/lib/directory-growth"'),
    `${path.relative(process.cwd(), browserComponentPath)} should receive prepared props instead of importing directory datasets`
  );
}

for (const clientDataPath of [
  searchBarPath,
  directorySidebarPath,
  homepageSeoLinksPath,
  geoAreaPath,
  shortlistSummariesPath
]) {
  if (!fs.existsSync(clientDataPath)) continue;
  const content = fs.readFileSync(clientDataPath, "utf8");
  assert.ok(
    !content.includes('from "@/data/listings"') &&
      !content.includes('from "@/lib/directory"') &&
      !content.includes('from "@/lib/directory-ux"') &&
      !content.includes('from "@/lib/directory-growth"'),
    `${path.relative(process.cwd(), clientDataPath)} should receive prepared props instead of importing directory datasets`
  );
}

console.log("source hygiene tests passed");

function collectSourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(fullPath);
    return /\.(ts|tsx)$/.test(entry.name) ? [fullPath] : [];
  });
}
