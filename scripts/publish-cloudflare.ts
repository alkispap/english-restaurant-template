import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDirectoryPack } from "../src/config/directory-packs";

const REQUIRED_CHECKS = ["Fast quality gate", "Full static export and rendered benchmark"] as const;
const FULL_COMMIT_PATTERN = /^[0-9a-f]{40}$/;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const RELEASE_ATTEMPT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const DEPLOYMENT_ID_PATTERN = /^[0-9a-f-]{8,}$/i;
const PRODUCTION_UPLOAD_TIMEOUT_MS = 15 * 60_000;
const CLOUDFLARE_API_MAX_ATTEMPTS = 3;
const CLOUDFLARE_API_RETRY_DELAY_MS = 1_000;

type CheckRun = {
  conclusion?: string | null;
  head_sha?: string;
  id?: number;
  name?: string;
};

type CloudflareDeployment = {
  deployment_trigger?: {
    metadata?: {
      branch?: string;
      commit_dirty?: boolean;
      commit_hash?: string;
      commit_message?: string;
    };
  };
  environment?: string;
  id?: string;
  latest_stage?: { status?: string };
  project_name?: string;
  url?: string;
};

type CloudflareProject = {
  name?: string;
  production_branch?: string;
  source?: unknown;
  subdomain?: string;
};

type CloudflareApiResponse<T> = {
  result?: T;
  success?: boolean;
};

type ReleaseContext = {
  branch: string;
  confirmedBranch?: string;
  confirmedCommit?: string;
  head: string;
  localMain: string;
  originMain: string;
  productionBranch: string;
};

export type ArtifactManifest = {
  aggregateSha256: string;
  fileCount: number;
  lines: string[];
  totalBytes: number;
};

export function validateReleaseContext(context: ReleaseContext) {
  assert.equal(context.productionBranch, "main", "Production publish refused: the configured production branch must be main.");
  assert.equal(context.confirmedBranch, "main", "Production publish refused: pass --confirm-branch=main.");
  assert.match(
    context.confirmedCommit || "",
    FULL_COMMIT_PATTERN,
    "Production publish refused: --confirm-commit must contain the full 40-character lowercase Git SHA."
  );
  assert.equal(context.branch, "main", "Production publish refused: production releases must run from the local main branch.");
  assert.equal(context.head, context.localMain, "Production publish refused: HEAD does not equal local main.");
  assert.equal(context.head, context.originMain, "Production publish refused: HEAD does not equal the freshly fetched origin/main.");
  assert.equal(context.head, context.confirmedCommit, "Production publish refused: HEAD does not equal --confirm-commit.");
}

export function validateRequiredChecks(checkRuns: CheckRun[], commit: string) {
  for (const requiredName of REQUIRED_CHECKS) {
    const matchingChecks = checkRuns.filter((check) => check.name === requiredName && check.head_sha === commit);
    assert.ok(matchingChecks.length > 0, `Production publish refused: required GitHub check \"${requiredName}\" is missing for ${commit}.`);
    assert.ok(
      matchingChecks.some((check) => check.conclusion === "success"),
      `Production publish refused: required GitHub check \"${requiredName}\" has not succeeded for ${commit}.`
    );
  }
}

export function validateArtifactConfirmation(manifest: ArtifactManifest, confirmedSha256?: string) {
  assert.match(
    confirmedSha256 || "",
    SHA256_PATTERN,
    "Production publish refused: --confirm-artifact-sha256 must contain the full lowercase artifact SHA-256."
  );
  assert.equal(
    manifest.aggregateSha256,
    confirmedSha256,
    "Production publish refused: the generated artifact does not match --confirm-artifact-sha256."
  );
}

export function validateArtifactUnchanged(expected: ArtifactManifest, current: ArtifactManifest) {
  assert.deepEqual(
    {
      aggregateSha256: current.aggregateSha256,
      fileCount: current.fileCount,
      totalBytes: current.totalBytes
    },
    {
      aggregateSha256: expected.aggregateSha256,
      fileCount: expected.fileCount,
      totalBytes: expected.totalBytes
    },
    "Production publish refused: the release artifact changed after approval."
  );
}

