import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  buildReleaseAttemptCommitMessage,
  buildDeployArgs,
  collectPaginatedResults,
  createArtifactManifest,
  findDeploymentForCommit,
  redactSensitiveText,
  retryCloudflareApiRead,
  selectRollbackDeployment,
  validateArtifactConfirmation,
  validateArtifactUnchanged,
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
  "4.119.0",
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
  publishScript.includes('runNpm(["run", "prepare:cloudflare"])'),
  "publish script should run the full Cloudflare preparation workflow before deployment"
);
assert.ok(publishScript.includes('"audit:freshness"'), "publish script should block releases when directory data is stale");
assert.ok(publishScript.includes("shell: false"), "publish script should not pass deployment arguments through a shell");
assert.ok(
  publishScript.includes('"--branch"') && publishScript.includes("productionBranch"),
  "publish script should explicitly identify the Cloudflare production branch"
);
assert.ok(publishScript.includes('"--confirm-production"'), "production publish should require explicit production confirmation");
assert.ok(publishScript.includes('"--confirm-branch"'), "production publish should confirm the main branch");
assert.ok(publishScript.includes('"--confirm-commit"'), "production publish should confirm the full Git SHA");
assert.ok(
  publishScript.includes('"--confirm-artifact-sha256"'),
  "production publish should confirm the exact generated artifact"
);
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
  publishScript.includes("PRODUCTION_UPLOAD_TIMEOUT_MS = 45 * 60_000") &&
    publishScript.includes("timeout: PRODUCTION_UPLOAD_TIMEOUT_MS"),
  "large production uploads should have a sufficient but bounded timeout before reconciliation"
);
assert.ok(
  publishScript.includes("getDirectoryPack") && publishScript.includes("approvedProductionUrl"),
  "the production URL should exactly match the active reusable directory pack"
);
assert.ok(
  publishScript.includes("CLOUDFLARE_ACCOUNT_ID") && publishScript.includes("CLOUDFLARE_API_TOKEN"),
  "production verification should require private Cloudflare REST credentials"
);
assert.ok(
  publishScript.includes("process.env.npm_execpath") && publishScript.includes("run(process.execPath, [npmCli, ...args])"),
  "Windows release checks should invoke npm through Node instead of spawning npm.cmd"
);
assert.ok(!publishScript.includes('run("npm",'), "release checks should not use the Windows-fragile npm.cmd spawn path");
assert.ok(
  publishScript.includes("https://api.cloudflare.com/client/v4") &&
    publishScript.includes("?env=production&page=${page}&per_page=${perPage}"),
  "production verification should use full Cloudflare API deployment metadata"
);
assert.ok(
  !publishScript.includes("pages/projects/${encodeURIComponent(projectName)}/deployments?env=production&per_page=100"),
  "production verification should not request Cloudflare's rejected 100-deployment page size"
);
assert.ok(
  publishScript.includes("return collectPaginatedResults("),
  "production verification should traverse every Cloudflare deployment page"
);
assert.ok(
  publishScript.includes("retryCloudflareApiRead") && publishScript.includes("CLOUDFLARE_API_MAX_ATTEMPTS"),
  "transient Cloudflare API transport failures should use bounded read-only retries"
);
assert.ok(
  !publishScript.includes('"pages", "project", "list", "--json"') &&
    !publishScript.includes('"pages", "deployment", "list"'),
  "production verification should not trust Wrangler's abbreviated table-shaped JSON"
);
assert.ok(
  publishScript.includes("artifact-manifest.sha256") && publishScript.includes("aggregateSha256"),
  "release checks should create deterministic artifact evidence"
);
assert.ok(
  (publishScript.match(/run\("git", \["fetch", "--quiet", "origin", "main"\]\)/g)?.length ?? 0) >= 2,
  "production publish should fetch origin/main again after the lengthy local gates"
);
assert.ok(
  (publishScript.match(/githubChecks = loadGitHubChecks\(repositoryName,/g)?.length ?? 0) >= 2 &&
    publishScript.includes("filter=latest"),
  "production publish should reload the latest required checks immediately before upload"
);
assert.ok(
  publishScript.indexOf("runQualityGates();") <
      publishScript.indexOf("validateArtifactConfirmation(manifest", publishScript.indexOf("runQualityGates();")) &&
    publishScript.indexOf("validateArtifactConfirmation(manifest", publishScript.indexOf("runQualityGates();")) <
      publishScript.indexOf("runCaptured(process.execPath"),
  "artifact approval and fresh remote validation should gate Wrangler after the full local checks"
);
assert.ok(
  publishScript.includes("process.env.NEXT_BUILD_ID = head") &&
    publishScript.indexOf("process.env.NEXT_BUILD_ID = head") < publishScript.indexOf("runQualityGates();"),
  "release builds should use the exact confirmed commit as the deterministic Next.js build ID"
);
assert.ok(
  publishScript.includes("knownDeploymentIds") &&
    publishScript.includes("multiple new deployments match") &&
    publishScript.includes("releaseAttemptCommitMessage"),
  "post-upload reconciliation should accept exactly one newly created deployment from this upload attempt"
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
const failedDeployments = Array.from({ length: 25 }, (_, index) => ({
  environment: "production",
  id: `failed-${index}`,
  latest_stage: { status: "failure" },
  project_name: "directory"
}));
const requestedPages: number[] = [];
const paginationTest = collectPaginatedResults(async (page) => {
  requestedPages.push(page);
  if (page === 1) return failedDeployments;
  if (page === 2) return [rollback];
  return [];
}, 25);
let transientAttempts = 0;
const transientRetryTest = retryCloudflareApiRead(async () => {
  transientAttempts += 1;
  if (transientAttempts < 3) throw new TypeError("fetch failed");
  return "ok";
}, 3, 0);
let permanentAttempts = 0;
const permanentFailureTest = () =>
  retryCloudflareApiRead(async () => {
    permanentAttempts += 1;
    throw new Error("HTTP verification failed");
  }, 3, 0);
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
const expectedDeployment = { branch: "main", commit, commitMessage: "release", projectName: "directory" };
assert.equal(findDeploymentForCommit([deployed], expectedDeployment), deployed);
assert.equal(
  findDeploymentForCommit([deployed], {
    ...expectedDeployment,
    knownDeploymentIds: new Set([deployed.id]),
  }),
  undefined,
  "reconciliation must not accept a matching deployment that existed before upload"
);
const newlyDeployed = { ...deployed, id: "bbbbbbbb-cccc-dddd-eeee-ffffffffffff" };
assert.equal(
  findDeploymentForCommit([deployed, newlyDeployed], {
    ...expectedDeployment,
    knownDeploymentIds: new Set([deployed.id]),
  }),
  newlyDeployed
);
assert.throws(
  () =>
    findDeploymentForCommit([newlyDeployed, { ...newlyDeployed, id: "cccccccc-dddd-eeee-ffff-000000000000" }], {
      ...expectedDeployment,
      knownDeploymentIds: new Set(),
    }),
  /multiple new deployments match/
);
assert.equal(
  findDeploymentForCommit([{ ...deployed, environment: "preview" }], expectedDeployment),
  undefined
);
assert.equal(
  findDeploymentForCommit(
    [{ ...deployed, deployment_trigger: { metadata: { ...deployed.deployment_trigger.metadata, commit_dirty: true } } }],
    expectedDeployment
  ),
  undefined
);
assert.equal(
  findDeploymentForCommit(
    [{ ...deployed, deployment_trigger: { metadata: { ...deployed.deployment_trigger.metadata, commit_message: "other-attempt" } } }],
    expectedDeployment
  ),
  undefined,
  "a concurrent deployment for the same commit must not satisfy this upload attempt"
);

const releaseAttemptId = "12345678-1234-4123-8123-123456789abc";
assert.equal(buildReleaseAttemptCommitMessage(releaseAttemptId), `codex-release-attempt:${releaseAttemptId}`);
assert.throws(() => buildReleaseAttemptCommitMessage("not-a-uuid"), /lowercase UUID v4/);

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
  assert.doesNotThrow(() => validateArtifactConfirmation(firstManifest, firstManifest.aggregateSha256));
  assert.doesNotThrow(() => validateArtifactUnchanged(firstManifest, secondManifest));
  assert.throws(() => validateArtifactConfirmation(firstManifest, "a".repeat(64)), /does not match/);
  assert.throws(() => validateArtifactConfirmation(firstManifest, "not-a-sha"), /full lowercase artifact SHA-256/);
  assert.equal(firstManifest.fileCount, 2);
  assert.equal(firstManifest.totalBytes, 2);
  assert.match(firstManifest.aggregateSha256, /^[0-9a-f]{64}$/);
  assert.ok(firstManifest.lines[0]?.endsWith("  nested/a.txt"), "manifest paths should be sorted and portable");
  fs.writeFileSync(path.join(manifestRoot, "z.txt"), "changed", "utf8");
  const changedManifest = createArtifactManifest(manifestRoot);
  assert.notEqual(changedManifest.aggregateSha256, firstManifest.aggregateSha256);
  assert.throws(() => validateArtifactUnchanged(firstManifest, changedManifest), /artifact changed after approval/);
} finally {
  fs.rmSync(manifestRoot, { force: true, recursive: true });
}

const sensitive = redactSensitiveText(
  'Authorization: Bearer secret-token\n{"account_id":"private-account","token":"private-token"}\nCLOUDFLARE_API_TOKEN=private'
);
assert.ok(!sensitive.includes("secret-token") && !sensitive.includes("private-account") && !sensitive.includes("private-token"));
assert.ok(sensitive.includes("[REDACTED]"));

Promise.all([paginationTest, transientRetryTest]).then(([paginatedDeployments, retryResult]) => {
  assert.deepEqual(requestedPages, [1, 2]);
  assert.equal(selectRollbackDeployment(paginatedDeployments, rollback.id, "directory"), rollback);
  assert.equal(retryResult, "ok");
  assert.equal(transientAttempts, 3);
  return assert.rejects(permanentFailureTest(), /HTTP verification failed/);
}).then(() => {
  assert.equal(permanentAttempts, 1, "HTTP and policy failures must not be retried");
  console.log("Cloudflare publish tests passed");
});
