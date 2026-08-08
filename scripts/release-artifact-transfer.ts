import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  type ApprovalEnvelopeExpectation,
  type ReleaseApprovalEnvelope,
  validateReleaseApprovalEnvelope
} from "./release-approval-envelope";
import {
  type ReleaseCandidateEvidence,
  validateReleaseCandidateEvidence
} from "./release-artifact-evidence";
import { createArtifactManifest, serializeArtifactManifest } from "./release-artifact-manifest";

export type ArtifactTransferExpectation = Omit<ApprovalEnvelopeExpectation, "artifactAggregateSha256" | "candidateEvidenceSha256" | "candidateExpiresAt"> & {
  verifiedAt: string;
};

/**
 * Verifies a downloaded, immutable artifact tree before Phase 4 ever gives it to
 * a publisher. This function performs no network or hosting operation.
 */
export function verifyDownloadedArtifactTransfer(options: {
  approval: ReleaseApprovalEnvelope;
  artifactDirectory: string;
  evidenceDirectory: string;
  expected: ArtifactTransferExpectation;
  now?: Date;
}) {
  const artifactDirectory = path.resolve(options.artifactDirectory);
  const evidenceDirectory = path.resolve(options.evidenceDirectory);
  assert.ok(fs.existsSync(artifactDirectory), "Downloaded artifact directory is missing.");
  assert.ok(fs.existsSync(evidenceDirectory), "Downloaded candidate evidence directory is missing.");
  assert.notEqual(path.relative(artifactDirectory, evidenceDirectory), "", "Evidence directory must be outside the artifact directory.");
  assert.ok(
    path.relative(artifactDirectory, evidenceDirectory).startsWith("..") || path.isAbsolute(path.relative(artifactDirectory, evidenceDirectory)),
    "Evidence directory must be outside the artifact directory."
  );

  const evidencePath = path.join(evidenceDirectory, "release-candidate.json");
  const manifestPath = path.join(evidenceDirectory, "artifact-manifest.sha256");
  assert.ok(fs.existsSync(evidencePath), "Downloaded release candidate evidence is missing.");
  assert.ok(fs.existsSync(manifestPath), "Downloaded retained artifact manifest is missing.");

  const manifest = createArtifactManifest(artifactDirectory);
  const retainedManifest = fs.readFileSync(manifestPath, "utf8");
  assert.equal(retainedManifest, serializeArtifactManifest(manifest.lines), "Downloaded retained manifest does not match the artifact directory.");
  const rawEvidence = fs.readFileSync(evidencePath, "utf8");
  const evidence = JSON.parse(rawEvidence) as ReleaseCandidateEvidence;
  validateReleaseCandidateEvidence(evidence, manifest, {
    verifiedAt: options.expected.verifiedAt,
    branch: options.expected.branch,
    commit: options.expected.commit,
    productionUrl: options.expected.productionUrl
  });

  const candidateEvidenceSha256 = createHash("sha256").update(rawEvidence).digest("hex");
  validateReleaseApprovalEnvelope(
    options.approval,
    {
      ...options.expected,
      artifactAggregateSha256: manifest.aggregateSha256,
      candidateEvidenceSha256,
      candidateExpiresAt: evidence.validity.expiresAt
    },
    options.now
  );

  return { candidateEvidenceSha256, manifest };
}
