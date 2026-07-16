import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const writerFiles = [
  "record-listing-verification.ts",
  "backfill-listing-provenance.ts",
  "quarantine-unapproved-listing-media.ts",
  "enrich-outscraper-media.ts",
  "resolve-listing-entities.ts"
];
for (const filename of writerFiles) {
  const source = read(filename);
  assert.match(source, /buildListingDataOutputs/, `${filename} must use publication-aware derived output rendering`);
  assert.doesNotMatch(source, /renderListingSearchRecordsJsonFile\(listings\)/, `${filename} must not render all retained listings into public search`);
}

const verification = read("record-listing-verification.ts");
assert.match(verification, /readListingPublicationRegistry/, "verification must retain publication state while regenerating data");

const importSource = read("import-directory.ts");
assert.match(importSource, /const write = args\.includes\("--write"\)/, "imports must be dry-run unless --write is explicit");
assert.match(importSource, /reconcileListingImport/, "imports must preserve existing records and initialize new states safely");
assert.match(importSource, /--expected-source-absent/, "import writes must guard source-absence counts");

const entitySource = read("resolve-listing-entities.ts");
assert.doesNotMatch(entitySource, /filter\(\(listing\) => !retiredSlugs/, "entity resolution must not delete retired records");
assert.match(entitySource, /superseded-by-canonical/, "entity resolution must retire aliases through publication state");

console.log("listing publication writer safety tests passed");

function read(filename: string) {
  return fs.readFileSync(path.join(process.cwd(), "scripts", filename), "utf8");
}
