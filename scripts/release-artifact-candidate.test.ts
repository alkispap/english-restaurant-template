import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "release-artifact-candidate-cli-"));
const artifactDirectory = path.join(temporaryDirectory, "out");
const evidenceDirectory = path.join(temporaryDirectory, "evidence");
const cli = path.join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs");
const script = path.join(process.cwd(), "scripts", "release-artifact-candidate.ts");
const commit = "c".repeat(40);
const sharedOptions = [
  `--artifact=${artifactDirectory}`,
  `--evidence-directory=${evidenceDirectory}`,
  `--branch=main`,
  `--commit=${commit}`,
  "--production-url=https://indianrestaurantlondon.co.uk"
];

fs.mkdirSync(artifactDirectory, { recursive: true });
fs.writeFileSync(path.join(artifactDirectory, "index.html"), "candidate", "utf8");

try {
  const missing = run(["verify", ...sharedOptions, "--verified-at=2026-08-07T10:00:00.000Z"]);
  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, /evidence is missing/);

  const create = run([
    "create",
    ...sharedOptions,
    "--created-at=2026-08-06T10:00:00.000Z",
    "--expires-at=2026-08-13T10:00:00.000Z"
  ]);
  assert.equal(create.status, 0, create.stderr);
  assert.ok(fs.existsSync(path.join(evidenceDirectory, "release-candidate.json")));
  assert.ok(fs.existsSync(path.join(evidenceDirectory, "artifact-manifest.sha256")));

  const verify = run(["verify", ...sharedOptions, "--verified-at=2026-08-07T10:00:00.000Z"]);
  assert.equal(verify.status, 0, verify.stderr);
  assert.match(verify.stdout, /Verified non-production release candidate/);

  const wrongCommit = run([
    "verify",
    ...sharedOptions.filter((option) => !option.startsWith("--commit=")),
    `--commit=${"d".repeat(40)}`,
    "--verified-at=2026-08-07T10:00:00.000Z"
  ]);
  assert.notEqual(wrongCommit.status, 0);
  assert.match(wrongCommit.stderr, /does not match the expected commit/);

  fs.writeFileSync(path.join(artifactDirectory, "index.html"), "tampered", "utf8");
  const tampered = run(["verify", ...sharedOptions, "--verified-at=2026-08-07T10:00:00.000Z"]);
  assert.notEqual(tampered.status, 0);
  assert.match(tampered.stderr, /Retained manifest does not match/);
} finally {
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
}

console.log("release artifact candidate CLI tests passed");

function run(arguments_: string[]) {
  return spawnSync(process.execPath, [cli, script, ...arguments_], {
    cwd: process.cwd(),
    encoding: "utf8",
    shell: false
  });
}
