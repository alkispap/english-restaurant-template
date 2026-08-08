import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const workflowPath = path.join(process.cwd(), ".github", "workflows", "artifact-compression-benchmark.yml");
assert.ok(fs.existsSync(workflowPath), "the manual compression benchmark workflow should exist");

const source = fs.readFileSync(workflowPath, "utf8");
const checkoutRef = "actions/checkout@9f698171ed81b15d1823a05fc7211befd50c8ae0 # v6.0.3";
const setupNodeRef = "actions/setup-node@48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e # v6.4.0";
const uploadRef = "actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4.6.2";
const downloadRef = "actions/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093 # v4.3.0";

assert.match(source, /^on:\s*\n\s+workflow_dispatch:/m, "the benchmark must require deliberate manual dispatch");
assert.doesNotMatch(source, /^\s+(?:push|pull_request):/m, "the benchmark must not run automatically");
assert.match(source, /actions: read/, "the benchmark needs read-only artifact metadata access");
assert.equal(source.split(checkoutRef).length - 1, 2, "both jobs should use the approved immutable checkout release");
assert.equal(source.split(setupNodeRef).length - 1, 2, "both jobs should use the approved immutable setup-node release");
assert.equal(source.split(uploadRef).length - 1, 2, "the benchmark should upload exactly two variants");
assert.equal(source.split(downloadRef).length - 1, 2, "the benchmark should download exactly two variants");
assert.match(
  source,
  /name: Build one deterministic static candidate\s+env:\s+NEXT_BUILD_ID: \$\{\{ github\.sha \}\}\s+run: npm run build:static/,
  "both comparisons must start from one deterministic build"
);
assert.match(source, /compression-level: 0/, "the benchmark must include no compression");
assert.match(source, /compression-level: 6/, "the benchmark must include normal compression");
assert.equal(source.split("retention-days: 1").length - 1, 2, "both benchmark artifacts should expire after one day");
assert.match(source, /artifact-ids: \$\{\{ needs\.build-and-upload\.outputs\.artifact-id-0 \}\}/, "level 0 download must use its immutable artifact ID");
assert.match(source, /artifact-ids: \$\{\{ needs\.build-and-upload\.outputs\.artifact-id-6 \}\}/, "level 6 download must use its immutable artifact ID");
assert.match(source, /GITHUB_STEP_SUMMARY/, "the benchmark must record its measured timings");
assert.ok(
  source.indexOf("Start upload comparison summary") < source.indexOf("Record level 0 upload result"),
  "the upload table header must be written in the same job before its rows"
);
assert.ok(
  source.indexOf("Record level 0 download result") < source.indexOf("Verify level 0 candidate") &&
    source.indexOf("Record level 6 download result") < source.indexOf("Verify level 6 candidate"),
  "download durations must stop before full candidate verification"
);
assert.doesNotMatch(source, /CLOUDFLARE|wrangler|publish:cloudflare|publish:workers/i, "the benchmark must not deploy or require hosting credentials");

console.log("artifact compression benchmark workflow tests passed");
