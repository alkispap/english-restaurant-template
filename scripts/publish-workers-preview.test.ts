import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  buildWorkersDeployArgs,
  normalizeSha256,
  validatePreviewRequest,
  validateWorkersPreviewConfig,
  WORKERS_PREVIEW_CONFIG,
  WORKERS_PREVIEW_NAME
} from "./publish-workers-preview";

const commit = "a".repeat(40);
const digest = "b".repeat(64);

assert.equal(normalizeSha256(`sha256:${digest}`), digest);
assert.throws(() => normalizeSha256("not-a-hash"), /SHA-256/);
assert.doesNotThrow(() =>
  validatePreviewRequest({
    artifactId: 123,
    artifactServiceDigest: digest,
    branch: "main",
    commit,
    repository: "alkispap/english-restaurant-template",
    workerName: WORKERS_PREVIEW_NAME
  })
);
assert.throws(
  () =>
    validatePreviewRequest({
      artifactId: 123,
      artifactServiceDigest: digest,
      branch: "main",
      commit,
      repository: "alkispap/english-restaurant-template",
      workerName: "another-worker"
    }),
  /unexpected Worker target/
);

const configPath = path.join(process.cwd(), WORKERS_PREVIEW_CONFIG);
assert.ok(fs.existsSync(configPath), "Workers preview config should exist");
const config = JSON.parse(fs.readFileSync(configPath, "utf8")) as Record<string, unknown>;
assert.doesNotThrow(() => validateWorkersPreviewConfig(config));
assert.equal(config.name, WORKERS_PREVIEW_NAME);
assert.equal(config.workers_dev, true);
assert.deepEqual(config.assets, { directory: "./out" });
assert.equal(config.route, undefined);
assert.equal(config.routes, undefined);
assert.deepEqual(buildWorkersDeployArgs("temporary-config.json", commit, 123), [
  "deploy",
  "--config",
  "temporary-config.json",
  "--message",
  `immutable-artifact:123:${commit}`
]);

const publisherSource = fs.readFileSync(path.join(process.cwd(), "scripts", "publish-workers-preview.ts"), "utf8");
assert.ok(publisherSource.includes('spawn("gh", ["api", "--method", "GET", endpoint]'), "the artifact ZIP should stream from gh api stdout");
assert.ok(!publisherSource.includes('"--output", archivePath'), "gh api must not use its unsupported --output flag");

const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8")) as { scripts?: Record<string, string> };
assert.equal(packageJson.scripts?.["publish:workers-preview"], "tsx scripts/publish-workers-preview.ts");

console.log("Workers preview publisher tests passed");
