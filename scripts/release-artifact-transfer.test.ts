import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { type ReleaseApprovalEnvelope } from "./release-approval-envelope";
import { createReleaseCandidateEvidence } from "./release-artifact-evidence";
import { createArtifactManifest, serializeArtifactManifest } from "./release-artifact-manifest";
import { verifyDownloadedArtifactTransfer } from "./release-artifact-transfer";

const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "release-artifact-transfer-"));
const artifactDirectory = path.join(temporaryDirectory, "out");
const evidenceDirectory = path.join(temporaryDirectory, "evidence");
const commit = "a".repeat(40);
const serviceDigest = "b".repeat(64);
fs.mkdirSync(artifactDirectory, { recursive: true });
fs.writeFileSync(path.join(artifactDirectory, "index.html"), "candidate", "utf8");

try {
  const manifest = createArtifactManifest(artifactDirectory);
  const candidate = createReleaseCandidateEvidence(manifest, {
    branch: "main", commit, createdAt: "2026-08-08T10:00:00.000Z", expiresAt: "2026-08-15T10:00:00.000Z", productionUrl: "https://indianrestaurantlondon.co.uk"
  });
  fs.mkdirSync(evidenceDirectory);
  fs.writeFileSync(path.join(evidenceDirectory, "artifact-manifest.sha256"), serializeArtifactManifest(manifest.lines));
  const rawCandidate = `${JSON.stringify(candidate, null, 2)}\n`;
  fs.writeFileSync(path.join(evidenceDirectory, "release-candidate.json"), rawCandidate);
  const approval: ReleaseApprovalEnvelope = {
    schemaVersion: 1, purpose: "production-artifact-approval", source: { branch: "main", commit },
    candidate: { artifactId: 123, artifactServiceDigest: serviceDigest, artifactAggregateSha256: manifest.aggregateSha256, candidateEvidenceSha256: createHash("sha256").update(rawCandidate).digest("hex"), expiresAt: candidate.validity.expiresAt },
    checks: [{ id: 1, name: "Fast quality gate", conclusion: "success", headSha: commit }, { id: 2, name: "Full static export and rendered benchmark", conclusion: "success", headSha: commit }],
    target: { project: "indian-restaurant-london", productionUrl: "https://indianrestaurantlondon.co.uk", productionBranch: "main", rollbackDeploymentId: "9a9a9a9a-1111-4aaa-8aaa-111111111111" },
    approval: { approvedAt: "2026-08-08T11:00:00.000Z", approvedBy: "maintainer", expiresAt: "2026-08-10T10:00:00.000Z" }
  };
  const expected = { artifactId: 123, artifactServiceDigest: serviceDigest, branch: "main" as const, commit, productionBranch: "main" as const, productionUrl: "https://indianrestaurantlondon.co.uk", project: "indian-restaurant-london", rollbackDeploymentId: approval.target.rollbackDeploymentId, verifiedAt: "2026-08-08T12:00:00.000Z" };
  const verified = verifyDownloadedArtifactTransfer({ approval, artifactDirectory, evidenceDirectory, expected, now: new Date(expected.verifiedAt) });
  assert.equal(verified.manifest.aggregateSha256, manifest.aggregateSha256);

  fs.writeFileSync(path.join(artifactDirectory, "index.html"), "tampered", "utf8");
  assert.throws(() => verifyDownloadedArtifactTransfer({ approval, artifactDirectory, evidenceDirectory, expected, now: new Date(expected.verifiedAt) }), /retained manifest does not match/);
} finally {
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
}

console.log("release artifact transfer tests passed");
