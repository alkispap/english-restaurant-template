import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import type { ArtifactManifest } from "./release-artifact-manifest";
import { serializeArtifactManifest } from "./release-artifact-manifest";

const FULL_COMMIT_PATTERN = /^[0-9a-f]{40}$/;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;

export const RELEASE_CANDIDATE_SCHEMA_VERSION = 1 as const;
export const RELEASE_CANDIDATE_PURPOSE = "non-production-candidate" as const;

export type ReleaseCandidateEvidence = {
  schemaVersion: typeof RELEASE_CANDIDATE_SCHEMA_VERSION;
  purpose: typeof RELEASE_CANDIDATE_PURPOSE;
  source: {
    branch: string;
    commit: string;
  };
  build: {
    buildId: string;
    productionUrl: string;
  };
  artifact: {
    aggregateSha256: string;
    fileCount: number;
    manifestFile: "artifact-manifest.sha256";
    manifestSha256: string;
    totalBytes: number;
  };
  validity: {
    createdAt: string;
    expiresAt: string;
  };
};

type CandidateContext = {
  branch: string;
  commit: string;
  createdAt: string;
  expiresAt: string;
  productionUrl: string;
};

type CandidateExpectation = {
  verifiedAt: string;
  branch: string;
  commit: string;
  productionUrl: string;
};

export function createReleaseCandidateEvidence(
  manifest: ArtifactManifest,
  context: CandidateContext
): ReleaseCandidateEvidence {
  const evidence: ReleaseCandidateEvidence = {
    schemaVersion: RELEASE_CANDIDATE_SCHEMA_VERSION,
    purpose: RELEASE_CANDIDATE_PURPOSE,
    source: { branch: context.branch, commit: context.commit },
    build: { buildId: context.commit, productionUrl: context.productionUrl.replace(/\/$/, "") },
    artifact: {
      aggregateSha256: manifest.aggregateSha256,
      fileCount: manifest.fileCount,
      manifestFile: "artifact-manifest.sha256",
      manifestSha256: createHash("sha256").update(serializeArtifactManifest(manifest.lines)).digest("hex"),
      totalBytes: manifest.totalBytes
    },
    validity: { createdAt: context.createdAt, expiresAt: context.expiresAt }
  };

  validateReleaseCandidateEvidence(evidence, manifest, {
    verifiedAt: context.createdAt,
    branch: context.branch,
    commit: context.commit,
    productionUrl: context.productionUrl
  });
  return evidence;
}

export function validateReleaseCandidateEvidence(
  evidence: ReleaseCandidateEvidence,
  manifest: ArtifactManifest,
  expected: CandidateExpectation
): void {
  assert.ok(evidence && typeof evidence === "object", "Release candidate evidence must be an object.");
  assert.ok(evidence.source && evidence.build && evidence.artifact && evidence.validity, "Release candidate evidence is incomplete.");
  assert.equal(evidence.schemaVersion, RELEASE_CANDIDATE_SCHEMA_VERSION, "Unsupported release candidate schema version.");
  assert.equal(evidence.purpose, RELEASE_CANDIDATE_PURPOSE, "Evidence is not a non-production release candidate.");
  assert.match(evidence.source.branch, /^[A-Za-z0-9._/-]+$/, "Candidate branch contains unsupported characters.");
  assert.match(evidence.source.commit, FULL_COMMIT_PATTERN, "Candidate commit must be a full lowercase Git SHA.");
  assert.equal(evidence.build.buildId, evidence.source.commit, "Candidate build ID must equal its source commit.");
  assert.match(evidence.artifact.aggregateSha256, SHA256_PATTERN, "Candidate artifact hash must be a SHA-256.");
  assert.match(evidence.artifact.manifestSha256, SHA256_PATTERN, "Candidate manifest hash must be a SHA-256.");
  assert.equal(evidence.artifact.manifestFile, "artifact-manifest.sha256", "Candidate manifest filename is not supported.");
  const productionUrl = new URL(evidence.build.productionUrl);
  assert.equal(productionUrl.protocol, "https:", "Candidate production URL must use HTTPS.");
  assert.equal(evidence.build.productionUrl, productionUrl.origin, "Candidate production URL must be an HTTPS origin without a path.");
  assert.ok(Number.isSafeInteger(evidence.artifact.fileCount) && evidence.artifact.fileCount > 0, "Candidate file count must be positive.");
  assert.ok(Number.isSafeInteger(evidence.artifact.totalBytes) && evidence.artifact.totalBytes > 0, "Candidate byte count must be positive.");

  assert.equal(evidence.source.commit, expected.commit, "Candidate commit does not match the expected commit.");
  assert.equal(evidence.source.branch, expected.branch, "Candidate branch does not match the expected branch.");
  assert.equal(
    evidence.build.productionUrl,
    expected.productionUrl.replace(/\/$/, ""),
    "Candidate production URL does not match the expected URL."
  );

  const createdAt = parseTimestamp(evidence.validity.createdAt, "createdAt");
  const expiresAt = parseTimestamp(evidence.validity.expiresAt, "expiresAt");
  const checkedAt = parseTimestamp(expected.verifiedAt, "verification time");
  assert.ok(expiresAt > createdAt, "Candidate expiry must be later than creation.");
  assert.ok(checkedAt >= createdAt, "Candidate cannot be verified before it was created.");
  assert.ok(checkedAt <= expiresAt, "Release candidate evidence has expired.");

  const serializedManifest = serializeArtifactManifest(manifest.lines);
  assert.equal(
    evidence.artifact.manifestSha256,
    createHash("sha256").update(serializedManifest).digest("hex"),
    "Candidate manifest file does not match its evidence."
  );
  assert.deepEqual(
    {
      aggregateSha256: manifest.aggregateSha256,
      fileCount: manifest.fileCount,
      totalBytes: manifest.totalBytes
    },
    {
      aggregateSha256: evidence.artifact.aggregateSha256,
      fileCount: evidence.artifact.fileCount,
      totalBytes: evidence.artifact.totalBytes
    },
    "Candidate artifact does not match its evidence."
  );
}

function parseTimestamp(value: string, label: string): number {
  const parsed = Date.parse(value);
  assert.ok(Number.isFinite(parsed), `Candidate ${label} must be an ISO-8601 timestamp.`);
  return parsed;
}