export function validateCloudflareProject(projects: CloudflareProject[], projectName: string, productionBranch: string) {
  const project = projects.find((candidate) => candidate.name === projectName);
  assert.ok(project, `Production publish refused: Cloudflare Pages project ${projectName} was not found.`);
  assert.equal(
    project.source ?? null,
    null,
    `Production publish refused: ${projectName} is Git-integrated; this guarded workflow supports Direct Upload only.`
  );
  assert.equal(
    project.production_branch,
    productionBranch,
    `Production publish refused: Cloudflare project production branch is ${project.production_branch || "unset"}, not ${productionBranch}.`
  );
  return project;
}

export async function collectPaginatedResults<T>(
  loadPage: (page: number) => Promise<T[]>,
  perPage: number
): Promise<T[]> {
  assert.ok(Number.isInteger(perPage) && perPage > 0, "Cloudflare pagination requires a positive integer page size.");
  const results: T[] = [];
  for (let page = 1; ; page += 1) {
    const pageResults = await loadPage(page);
    results.push(...pageResults);
    if (pageResults.length < perPage) return results;
  }
}

export async function retryCloudflareApiRead<T>(
  operation: () => Promise<T>,
  maxAttempts = CLOUDFLARE_API_MAX_ATTEMPTS,
  retryDelayMs = CLOUDFLARE_API_RETRY_DELAY_MS
): Promise<T> {
  assert.ok(Number.isInteger(maxAttempts) && maxAttempts > 0, "Cloudflare API retries require a positive attempt count.");
  assert.ok(retryDelayMs >= 0, "Cloudflare API retries require a non-negative delay.");
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      const retryable = error instanceof TypeError || (error instanceof Error && error.name === "AbortError");
      if (!retryable || attempt >= maxAttempts) throw error;
      console.warn(`Cloudflare API read hit a transient network error; retrying (${attempt}/${maxAttempts}).`);
      if (retryDelayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }
  }
}

export function selectRollbackDeployment(
  deployments: CloudflareDeployment[],
  confirmedDeploymentId: string,
  projectName: string
) {
  assert.match(
    confirmedDeploymentId,
    DEPLOYMENT_ID_PATTERN,
    "Production publish refused: --confirm-previous-deployment is not a valid deployment identifier."
  );
  const successfulProduction = deployments.filter(
    (deployment) => deployment.environment === "production" && deployment.latest_stage?.status === "success"
  );
  assert.ok(successfulProduction.length > 0, "Production publish refused: no successful production rollback target exists.");
  const current = successfulProduction[0];
  assert.equal(
    current.id,
    confirmedDeploymentId,
    "Production publish refused: the confirmed rollback target is not the current successful production deployment."
  );
  assert.equal(
    current.project_name || projectName,
    projectName,
    "Production publish refused: the rollback target belongs to a different Cloudflare project."
  );
  return current;
}

export function findDeploymentForCommit(
  deployments: CloudflareDeployment[],
  expected: {
    branch: string;
    commit: string;
    commitMessage: string;
    knownDeploymentIds?: ReadonlySet<string>;
    projectName: string;
  }
) {
  const matches = deployments.filter(
    (deployment) =>
      Boolean(deployment.id) &&
      !expected.knownDeploymentIds?.has(deployment.id as string) &&
      deployment.environment === "production" &&
      deployment.latest_stage?.status === "success" &&
      deployment.project_name === expected.projectName &&
      deployment.deployment_trigger?.metadata?.branch === expected.branch &&
      deployment.deployment_trigger?.metadata?.commit_hash === expected.commit &&
      deployment.deployment_trigger?.metadata?.commit_message === expected.commitMessage &&
      deployment.deployment_trigger?.metadata?.commit_dirty === false
  );
  assert.ok(
    matches.length <= 1,
    "Production deployment is indeterminate because multiple new deployments match the confirmed commit."
  );
  return matches[0];
}

