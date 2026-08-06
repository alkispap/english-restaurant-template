import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createReleaseCandidateEvidence, validateReleaseCandidateEvidence } from "./release-artifact-evidence";
import { createArtifactManifest } from "./release-artifact-manifest";

const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "release-artifact-evidence-"));
const artifactDirectory = path.join(temporaryDirectory, "out");
fs.mkdirSync(path.join(artifactDirectory, "nested"), { recursive: true });
fs.writeFileSync(path.join(artifactDirectory, "index.html"), "candidate", "utf8");
fs.writeFileSync(path.join(artifactDirectory, "nested", "asset.txt"), "asset", "utf8");

try {
  const manifest = createArtifactManifest(artifactDirectory);
  const context = {
    branch: "main",
    commit: "a".repeat(40),
    createdAt: "2026-08-06T10:00:00.000Z",
    expiresAt: "2026-08-13T10:00:00.000Z",
    productionUrl: "https://indianrestaurantlondon.co.uk/"
  };
  const evidence = createReleaseCandidateEvidence(manifest, context);

  assert.equal(evidence.purpose, "non-production-candidate");
  assert.equal(evidence.build.buildId, context.commit);
  assert.equal(evidence.build.productionUrl, "https://indianrestaurantlondon.co.uk");
  const expected = {
    verifiedAt: "2026-08-07T10:00:00.000Z",
    branch: context.branch,
    commit: context.commit,
    productionUrl: context.productionUrl
  };
  validateReleaseCandidateEvidence(evidence, manifest, expected);

  assert.throws(
    () => validateReleaseCandidateEvidence(evidence, manifest, { ...expected, verifiedAt: "2026-08-14T10:00:00.000Z" }),
    /expired/
  );
  assert.throws(
    () => validateReleaseCandidateEvidence({ ...evidence, purpose: "production" as never }, manifest, expected),
    /not a non-production release candidate/
  );
  assert.throws(
    () => validateReleaseCandidateEvidence(evidence, manifest, { ...expected, commit: "b".repeat(40) }),
    /does not match the expected commit/
  );
  assert.throws(
    () => validateReleaseCandidateEvidence({} as never, manifest, expected),
    /incomplete/
  );

  fs.writeFileSync(path.join(artifactDirectory, "index.html"), "tampered", "utf8");
  const changedManifest = createArtifactManifest(artifactDirectory);
  assert.throws(
    () => validateReleaseCandidateEvidence(evidence, changedManifest, expected),
    /does not match/
  );
} finally {
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
}

console.log("release artifact evidence tests passed");
