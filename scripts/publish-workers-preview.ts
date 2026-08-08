import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDirectoryPack } from "../src/config/directory-packs";
import { type ReleaseCandidateEvidence, validateReleaseCandidateEvidence } from "./release-artifact-evidence";
import { createArtifactManifest, serializeArtifactManifest } from "./release-artifact-manifest";

const FULL_COMMIT_PATTERN = /^[0-9a-f]{40}$/;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
export const WORKERS_PREVIEW_NAME = "indianrestaurantlondon-workers";
export const WORKERS_PREVIEW_CONFIG = "wrangler.workers.jsonc";

type PreviewRequest = {
  artifactId: number;
  artifactServiceDigest: string;
  branch: string;
  commit: string;
  repository: string;
  workerName: string;
};

type ArtifactMetadata = {
  digest?: string;
  expired?: boolean;
  id?: number;
  workflow_run?: { head_branch?: string; head_sha?: string };
};

type WorkersConfig = {
  assets?: { directory?: string };
  name?: string;
  route?: unknown;
  routes?: unknown;
  workers_dev?: boolean;
};

export function normalizeSha256(value: string) {
  const normalized = value.trim().replace(/^sha256:/i, "");
  assert.match(normalized, SHA256_PATTERN, "Artifact digest must be a SHA-256.");
  return normalized;
}

export function validatePreviewRequest(request: PreviewRequest) {
  assert.ok(Number.isSafeInteger(request.artifactId) && request.artifactId > 0, "Preview publish requires a positive artifact ID.");
  normalizeSha256(request.artifactServiceDigest);
  assert.equal(request.branch, "main", "Preview publish accepts candidates from main only.");
  assert.match(request.commit, FULL_COMMIT_PATTERN, "Preview publish requires a full lowercase Git SHA.");
  assert.match(request.repository, /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/, "Preview publish requires owner/repository.");
  assert.equal(request.workerName, WORKERS_PREVIEW_NAME, "Preview publish refuses an unexpected Worker target.");
}

export function validateWorkersPreviewConfig(config: WorkersConfig) {
  assert.equal(config.name, WORKERS_PREVIEW_NAME, "Workers preview config has an unexpected name.");
  assert.equal(config.workers_dev, true, "Workers preview config must publish only to workers.dev.");
  assert.equal(config.route, undefined, "Workers preview config must not define a custom-domain route.");
  assert.equal(config.routes, undefined, "Workers preview config must not define custom-domain routes.");
  assert.equal(config.assets?.directory, "./out", "Workers preview config must serve the downloaded out directory.");
}

export function buildWorkersDeployArgs(configPath: string, commit: string, artifactId: number) {
  assert.match(commit, FULL_COMMIT_PATTERN, "Worker deploy requires a full lowercase Git SHA.");
  assert.ok(Number.isSafeInteger(artifactId) && artifactId > 0, "Worker deploy requires a positive artifact ID.");
  return ["deploy", "--config", configPath, "--message", `immutable-artifact:${artifactId}:${commit}`];
}

async function main() {
  const request: PreviewRequest = {
    artifactId: Number.parseInt(required("--artifact-id"), 10),
    artifactServiceDigest: required("--artifact-service-digest"),
    branch: required("--branch"),
    commit: required("--commit"),
    repository: required("--repository"),
    workerName: required("--confirm-preview-worker")
  };
  validatePreviewRequest(request);
  assert.ok(process.argv.includes("--confirm-preview"), "Preview publish refused. Pass --confirm-preview after reviewing the exact artifact ID and digest.");
  assert.ok(!process.argv.includes("--confirm-production"), "Workers preview publisher never accepts a production confirmation.");
  assert.match(process.env.CLOUDFLARE_ACCOUNT_ID?.trim() || "", /^[0-9a-f]{32}$/i, "Set CLOUDFLARE_ACCOUNT_ID privately before preview publishing.");
  assert.ok((process.env.CLOUDFLARE_API_TOKEN?.trim().length || 0) >= 20, "Set CLOUDFLARE_API_TOKEN privately before preview publishing.");

  const head = capture("git", ["rev-parse", "HEAD"]);
  assert.equal(head, request.commit, "Preview publish refuses an artifact that does not match the checked-out commit.");
  assert.equal(capture("git", ["branch", "--show-current"]), "main", "Preview publish must run from local main.");
  assertCleanWorktree();

  const configPath = path.join(process.cwd(), WORKERS_PREVIEW_CONFIG);
  assert.ok(fs.existsSync(configPath), `Workers preview config is missing: ${WORKERS_PREVIEW_CONFIG}`);
  const config = JSON.parse(fs.readFileSync(configPath, "utf8")) as WorkersConfig;
  validateWorkersPreviewConfig(config);

  const artifact = parseJson<ArtifactMetadata>(capture("gh", ["api", `repos/${request.repository}/actions/artifacts/${request.artifactId}`]));
  assert.equal(artifact.id, request.artifactId, "GitHub returned a different artifact ID.");
  assert.equal(artifact.expired, false, "Preview publish refuses an expired artifact.");
  assert.equal(normalizeSha256(artifact.digest || ""), normalizeSha256(request.artifactServiceDigest), "GitHub artifact digest does not match the confirmed digest.");
  assert.equal(artifact.workflow_run?.head_sha, request.commit, "GitHub artifact does not belong to the confirmed commit.");
  assert.equal(artifact.workflow_run?.head_branch, request.branch, "GitHub artifact does not belong to the confirmed branch.");

  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "workers-preview-artifact-"));
  try {
    const archivePath = path.join(temporaryRoot, "candidate.zip");
    const downloadRoot = path.join(temporaryRoot, "downloaded");
    fs.mkdirSync(downloadRoot);
    await downloadArtifactArchive(`repos/${request.repository}/actions/artifacts/${request.artifactId}/zip`, archivePath);
    run("tar", ["-xf", archivePath, "-C", downloadRoot]);

    const artifactDirectory = path.join(downloadRoot, "out");
    const evidenceDirectory = path.join(downloadRoot, "evidence");
    verifyCandidate({ artifactDirectory, evidenceDirectory, request });

    const temporaryConfigPath = path.join(temporaryRoot, WORKERS_PREVIEW_CONFIG);
    fs.writeFileSync(
      temporaryConfigPath,
      `${JSON.stringify({ ...config, assets: { directory: "./downloaded/out" } }, null, 2)}\n`,
      "utf8"
    );
    const wranglerCli = path.join(process.cwd(), "node_modules", "wrangler", "bin", "wrangler.js");
    assert.ok(fs.existsSync(wranglerCli), "Project-local Wrangler is missing. Run npm ci before preview publishing.");
    console.log(`Publishing verified artifact ${request.artifactId} to ${WORKERS_PREVIEW_NAME}.workers.dev only.`);
    run(process.execPath, [wranglerCli, ...buildWorkersDeployArgs(temporaryConfigPath, request.commit, request.artifactId)]);
  } finally {
    fs.rmSync(temporaryRoot, { force: true, recursive: true });
  }
}

