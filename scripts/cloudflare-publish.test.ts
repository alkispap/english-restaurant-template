import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  buildDeployArgs,
  createArtifactManifest,
  findDeploymentForCommit,
  redactSensitiveText,
  selectRollbackDeployment,
  validateCloudflareProject,
  validateReleaseContext,
  validateRequiredChecks
} from "./publish-cloudflare";

const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8")) as {
  scripts?: Record<string, string>;
};

assert.equal(packageJson.scripts?.["check:cloudflare"], "tsx scripts/check-cloudflare-export.ts");
assert.equal(
  packageJson.scripts?.["build:static"],
  "npm run generate:redirects && tsx scripts/run-static-build.ts && npm run audit:payload"
);
assert.equal(packageJson.scripts?.["audit:payload"], "tsx scripts/check-client-payload.ts");
assert.equal(packageJson.scripts?.["generate:redirects"], "tsx scripts/generate-cloudflare-redirects.ts");
assert.equal(packageJson.scripts?.["diagnose:static"], "tsx scripts/static-export-diagnostics.ts");
assert.equal(
  packageJson.scripts?.["prepare:cloudflare"],
  "powershell -NoProfile -ExecutionPolicy Bypass -File scripts/prepare-cloudflare-upload.ps1"
);
assert.equal(packageJson.scripts?.["check:release"], "tsx scripts/publish-cloudflare.ts --checks-only");
assert.equal(packageJson.scripts?.["publish:cloudflare"], "tsx scripts/publish-cloudflare.ts");
assert.equal(
  (JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8")) as { devDependencies?: Record<string, string> })
    .devDependencies?.wrangler,
  "4.111.0",
  "Wrangler should be pinned as a project development dependency"
);

const prepareScriptPath = path.join(process.cwd(), "scripts", "prepare-cloudflare-upload.ps1");
assert.ok(fs.existsSync(prepareScriptPath), "prepare:cloudflare should have a PowerShell workflow script");

const prepareScript = fs.readFileSync(prepareScriptPath, "utf8");
assert.ok(prepareScript.includes("Stop-ProjectDevServers"), "prepare script should stop this project's dev server before export");
assert.ok(!prepareScript.includes("indianrestaurantlondon.co.uk"), "prepare script should derive the domain from the selected directory pack");
assert.ok(fs.existsSync(path.join(process.cwd(), "scripts", "run-static-build.ts")), "static builds should use the directory-pack-aware wrapper");
assert.ok(prepareScript.includes("npm.cmd") && prepareScript.includes("run") && prepareScript.includes("build:static"), "prepare script should run the static export build");
assert.ok(prepareScript.includes("check:cloudflare"), "prepare script should run Cloudflare export checks");
assert.ok(prepareScript.includes("Upload-ready folder:"), "prepare script should report the upload-ready out folder");

const publishScript = fs.readFileSync(path.join(process.cwd(), "scripts", "publish-cloudflare.ts"), "utf8");
const exportCheckScript = fs.readFileSync(path.join(process.cwd(), "scripts", "check-cloudflare-export.ts"), "utf8");

assert.ok(publishScript.includes("CLOUDFLARE_PROJECT_NAME"), "publish script should require a Cloudflare project name");
assert.ok(
  publishScript.includes('"--confirm-project"'),
  "publish script should require confirmation of the exact Cloudflare project"
);
assert.ok(
  publishScript.includes('assertCleanWorktree("before release checks")') &&
    publishScript.includes('assertCleanWorktree("after release checks and static export")'),
  "publish script should reject uncommitted changes before checks and after export"
);
assert.ok(
  publishScript.includes('"node_modules", "wrangler", "bin", "wrangler.js"') &&
    publishScript.includes("fs.existsSync(wranglerCli)"),
  "publish script should require the pinned project-local Wrangler installation"
);
assert.ok(
  publishScript.includes('"pages",') && publishScript.includes('"deploy",'),
  "publish script should deploy with Wrangler Direct Upload"
);
assert.ok(
  publishScript.includes('"--checks-only"') && publishScript.includes("No files were uploaded"),
  "publish script should support a non-deploying release-check mode"
);
assert.ok(
  publishScript.includes('"npm", ["run", "prepare:cloudflare"]'),
  "publish script should run the full Cloudflare preparation workflow before deployment"
);
assert.ok(publishScript.includes("shell: false"), "publish script should not pass deployment arguments through a shell");
assert.ok(
  publishScript.includes('"--branch"') && publishScript.includes("productionBranch"),
  "publish script should explicitly identify the Cloudflare production branch"
);
assert.ok(publishScript.includes('"--confirm-production"'), "production publish should require explicit production confirmation");
assert.ok(publishScript.includes('"--confirm-branch"'), "production publish should confirm the main branch");
assert.ok(publishScript.includes('"--confirm-commit"'), "production publish should confirm the full Git SHA");
assert.ok(
  publishScript.includes('"--confirm-previous-deployment"'),
  "production publish should confirm the current rollback target"
);
assert.ok(
  publishScript.includes('"--commit-hash"') &&
    publishScript.includes('"--commit-message"') &&
    publishScript.includes('"--commit-dirty=false"'),
  "Wrangler deployment should include exact clean-commit metadata"
);
assert.ok(
  publishScript.includes('"refs/remotes/origin/main"') && publishScript.includes('"refs/heads/main"'),
  "production publish should compare HEAD with local and remote main"
);
assert.ok(
  publishScript.includes("Do not retry") && publishScript.includes("deployment history"),
  "an indeterminate upload should require deployment-history reconciliation instead of an automatic retry"
);
assert.ok(
  publishScript.includes("indeterminate-reconciliation-failed") && publishScript.includes("Do not retry the upload"),
  "a post-upload history failure should preserve an indeterminate result and forbid blind retry"
);
assert.ok(
  publishScript.includes("PRODUCTION_UPLOAD_TIMEOUT_MS") && publishScript.includes("timeout: PRODUCTION_UPLOAD_TIMEOUT_MS"),
  "production uploads should have a bounded timeout before reconciliation"
);
assert.ok(
  publishScript.includes("getDirectoryPack") && publishScript.includes("approvedProductionUrl"),
  "the production URL should exactly match the active reusable directory pack"
);
assert.ok(
  publishScript.includes("artifact-manifest.sha256") && publishScript.includes("aggregateSha256"),
  "release checks should create deterministic artifact evidence"
);
assert.ok(
  exportCheckScript.includes("_redirects"),
  "Cloudflare export checks should verify redirect rules are present in out/_redirects"
);

const headersPath = path.join(process.cwd(), "public", "_headers");
const headers = fs.readFileSync(headersPath, "utf8");
assert.ok(headers.includes("/robots.txt"), "public/_headers should set robots cache policy by path");
assert.ok(headers.includes("/sitemap.xml"), "public/_headers should set sitemap cache policy by path");
assert.ok(headers.includes("Content-Security-Policy:"), "public/_headers should apply the production CSP");
assert.ok(headers.includes("X-Content-Type-Options: nosniff"), "public/_headers should prevent MIME sniffing");
assert.ok(headers.includes("Permissions-Policy:"), "public/_headers should restrict sensitive browser capabilities");
assert.ok(
  !headers.includes("https://indianrestaurantlondon.co.uk/robots.txt") &&
    !headers.includes("https://www.indianrestaurantlondon.co.uk/robots.txt") &&
    !headers.includes("https://indianrestaurantlondon.co.uk/sitemap.xml") &&
    !headers.includes("https://www.indianrestaurantlondon.co.uk/sitemap.xml"),
  "public/_headers should not duplicate robots or sitemap rules with hostname-specific entries"
);
assert.ok(
  !fs.existsSync(path.join(process.cwd(), "public", "_worker.js")),
  "robots cache policy should not require a Pages advanced-mode worker"
);

const redirectsPath = path.join(process.cwd(), "public", "_redirects");
assert.ok(fs.existsSync(redirectsPath), "public/_redirects should define static-hosting redirects");
const redirects = fs.readFileSync(redirectsPath, "utf8");
assert.ok(
  redirects.includes("/listings/:slug/ /restaurants/:slug/ 301"),
  "trailing-slash legacy listing detail URLs should permanently redirect to canonical restaurant URLs"
);
assert.ok(
  redirects.includes("/listings/ /restaurants/ 301"),
  "legacy listing index URL should permanently redirect to canonical restaurant index"
);
assert.ok(
  redirects.includes("/restaurants/hyderabad-darbar-2/ /restaurants/hyderabad-darbar-redbridge/ 301"),
  "renamed restaurant URLs should use one-hop permanent redirects"
);

const commit = "a".repeat(40);
assert.doesNotThrow(() =>
  validateReleaseContext({
    branch: "main",
    confirmedBranch: "main",
    confirmedCommit: commit,
    head: commit,
    localMain: commit,
    originMain: commit,
    productionBranch: "main"
  })
);
for (const invalidContext of [
  { branch: "codex/code-quality" },
  { confirmedBranch: "release" },
  { confirmedCommit: "aaaaaaa" },
  { head: "b".repeat(40) },
  { localMain: "b".repeat(40) },
  { originMain: "b".repeat(40) },
  { productionBranch: "production" }
]) {
  assert.throws(
    () =>
      validateReleaseContext({
        branch: "main",
        confirmedBranch: "main",
        confirmedCommit: commit,
        head: commit,
        localMain: commit,
        originMain: commit,
        productionBranch: "main",
        ...invalidContext
      }),
    /Production publish refused|full 40-character/
  );
}

assert.doesNotThrow(() =>
  validateRequiredChecks(
    [
      { conclusion: "success", head_sha: commit, name: "Fast quality gate" },
      { conclusion: "success", head_sha: commit, name: "Full static export and rendered benchmark" }
    ],
    commit
  )
);
assert.throws(
  () => validateRequiredChecks([{ conclusion: "failure", head_sha: commit, name: "Fast quality gate" }], commit),
  /has not succeeded|is missing/
);
assert.throws(
  () =>
    validateRequiredChecks(
      [
        { conclusion: "success", head_sha: "b".repeat(40), name: "Fast quality gate" },
        { conclusion: "success", head_sha: commit, name: "Full static export and rendered benchmark" }
      ],
      commit
    ),
  /is missing/
);

assert.deepEqual(
  validateCloudflareProject([{ name: "directory", production_branch: "main", source: null }], "directory", "main"),
  { name: "directory", production_branch: "main", source: null }
);
assert.throws(() => validateCloudflareProject([], "directory", "main"), /was not found/);
assert.throws(
  () => validateCloudflareProject([{ name: "directory", production_branch: "main", source: { type: "github" } }], "directory", "main"),
  /Git-integrated/
);
assert.throws(
  () => validateCloudflareProject([{ name: "directory", production_branch: "production", source: null }], "directory", "main"),
  /not main/
);

const rollback = {
  environment: "production",
  id: "11111111-2222-3333-4444-555555555555",
  latest_stage: { status: "success" },
  project_name: "directory",
  url: "https://11111111.directory.pages.dev"
};
assert.equal(selectRollbackDeployment([rollback], rollback.id, "directory"), rollback);
assert.throws(
  () => selectRollbackDeployment([{ ...rollback, environment: "preview" }], rollback.id, "directory"),
  /no successful production/
);
assert.throws(
  () => selectRollbackDeployment([{ ...rollback, latest_stage: { status: "failure" } }], rollback.id, "directory"),
  /no successful production/
);
assert.throws(() => selectRollbackDeployment([rollback], "22222222-3333-4444-5555-666666666666", "directory"), /not the current/);

const deployed = {
  deployment_trigger: {
    metadata: { branch: "main", commit_dirty: false, commit_hash: commit, commit_message: "release" }
  },
  environment: "production",
  id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  latest_stage: { status: "success" },
  project_name: "directory",
  url: "https://aaaaaaaa.directory.pages.dev"
};
assert.equal(findDeploymentForCommit([deployed], { branch: "main", commit, projectName: "directory" }), deployed);
assert.equal(
  findDeploymentForCommit([{ ...deployed, environment: "preview" }], { branch: "main", commit, projectName: "directory" }),
  undefined
);
assert.equal(
  findDeploymentForCommit(
    [{ ...deployed, deployment_trigger: { metadata: { ...deployed.deployment_trigger.metadata, commit_dirty: true } } }],
    { branch: "main", commit, projectName: "directory" }
  ),
  undefined
);

assert.deepEqual(
  buildDeployArgs({ branch: "main", commit, commitMessage: "release", projectName: "directory" }),
  [
    "pages",
    "deploy",
    "out",
    "--project-name",
    "directory",
    "--branch",
    "main",
    "--commit-hash",
    commit,
    "--commit-message",
    "release",
    "--commit-dirty=false"
  ]
);

const manifestRoot = fs.mkdtempSync(path.join(os.tmpdir(), "cloudflare-release-manifest-"));
try {
  fs.mkdirSync(path.join(manifestRoot, "nested"));
  fs.writeFileSync(path.join(manifestRoot, "z.txt"), "z", "utf8");
  fs.writeFileSync(path.join(manifestRoot, "nested", "a.txt"), "a", "utf8");
  const firstManifest = createArtifactManifest(manifestRoot);
  const secondManifest = createArtifactManifest(manifestRoot);
  assert.deepEqual(firstManifest, secondManifest, "artifact manifest should be deterministic");
  assert.equal(firstManifest.fileCount, 2);
  assert.equal(firstManifest.totalBytes, 2);
  assert.match(firstManifest.aggregateSha256, /^[0-9a-f]{64}$/);
  assert.ok(firstManifest.lines[0]?.endsWith("  nested/a.txt"), "manifest paths should be sorted and portable");
  fs.writeFileSync(path.join(manifestRoot, "z.txt"), "changed", "utf8");
  assert.notEqual(createArtifactManifest(manifestRoot).aggregateSha256, firstManifest.aggregateSha256);
} finally {
  fs.rmSync(manifestRoot, { force: true, recursive: true });
}

const sensitive = redactSensitiveText(
  'Authorization: Bearer secret-token\n{"account_id":"private-account","token":"private-token"}\nCLOUDFLARE_API_TOKEN=private'
);
assert.ok(!sensitive.includes("secret-token") && !sensitive.includes("private-account") && !sensitive.includes("private-token"));
assert.ok(sensitive.includes("[REDACTED]"));

console.log("Cloudflare publish tests passed");
