import assert from "node:assert/strict";

const FULL_COMMIT_PATTERN = /^[0-9a-f]{40}$/;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const DEPLOYMENT_ID_PATTERN = /^[0-9a-f-]{8,}$/i;

export const RELEASE_APPROVAL_ENVELOPE_SCHEMA_VERSION = 1 as const;
export const RELEASE_APPROVAL_ENVELOPE_PURPOSE = "production-artifact-approval" as const;
export const REQUIRED_RELEASE_CHECKS = ["Fast quality gate", "Full static export and rendered benchmark"] as const;

export type ReleaseApprovalEnvelope = {
  schemaVersion: typeof RELEASE_APPROVAL_ENVELOPE_SCHEMA_VERSION;
  purpose: typeof RELEASE_APPROVAL_ENVELOPE_PURPOSE;
  source: {
    branch: "main";
    commit: string;
  };
  candidate: {
    artifactId: number;
    artifactServiceDigest: string;
    artifactAggregateSha256: string;
    candidateEvidenceSha256: string;
    expiresAt: string;
  };
  checks: Array<{
    id: number;
    name: (typeof REQUIRED_RELEASE_CHECKS)[number];
    conclusion: "success";
    headSha: string;
  }>;
  target: {
    project: string;
    productionUrl: string;
    productionBranch: "main";
    rollbackDeploymentId: string;
  };
  approval: {
    approvedAt: string;
    approvedBy: string;
    expiresAt: string;
  };
};

export type ApprovalEnvelopeExpectation = {
  artifactAggregateSha256: string;
  artifactId: number;
  artifactServiceDigest: string;
  branch: "main";
  candidateEvidenceSha256: string;
  candidateExpiresAt: string;
  commit: string;
  productionBranch: "main";
  productionUrl: string;
  project: string;
  rollbackDeploymentId: string;
};

/**
 * Validates an approval record only. This function neither downloads an artifact
 * nor starts a deployment; Phase 4 must separately enforce this record.
 */
export function validateReleaseApprovalEnvelope(
  envelope: ReleaseApprovalEnvelope,
  expected: ApprovalEnvelopeExpectation,
  now = new Date()
): void {
  assert.ok(envelope && typeof envelope === "object", "Release approval envelope must be an object.");
  assert.equal(envelope.schemaVersion, RELEASE_APPROVAL_ENVELOPE_SCHEMA_VERSION, "Unsupported approval envelope schema version.");
  assert.equal(envelope.purpose, RELEASE_APPROVAL_ENVELOPE_PURPOSE, "Approval envelope purpose is not supported.");

  assert.equal(envelope.source.branch, "main", "Production approval must name the main branch.");
  assert.match(envelope.source.commit, FULL_COMMIT_PATTERN, "Approval commit must be a full lowercase Git SHA.");
  assert.equal(envelope.source.branch, expected.branch, "Approval branch does not match the expected branch.");
  assert.equal(envelope.source.commit, expected.commit, "Approval commit does not match the expected commit.");

  validateHash(envelope.candidate.artifactServiceDigest, "Artifact service digest");
  validateHash(envelope.candidate.artifactAggregateSha256, "Artifact aggregate hash");
  validateHash(envelope.candidate.candidateEvidenceSha256, "Candidate evidence hash");
  assert.ok(Number.isSafeInteger(envelope.candidate.artifactId) && envelope.candidate.artifactId > 0, "Artifact ID must be a positive integer.");
  assert.equal(envelope.candidate.artifactId, expected.artifactId, "Approval artifact ID does not match the expected artifact.");
  assert.equal(envelope.candidate.artifactServiceDigest, expected.artifactServiceDigest, "Approval artifact service digest does not match.");
  assert.equal(envelope.candidate.artifactAggregateSha256, expected.artifactAggregateSha256, "Approval artifact aggregate hash does not match.");
  assert.equal(envelope.candidate.candidateEvidenceSha256, expected.candidateEvidenceSha256, "Approval candidate evidence hash does not match.");
  assert.equal(envelope.candidate.expiresAt, expected.candidateExpiresAt, "Approval candidate expiry does not match.");

  const required = new Set<string>(REQUIRED_RELEASE_CHECKS);
  assert.equal(envelope.checks.length, REQUIRED_RELEASE_CHECKS.length, "Approval must contain each required check exactly once.");
  const seenChecks = new Set<string>();
  for (const check of envelope.checks) {
    assert.ok(required.has(check.name), `Approval contains an unsupported check: ${check.name}.`);
    assert.ok(!seenChecks.has(check.name), `Approval duplicates required check: ${check.name}.`);
    seenChecks.add(check.name);
    assert.ok(Number.isSafeInteger(check.id) && check.id > 0, `Approval check ID is invalid for ${check.name}.`);
    assert.equal(check.conclusion, "success", `Approval check has not succeeded: ${check.name}.`);
    assert.equal(check.headSha, expected.commit, `Approval check does not belong to the approved commit: ${check.name}.`);
  }
  assert.deepEqual([...seenChecks].sort(), [...required].sort(), "Approval is missing a required check.");

  assert.equal(envelope.target.project, expected.project, "Approval project does not match the expected target.");
  assert.equal(envelope.target.productionUrl, expected.productionUrl.replace(/\/$/, ""), "Approval production URL does not match the expected target.");
  assert.equal(envelope.target.productionBranch, "main", "Approval production branch must be main.");
  assert.equal(envelope.target.productionBranch, expected.productionBranch, "Approval production branch does not match the expected target.");
  assert.match(envelope.target.rollbackDeploymentId, DEPLOYMENT_ID_PATTERN, "Approval rollback deployment ID is invalid.");
  assert.equal(envelope.target.rollbackDeploymentId, expected.rollbackDeploymentId, "Approval rollback deployment ID does not match the current target.");

  assert.ok(envelope.approval.approvedBy.trim(), "Approval identity is required.");
  const approvedAt = parseTimestamp(envelope.approval.approvedAt, "approval timestamp");
  const approvalExpiresAt = parseTimestamp(envelope.approval.expiresAt, "approval expiry");
  const candidateExpiresAt = parseTimestamp(envelope.candidate.expiresAt, "candidate expiry");
  assert.ok(approvedAt <= now.getTime() + 5 * 60_000, "Approval timestamp cannot be in the future.");
  assert.ok(approvalExpiresAt > approvedAt, "Approval expiry must be later than approval.");
  assert.ok(approvalExpiresAt <= candidateExpiresAt, "Approval cannot outlive the candidate artifact.");
  assert.ok(now.getTime() <= approvalExpiresAt, "Release approval has expired.");
}

function validateHash(value: string, label: string) {
  assert.match(value, SHA256_PATTERN, `${label} must be a SHA-256.`);
}

function parseTimestamp(value: string, label: string) {
  const parsed = Date.parse(value);
  assert.ok(Number.isFinite(parsed), `${label} must be an ISO-8601 timestamp.`);
  return parsed;
}
