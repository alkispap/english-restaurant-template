import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const workflowPath = path.join(process.cwd(), ".github", "workflows", "code-quality.yml");
const dependabotPath = path.join(process.cwd(), ".github", "dependabot.yml");
assert.ok(fs.existsSync(workflowPath), "code-quality CI workflow should exist");
assert.ok(fs.existsSync(dependabotPath), "GitHub Actions dependency monitoring should exist");

const source = fs.readFileSync(workflowPath, "utf8");
const dependabot = fs.readFileSync(dependabotPath, "utf8");

const checkoutRef = "actions/checkout@9f698171ed81b15d1823a05fc7211befd50c8ae0 # v6.0.3";
const setupNodeRef = "actions/setup-node@48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e # v6.4.0";

assert.equal(source.split(checkoutRef).length - 1, 2, "both jobs should use the approved immutable checkout release");
assert.equal(source.split(setupNodeRef).length - 1, 2, "both jobs should use the approved immutable setup-node release");
assert.doesNotMatch(source, /actions\/(?:checkout|setup-node)@v\d/, "workflow actions should not use movable major tags");
assert.equal(
  source.match(/persist-credentials: false/g)?.length,
  2,
  "checkout should not retain credentials when jobs only inspect Git state"
);

assert.match(source, /runs-on: windows-latest/g, "quality jobs should exercise the supported Windows release environment");
assert.match(source, /node-version: 24/g, "CI should use the Node version required by the pinned release tooling");
assert.equal(source.match(/cache: npm/g)?.length, 2, "both jobs should retain explicit npm dependency caching");
assert.match(source, /npm ci/g, "CI should install only locked dependencies");
for (const command of [
  "npm run test",
  "npm run lint",
  "npm run typecheck",
  "npm run audit:dependencies",
    "npm run audit:publication",
    "npm run audit:freshness",
  "npm run audit:seo",
  "npm run audit:indexation",
  "npm run audit:links",
  "npm run audit:template",
  "npm run build",
  "npm run build:static",
  "npm run check:cloudflare",
  "npm run benchmark:filters"
]) {
  assert.ok(source.includes(command), `CI should run ${command}`);
}
for (const activity of ["opened", "synchronize", "reopened", "ready_for_review", "converted_to_draft"]) {
  assert.match(source, new RegExp(`- ${activity}`), `pull-request activity ${activity} should be handled explicitly`);
}
assert.match(
  source,
  /github\.event_name != 'pull_request' \|\| github\.event\.pull_request\.draft == false/,
  "the expensive static export should run for ready pull requests, main pushes and manual dispatches"
);
assert.match(source, /group: code-quality-\$\{\{ github\.workflow \}\}/, "quality runs should use a stable concurrency group");
assert.match(source, /github\.event\.pull_request\.number \|\| github\.ref/, "concurrency should be scoped to the PR or ref");
assert.match(source, /cancel-in-progress: true/, "superseded quality runs should be cancelled");
assert.match(source, /permissions:\s+contents: read/, "workflow token permissions should remain read-only");
assert.match(source, /name: Fast quality gate/, "the fast required-check name should remain stable");
assert.match(
  source,
  /name: Full static export and rendered benchmark/,
  "the full required-check name should remain stable"
);
assert.doesNotMatch(source, /pull_request_target/, "untrusted pull-request code must not run in a trusted workflow context");
assert.doesNotMatch(source, /secrets\./, "quality checks should not receive repository secrets");
assert.doesNotMatch(source, /publish:cloudflare|wrangler\s+pages\s+deploy/, "quality checks must never deploy");
assert.match(source, /git status --porcelain/, "CI should fail when checks change repository files");
assert.match(source, /NEXT_PUBLIC_SITE_URL: https:\/\/indianrestaurantlondon\.co\.uk/, "CI should supply the production URL explicitly");

assert.match(dependabot, /package-ecosystem: github-actions/, "Dependabot should monitor GitHub Actions");
assert.match(dependabot, /directory: "\/"/, "GitHub Actions monitoring should cover the repository workflow directory");
assert.match(dependabot, /interval: monthly/, "action update proposals should use the approved monthly cadence");
assert.match(dependabot, /open-pull-requests-limit: 2/, "action update noise should remain bounded");

console.log("CI workflow tests passed");
