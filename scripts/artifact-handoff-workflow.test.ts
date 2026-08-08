import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const workflowPath = path.join(process.cwd(), ".github", "workflows", "artifact-handoff-spike.yml");
assert.ok(fs.existsSync(workflowPath), "the non-production artifact handoff workflow should exist");

const source = fs.readFileSync(workflowPath, "utf8");
const checkoutRef = "actions/checkout@9f698171ed81b15d1823a05fc7211befd50c8ae0 # v6.0.3";
const setupNodeRef = "actions/setup-node@48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e # v6.4.0";
const uploadRef = "actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4.6.2";
const downloadRef = "actions/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093 # v4.3.0";

assert.match(source, /^on:\s*\n\s+workflow_dispatch:/m, "the spike must require deliberate manual dispatch");
assert.doesNotMatch(source, /^\s+(?:push|pull_request):/m, "the spike must not run automatically on source changes");
assert.match(source, /permissions:\s*\n\s+contents: read/, "the workflow token must remain read-only");
assert.equal(source.split(checkoutRef).length - 1, 2, "both jobs should use the approved immutable checkout release");
assert.equal(source.split(setupNodeRef).length - 1, 2, "both jobs should use the approved immutable setup-node release");
assert.ok(source.includes(uploadRef), "upload action must be pinned by full commit");
assert.ok(source.includes(downloadRef), "download action must be pinned by full commit");
assert.doesNotMatch(source, /@v\d/, "all actions must be pinned by immutable commit");
assert.doesNotMatch(source, /secrets\.|CLOUDFLARE|wrangler\s+pages\s+deploy|publish:cloudflare/i, "the spike must not have deployment credentials or commands");
assert.match(source, /npm run build:static/, "the spike should create the static candidate");
assert.match(source, /npm run create:release-candidate/, "the spike should create internal candidate evidence");
assert.match(source, /artifact-ids: \$\{\{ needs\.build-and-upload\.outputs\.artifact-id \}\}/, "the download must use the immutable artifact ID");
assert.match(source, /merge-multiple: true/, "artifact-ID downloads must extract directly into the requested directory");
assert.match(source, /downloaded-candidate\\release-candidate-transfer\\out/, "verification must use the artifact root created by the upload action");
assert.match(source, /npm run verify:release-candidate/, "the downloaded candidate must be verified before any future use");
assert.match(source, /retention-days: 7/, "the short-lived spike artifact should expire after seven days");
assert.match(source, /compression-level: 0/, "the spike should measure transfer without compression variance");

console.log("artifact handoff workflow tests passed");