function verifyCandidate(options: { artifactDirectory: string; evidenceDirectory: string; request: PreviewRequest }) {
  assert.ok(fs.existsSync(options.artifactDirectory), "Downloaded artifact directory is missing.");
  assert.ok(fs.existsSync(options.evidenceDirectory), "Downloaded candidate evidence directory is missing.");
  const manifest = createArtifactManifest(options.artifactDirectory);
  const retainedManifest = fs.readFileSync(path.join(options.evidenceDirectory, "artifact-manifest.sha256"), "utf8");
  assert.equal(retainedManifest, serializeArtifactManifest(manifest.lines), "Downloaded artifact manifest does not match its contents.");
  const rawEvidence = fs.readFileSync(path.join(options.evidenceDirectory, "release-candidate.json"), "utf8");
  const evidence = JSON.parse(rawEvidence) as ReleaseCandidateEvidence;
  validateReleaseCandidateEvidence(evidence, manifest, {
    verifiedAt: new Date().toISOString(),
    branch: options.request.branch,
    commit: options.request.commit,
    productionUrl: getDirectoryPack().productionUrl
  });
  console.log(`Verified downloaded candidate: ${manifest.aggregateSha256}`);
  console.log(`Candidate evidence SHA-256: ${createHash("sha256").update(rawEvidence).digest("hex")}`);
}

async function downloadArtifactArchive(endpoint: string, archivePath: string) {
  await new Promise<void>((resolve, reject) => {
    const result = spawn("gh", ["api", "--method", "GET", endpoint], {
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true
    });
    const destination = fs.createWriteStream(archivePath);
    let stderr = "";
    let closed = false;
    let finished = false;
    let exitCode: number | null = null;
    const complete = () => {
      if (!closed || !finished) return;
      if (exitCode === 0) {
        resolve();
      } else {
        reject(new Error(`gh api ${endpoint} failed with exit code ${exitCode ?? 1}.\n${stderr.trim() || "No command output."}`));
      }
    };

    result.stdout.pipe(destination);
    result.stderr.setEncoding("utf8");
    result.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    result.once("error", reject);
    destination.once("error", reject);
    result.once("close", (code) => {
      exitCode = code;
      closed = true;
      complete();
    });
    destination.once("finish", () => {
      finished = true;
      complete();
    });
  });
}

function required(name: string) {
  const value = process.argv.slice(2).find((argument) => argument.startsWith(`${name}=`))?.slice(name.length + 1).trim();
  assert.ok(value, `Missing required option ${name}=<value>.`);
  return value;
}

function assertCleanWorktree() {
  assert.equal(capture("git", ["status", "--porcelain", "--untracked-files=all"]), "", "Preview publish requires a clean worktree.");
}

function parseJson<T>(value: string) {
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    throw new Error(`Command returned invalid JSON: ${value.slice(0, 500)}`, { cause: error });
  }
}

function capture(command: string, args: string[]) {
  const result = spawnSync(command, args, { encoding: "utf8", shell: false, windowsHide: true });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `${command} ${args.join(" ")} failed.\n${result.stderr?.trim() || result.stdout.trim() || "No command output."}`);
  return result.stdout.trim();
}

function run(command: string, args: string[]) {
  console.log(`\n> ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, { shell: false, stdio: "inherit", windowsHide: true });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `${command} failed with exit code ${result.status ?? 1}.`);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.stack || error.message : String(error));
    process.exitCode = 1;
  });
}
