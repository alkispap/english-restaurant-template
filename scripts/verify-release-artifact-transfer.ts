import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { type ReleaseApprovalEnvelope } from "./release-approval-envelope";
import { verifyDownloadedArtifactTransfer } from "./release-artifact-transfer";

const approvalPath = path.resolve(required("--approval"));
assert.ok(fs.existsSync(approvalPath), `Approval envelope is missing: ${approvalPath}`);

const result = verifyDownloadedArtifactTransfer({
  approval: JSON.parse(fs.readFileSync(approvalPath, "utf8")) as ReleaseApprovalEnvelope,
  artifactDirectory: required("--artifact"),
  evidenceDirectory: required("--evidence-directory"),
  expected: {
    artifactId: Number.parseInt(required("--artifact-id"), 10),
    artifactServiceDigest: required("--artifact-service-digest"),
    branch: required("--branch") as "main",
    commit: required("--commit"),
    productionBranch: required("--production-branch") as "main",
    productionUrl: required("--production-url"),
    project: required("--project"),
    rollbackDeploymentId: required("--rollback-deployment-id"),
    verifiedAt: required("--verified-at")
  }
});

console.log(`Verified downloaded artifact transfer: ${result.manifest.aggregateSha256}`);
console.log(`Candidate evidence SHA-256: ${result.candidateEvidenceSha256}`);

function required(name: string) {
  const value = process.argv.slice(2).find((argument) => argument.startsWith(`${name}=`))?.slice(name.length + 1).trim();
  assert.ok(value, `Missing required option ${name}=<value>.`);
  return value;
}
