import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.join(process.cwd(), "src/components/SearchBarClient.tsx"), "utf8");

assert.ok(!source.includes("Find Indian restaurants near you"), "search bar should not hard-code the current niche");
assert.ok(source.includes("directoryConfig.listingPluralLabel"), "search bar locate copy should use directory config labels");

console.log("search bar copy tests passed");