export function buildReleaseAttemptCommitMessage(releaseAttemptId: string) {
  assert.match(releaseAttemptId, RELEASE_ATTEMPT_ID_PATTERN, "Release attempt ID must be a lowercase UUID v4.");
  return `codex-release-attempt:${releaseAttemptId}`;
}

export function buildDeployArgs(options: {
  branch: string;
  commit: string;
  commitMessage: string;
  projectName: string;
}) {
  return [
    "pages",
    "deploy",
    "out",
    "--project-name",
    options.projectName,
    "--branch",
    options.branch,
    "--commit-hash",
    options.commit,
    "--commit-message",
    options.commitMessage,
    "--commit-dirty=false"
  ];
}

export function createArtifactManifest(root: string): ArtifactManifest {
  assert.ok(fs.existsSync(root), `Release artifact directory does not exist: ${root}`);
  const files = listFiles(root).sort((left, right) => left.localeCompare(right, "en"));
  let totalBytes = 0;
  const lines = files.map((file) => {
    const content = fs.readFileSync(file);
    totalBytes += content.byteLength;
    const relativePath = path.relative(root, file).split(path.sep).join("/");
    return `${createHash("sha256").update(content).digest("hex")}  ${relativePath}`;
  });
  const serialized = lines.length > 0 ? `${lines.join("\n")}\n` : "";
  return {
    aggregateSha256: createHash("sha256").update(serialized).digest("hex"),
    fileCount: files.length,
    lines,
    totalBytes
  };
}

