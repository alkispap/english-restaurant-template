import assert from "node:assert/strict";
import {
  type ApprovalEnvelopeExpectation,
  type ReleaseApprovalEnvelope,
  validateReleaseApprovalEnvelope
} from "./release-approval-envelope";

const commit = "a".repeat(40);
const hash = "b".repeat(64);
const expected: ApprovalEnvelopeExpectation = {
  artifactAggregateSha256: hash,
  artifactId: 12345,
  artifactServiceDigest: hash,
  branch: "main",
  candidateEvidenceSha256: hash,
  candidateExpiresAt: "2026-08-15T10:00:00.000Z",
  commit,
  productionBranch: "main",
  productionUrl: "https://indianrestaurantlondon.co.uk",
  project: "indian-restaurant-london",
  rollbackDeploymentId: "9a9a9a9a-1111-4aaa-8aaa-111111111111"
};

function envelope(): ReleaseApprovalEnvelope {
  return {
    schemaVersion: 1,
    purpose: "production-artifact-approval",
    source: { branch: "main", commit },
    candidate: {
      artifactId: expected.artifactId,
      artifactServiceDigest: expected.artifactServiceDigest,
      artifactAggregateSha256: expected.artifactAggregateSha256,
      candidateEvidenceSha256: expected.candidateEvidenceSha256,
      expiresAt: expected.candidateExpiresAt
    },
    checks: [
      { id: 11, name: "Fast quality gate", conclusion: "success", headSha: commit },
      { id: 12, name: "Full static export and rendered benchmark", conclusion: "success", headSha: commit }
    ],
    target: {
      project: expected.project,
      productionUrl: expected.productionUrl,
      productionBranch: "main",
      rollbackDeploymentId: expected.rollbackDeploymentId
    },
    approval: {
      approvedAt: "2026-08-08T10:00:00.000Z",
      approvedBy: "maintainer@example.com",
      expiresAt: "2026-08-10T10:00:00.000Z"
    }
  };
}

const now = new Date("2026-08-08T12:00:00.000Z");
validateReleaseApprovalEnvelope(envelope(), expected, now);

const wrongArtifact = envelope();
wrongArtifact.candidate.artifactId += 1;
assert.throws(() => validateReleaseApprovalEnvelope(wrongArtifact, expected, now), /artifact ID does not match/);

const wrongCheckCommit = envelope();
wrongCheckCommit.checks[0].headSha = "c".repeat(40);
assert.throws(() => validateReleaseApprovalEnvelope(wrongCheckCommit, expected, now), /does not belong to the approved commit/);

const duplicateCheck = envelope();
duplicateCheck.checks[1].name = "Fast quality gate";
assert.throws(() => validateReleaseApprovalEnvelope(duplicateCheck, expected, now), /duplicates required check/);

const wrongRollback = envelope();
wrongRollback.target.rollbackDeploymentId = "8b8b8b8b-1111-4bbb-8bbb-111111111111";
assert.throws(() => validateReleaseApprovalEnvelope(wrongRollback, expected, now), /rollback deployment ID does not match/);

const expiredApproval = envelope();
expiredApproval.approval.expiresAt = "2026-08-08T11:00:00.000Z";
assert.throws(() => validateReleaseApprovalEnvelope(expiredApproval, expected, now), /approval has expired/);

const approvalOutlivesCandidate = envelope();
approvalOutlivesCandidate.approval.expiresAt = "2026-08-16T10:00:00.000Z";
assert.throws(() => validateReleaseApprovalEnvelope(approvalOutlivesCandidate, expected, now), /cannot outlive the candidate/);

console.log("release approval envelope tests passed");
