import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const workflowPath = path.join(process.cwd(), ".github", "workflows", "code-quality.yml");
assert.ok(fs.existsSync(workflowPath), "code-quality CI workflow should exist");

const source = fs.readFileSync(workflowPath, "utf8");

assert.match(source, /runs-on: windows-latest/g, "quality jobs should exercise the supported Windows release environment");
assert.match(source, /node-version: 24/g, "CI should use the Node version required by the pinned release tooling");
assert.match(source, /npm ci/g, "CI should install only locked dependencies");
for (const command of [
  "npm run test",
  "npm run lint",
  "npm run typecheck",
  "npm run audit:dependencies",
  "npm run audit:publication",
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
assert.match(source, /github\.event_name != 'pull_request'/, "the expensive static export should run after merges or manually");
assert.match(source, /git status --porcelain/, "CI should fail when checks change repository files");
assert.match(source, /NEXT_PUBLIC_SITE_URL: https:\/\/indianrestaurantlondon\.co\.uk/, "CI should supply the production URL explicitly");

console.log("CI workflow tests passed");