export function redactSensitiveText(value: string) {
  return value
    .replace(/(Authorization:\s*Bearer\s+)[^\s"']+/gi, "$1[REDACTED]")
    .replace(/(["']?(?:account_id|accountId|token|api_token)["']?\s*[:=]\s*["'])[^"']+/gi, "$1[REDACTED]")
    .replace(/(CLOUDFLARE_API_TOKEN\s*=\s*)[^\s]+/gi, "$1[REDACTED]");
}

async function main() {
  const checksOnly = process.argv.includes("--checks-only");
  const projectName = process.env.CLOUDFLARE_PROJECT_NAME?.trim();
  const productionBranch = process.env.CLOUDFLARE_PRODUCTION_BRANCH?.trim() || "main";
  const productionUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const approvedProductionUrl = getDirectoryPack().productionUrl.replace(/\/$/, "");
  const cloudflareAccountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const cloudflareApiToken = process.env.CLOUDFLARE_API_TOKEN?.trim();
  const confirmedProject = readOption("--confirm-project");
  const confirmedBranch = readOption("--confirm-branch");
  const confirmedCommit = readOption("--confirm-commit");
  const confirmedArtifactSha256 = readOption("--confirm-artifact-sha256");
  const confirmedPreviousDeployment = readOption("--confirm-previous-deployment");
  const productionConfirmed = process.argv.includes("--confirm-production");
  const wranglerCli = path.join(process.cwd(), "node_modules", "wrangler", "bin", "wrangler.js");

  assert.match(productionBranch, /^[A-Za-z0-9._/-]+$/, "CLOUDFLARE_PRODUCTION_BRANCH contains unsupported characters.");
  assert.ok(
    fs.existsSync(wranglerCli),
    "Project-local Wrangler is missing. Run npm ci in an isolated release checkout; cached or global installations are not accepted."
  );

  assertCleanWorktree("before release checks");
  const branch = capture("git", ["branch", "--show-current"]);
  const head = capture("git", ["rev-parse", "HEAD"]);
  process.env.NEXT_BUILD_ID = head;
  const commitMessage = capture("git", ["log", "-1", "--pretty=%s"]);
  const releaseAttemptId = checksOnly ? null : randomUUID();
  const releaseAttemptCommitMessage = releaseAttemptId ? buildReleaseAttemptCommitMessage(releaseAttemptId) : commitMessage;
  const wranglerVersion = capture(process.execPath, [wranglerCli, "--version"]);

  let project: CloudflareProject | undefined;
  let rollbackDeployment: CloudflareDeployment | undefined;
  let githubChecks: CheckRun[] = [];
  let knownDeploymentIds = new Set<string>();
  let repositoryName = "";

  if (!checksOnly) {
    assert.ok(productionConfirmed, "Production publish refused. Re-run with --confirm-production after explicit approval.");
    assert.ok(projectName, "Set CLOUDFLARE_PROJECT_NAME before publishing to Cloudflare Pages.");
    assert.match(projectName, /^[a-z0-9][a-z0-9-]*$/, "CLOUDFLARE_PROJECT_NAME contains unsupported characters.");
    assert.equal(
      confirmedProject,
      projectName,
      `Production publish refused. Re-run with --confirm-project=${projectName} to confirm the exact Cloudflare target.`
    );
    assert.ok(productionUrl, "Set NEXT_PUBLIC_SITE_URL to the approved production HTTPS URL before publishing.");
    assert.match(productionUrl, /^https:\/\/[^/]+\/?$/, "NEXT_PUBLIC_SITE_URL must be an HTTPS production origin without a path.");
    assert.ok(!/localhost|127\.0\.0\.1|\.example(?:\/|$)/i.test(productionUrl), "NEXT_PUBLIC_SITE_URL is not a production origin.");
    assert.equal(
      productionUrl.replace(/\/$/, ""),
      approvedProductionUrl,
      `Production publish refused: NEXT_PUBLIC_SITE_URL must equal the active directory pack URL ${approvedProductionUrl}.`
    );
    assert.match(
      cloudflareAccountId || "",
      /^[0-9a-f]{32}$/i,
      "Production publish refused: set CLOUDFLARE_ACCOUNT_ID privately for exact Cloudflare API verification."
    );
    assert.ok(
      cloudflareApiToken && cloudflareApiToken.length >= 20,
      "Production publish refused: set CLOUDFLARE_API_TOKEN privately for exact Cloudflare API verification."
    );

    run("git", ["fetch", "--quiet", "origin", "main"]);
    const localMain = capture("git", ["rev-parse", "refs/heads/main"]);
    const originMain = capture("git", ["rev-parse", "refs/remotes/origin/main"]);
    validateReleaseContext({ branch, confirmedBranch, confirmedCommit, head, localMain, originMain, productionBranch });
    run("git", ["merge-base", "--is-ancestor", head, originMain]);

    const repository = parseJson<{ nameWithOwner?: string }>(capture("gh", ["repo", "view", "--json", "nameWithOwner"]));
    assert.ok(repository.nameWithOwner, "Production publish refused: GitHub repository identity could not be resolved.");
    repositoryName = repository.nameWithOwner;
    githubChecks = loadGitHubChecks(repositoryName, head);
    validateRequiredChecks(githubChecks, head);

    const projectResponse = await cloudflareApi<CloudflareProject>(
      `/accounts/${cloudflareAccountId}/pages/projects/${encodeURIComponent(projectName)}`,
      cloudflareApiToken
    );
    project = validateCloudflareProject(projectResponse ? [projectResponse] : [], projectName, productionBranch);
    const productionDeployments = await listProductionDeployments(
      cloudflareAccountId as string,
      cloudflareApiToken as string,
      projectName
    );
    rollbackDeployment = selectRollbackDeployment(
      productionDeployments,
      confirmedPreviousDeployment || "",
      projectName
    );
  } else if (confirmedCommit) {
    assert.match(confirmedCommit, FULL_COMMIT_PATTERN, "--confirm-commit must contain a full lowercase Git SHA.");
    assert.equal(head, confirmedCommit, "HEAD does not equal --confirm-commit.");
  }

  console.log(checksOnly ? "\nCloudflare release checks" : "\nCloudflare production release");
  console.log(`Project: ${projectName || "not required for checks-only mode"}`);
  console.log(`Production branch: ${productionBranch}`);
  console.log(`Source: ${branch || "detached HEAD"} @ ${head}`);
  console.log(`Next.js build ID: ${head}`);
  console.log(`Wrangler: ${wranglerVersion}`);

  runQualityGates();
  assertCleanWorktree("after release checks and static export");

  const manifest = createArtifactManifest(path.join(process.cwd(), "out"));
  if (!checksOnly) {
    validateArtifactConfirmation(manifest, confirmedArtifactSha256);

    run("git", ["fetch", "--quiet", "origin", "main"]);
    const freshBranch = capture("git", ["branch", "--show-current"]);
    const freshHead = capture("git", ["rev-parse", "HEAD"]);
    const freshLocalMain = capture("git", ["rev-parse", "refs/heads/main"]);
    const freshOriginMain = capture("git", ["rev-parse", "refs/remotes/origin/main"]);
    validateReleaseContext({
      branch: freshBranch,
      confirmedBranch,
      confirmedCommit,
      head: freshHead,
      localMain: freshLocalMain,
      originMain: freshOriginMain,
      productionBranch
    });

    githubChecks = loadGitHubChecks(repositoryName, freshHead);
    validateRequiredChecks(githubChecks, freshHead);

    const freshProjectResponse = await cloudflareApi<CloudflareProject>(
      `/accounts/${cloudflareAccountId}/pages/projects/${encodeURIComponent(projectName as string)}`,
      cloudflareApiToken as string
    );
    project = validateCloudflareProject(freshProjectResponse ? [freshProjectResponse] : [], projectName as string, productionBranch);
    const freshProductionDeployments = await listProductionDeployments(
      cloudflareAccountId as string,
      cloudflareApiToken as string,
      projectName as string
    );
    rollbackDeployment = selectRollbackDeployment(
      freshProductionDeployments,
      confirmedPreviousDeployment || "",
      projectName as string
    );
    knownDeploymentIds = new Set(
      freshProductionDeployments
        .map((deployment) => deployment.id)
        .filter((id): id is string => Boolean(id))
    );

    assertCleanWorktree("immediately before production upload");
    validateArtifactUnchanged(manifest, createArtifactManifest(path.join(process.cwd(), "out")));
  }

  const evidenceDirectory = createEvidenceDirectory();
  fs.writeFileSync(path.join(evidenceDirectory, "artifact-manifest.sha256"), `${manifest.lines.join("\n")}\n`);
  writeEvidence(path.join(evidenceDirectory, "preflight.json"), {
    artifact: {
      aggregateSha256: manifest.aggregateSha256,
      fileCount: manifest.fileCount,
      totalBytes: manifest.totalBytes
    },
    branch,
    checksOnly,
    commit: head,
    githubChecks: githubChecks
      .filter((check) => REQUIRED_CHECKS.includes(check.name as (typeof REQUIRED_CHECKS)[number]))
      .map((check) => ({ conclusion: check.conclusion, id: check.id, name: check.name })),
    operator: process.env.USERNAME || captureOptional("git", ["config", "user.name"]) || "unknown",
    project: project ? { name: project.name, productionBranch: project.production_branch, type: "direct-upload" } : null,
    productionUrl: productionUrl || null,
    rollbackTarget: summarizeDeployment(rollbackDeployment),
    releaseAttemptId,
    sourceCommitMessage: commitMessage,
    timestamp: new Date().toISOString(),
    wranglerVersion
  });

  console.log(`Artifact: ${manifest.fileCount.toLocaleString()} files, ${manifest.totalBytes.toLocaleString()} bytes`);
  console.log(`Artifact SHA-256: ${manifest.aggregateSha256}`);
  console.log(`Evidence: ${evidenceDirectory}`);

  if (checksOnly) {
    console.log("\nRelease checks passed. No files were uploaded.");
    return;
  }

  const deployArgs = buildDeployArgs({
    branch: productionBranch,
    commit: head,
    commitMessage: releaseAttemptCommitMessage,
    projectName: projectName as string
  });
  const upload = runCaptured(process.execPath, [wranglerCli, ...deployArgs]);
  let reconciledDeployments: CloudflareDeployment[];
  try {
    reconciledDeployments = await listProductionDeployments(
      cloudflareAccountId as string,
      cloudflareApiToken as string,
      projectName as string
    );
  } catch (error) {
    writeEvidence(path.join(evidenceDirectory, "deployment.json"), {
      status: "indeterminate-reconciliation-failed",
      timestamp: new Date().toISOString()
    });
    throw new Error(
      "Production deployment is indeterminate because Cloudflare deployment-history reconciliation failed. " +
        "Do not retry the upload; restore read access and reconcile the confirmed commit first.",
      { cause: error }
    );
  }
  const deployed = findDeploymentForCommit(reconciledDeployments, {
    branch: productionBranch,
    commit: head,
    commitMessage: releaseAttemptCommitMessage,
    knownDeploymentIds,
    projectName: projectName as string
  });

  if (!deployed) {
    writeEvidence(path.join(evidenceDirectory, "deployment.json"), {
      status: "indeterminate",
      timestamp: new Date().toISOString()
    });
    throw new Error(
      `Production deployment is indeterminate after Wrangler exited with ${upload.status ?? "no status"}. ` +
        "Do not retry. Reconcile Cloudflare deployment history for the confirmed commit first."
    );
  }

  writeEvidence(path.join(evidenceDirectory, "deployment.json"), {
    artifactSha256: manifest.aggregateSha256,
    branch: productionBranch,
    commit: head,
    deployment: summarizeDeployment(deployed),
    project: projectName,
    releaseAttemptId,
    status: upload.status === 0 ? "verified" : "recovered-after-command-failure",
    timestamp: new Date().toISOString()
  });
  console.log(`\nVerified production deployment: ${deployed.id} (${deployed.url})`);
  if (upload.status !== 0) {
    console.warn("Wrangler returned a failure after Cloudflare created the verified deployment; no retry was attempted.");
  }
}

function runQualityGates() {
  const commands = [
    "typecheck",
    "test",
    "lint",
    "audit:dependencies",
    "audit:publication",
    "audit:freshness",
    "audit:seo",
    "audit:indexation",
    "audit:links",
    "audit:template",
    "build"
  ];
  for (const command of commands) {
    runNpm(["run", command]);
  }
  runNpm(["run", "prepare:cloudflare"]);
}

function runNpm(args: string[]) {
  const npmCli = process.env.npm_execpath?.trim();
  assert.ok(
    npmCli && fs.existsSync(npmCli),
    "Release checks must be launched through an npm script so npm_execpath identifies the locked npm CLI."
  );
  run(process.execPath, [npmCli, ...args]);
}

function loadGitHubChecks(repositoryName: string, commit: string) {
  const response = parseJson<{ check_runs?: CheckRun[] }>(
    capture("gh", ["api", `repos/${repositoryName}/commits/${commit}/check-runs?per_page=100&filter=latest`])
  );
  return response.check_runs || [];
}

async function listProductionDeployments(accountId: string, apiToken: string, projectName: string) {
  const perPage = 25;
  return collectPaginatedResults(
    (page) =>
      cloudflareApi<CloudflareDeployment[]>(
        `/accounts/${accountId}/pages/projects/${encodeURIComponent(projectName)}/deployments?env=production&page=${page}&per_page=${perPage}`,
        apiToken
      ),
    perPage
  );
}

async function cloudflareApi<T>(pathname: string, apiToken: string): Promise<T> {
  return retryCloudflareApiRead(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      const response = await fetch(`https://api.cloudflare.com/client/v4${pathname}`, {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json"
        },
        method: "GET",
        signal: controller.signal
      });
      assert.ok(response.ok, `Cloudflare API verification failed with HTTP ${response.status}; no production upload was attempted.`);
      const payload = (await response.json()) as CloudflareApiResponse<T>;
      assert.equal(payload.success, true, "Cloudflare API verification failed; no production upload was attempted.");
      assert.ok(payload.result, "Cloudflare API verification returned no result; no production upload was attempted.");
      return payload.result;
    } finally {
      clearTimeout(timeout);
    }
  });
}

function summarizeDeployment(deployment?: CloudflareDeployment) {
  if (!deployment) return null;
  return {
    branch: deployment.deployment_trigger?.metadata?.branch || null,
    commit: deployment.deployment_trigger?.metadata?.commit_hash || null,
    commitMessage: deployment.deployment_trigger?.metadata?.commit_message || null,
    environment: deployment.environment || null,
    id: deployment.id || null,
    status: deployment.latest_stage?.status || null,
    url: deployment.url || null
  };
}

function createEvidenceDirectory() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const directory = path.join(process.cwd(), ".codex-local", "evidence", `production-release-${timestamp}`);
  fs.mkdirSync(directory, { recursive: true });
  return directory;
}

