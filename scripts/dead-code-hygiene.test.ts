import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const componentsDirectory = path.join(process.cwd(), "src", "components");
const removedComponents = [
  "CategoryPills.tsx",
  "DirectoryListingsQueryController.tsx",
  "HomepageSeoLinks.tsx",
  "OpenNowToggle.tsx",
  "SearchableSelect.tsx",
  "SearchBarClient.tsx"
];

for (const component of removedComponents) {
  assert.ok(
    !fs.existsSync(path.join(componentsDirectory, component)),
    `${component} should not return without a verified live importer`
  );
}

console.log("dead code hygiene tests passed");
