import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const decision = fs.readFileSync(path.join(root, "scripts", "record-listing-publication-decision.ts"), "utf8");
const migration = fs.readFileSync(path.join(root, "scripts", "migrate-listing-publication-state.ts"), "utf8");
const utilities = fs.readFileSync(path.join(root, "scripts", "publication-script-utils.ts"), "utf8");

assert.match(decision, /args\.includes\("--write"\)/, "publication decisions must be dry-run by default");
assert.match(decision, /--expected-published-count/, "publication writes must require an expected public count");
assert.match(decision, /applyPublicationDecision/, "publication writes must use the guarded transition engine");
assert.match(migration, /EXPECTED_SOURCE_SHA256/, "migration must pin the canonical source hash");
assert.match(migration, /fs\.existsSync\(registryPath\)[\s\S]*refuse to overwrite history/, "migration must not overwrite an existing registry");
assert.match(utilities, /publication-tmp/, "publication writes must prepare temporary files before replacement");
assert.match(utilities, /originals/, "publication writes must retain originals for recovery");

console.log("listing publication command tests passed");