function writeEvidence(file: string, value: unknown) {
  const serialized = redactSensitiveText(`${JSON.stringify(value, null, 2)}\n`);
  fs.writeFileSync(file, serialized, "utf8");
}

function listFiles(root: string): string[] {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(root, entry.name);
    return entry.isDirectory() ? listFiles(target) : [target];
  });
}

function readOption(name: string) {
  const equalsPrefix = `${name}=`;
  const equalsValue = process.argv.slice(2).find((argument) => argument.startsWith(equalsPrefix));
  if (equalsValue) return equalsValue.slice(equalsPrefix.length).trim();
  const optionIndex = process.argv.indexOf(name, 2);
  return optionIndex >= 0 ? process.argv[optionIndex + 1]?.trim() : undefined;
}

function assertCleanWorktree(stage: string) {
  const status = capture("git", ["status", "--porcelain", "--untracked-files=all"]);
  assert.equal(
    status,
    "",
    `Production publish refused because the Git worktree is not clean ${stage}. Commit or intentionally remove the listed changes:\n${status}`
  );
}

function parseJson<T>(value: string): T {
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    throw new Error(`Command returned invalid JSON: ${redactSensitiveText(value.slice(0, 500))}`, { cause: error });
  }
}

function capture(command: string, args: string[]) {
  const result = spawnSync(platformCommand(command), args, { encoding: "utf8", shell: false });
  if (result.error) throw result.error;
  assert.equal(
    result.status,
    0,
    `${command} ${args.join(" ")} failed.\n${redactSensitiveText(result.stderr?.trim() || result.stdout?.trim() || "No command output.")}`
  );
  return result.stdout.trim();
}

function captureOptional(command: string, args: string[]) {
  const result = spawnSync(platformCommand(command), args, { encoding: "utf8", shell: false });
  return result.status === 0 ? result.stdout.trim() : "";
}

function run(command: string, args: string[]) {
  const display = `${command} ${args.join(" ")}`;
  console.log(`\n> ${display}`);
  const result = spawnSync(platformCommand(command), args, { stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${display} failed with exit code ${result.status ?? 1}.`);
}

function runCaptured(command: string, args: string[]) {
  const display = `${command} ${args.join(" ")}`;
  console.log(`\n> ${display}`);
  const result = spawnSync(platformCommand(command), args, {
    encoding: "utf8",
    shell: false,
    timeout: PRODUCTION_UPLOAD_TIMEOUT_MS,
    windowsHide: true
  });
  const stdout = redactSensitiveText(result.stdout || "");
  const stderr = redactSensitiveText(result.stderr || "");
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
  if (result.error) console.error(redactSensitiveText(result.error.message));
  return result;
}

function platformCommand(command: string) {
  return command;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.stack || error.message : String(error);
    console.error(redactSensitiveText(message));
    process.exitCode = 1;
  });
}
