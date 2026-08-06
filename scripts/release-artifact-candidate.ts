import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  createReleaseCandidateEvidence,
  type ReleaseCandidateEvidence,
  validateReleaseCandidateEvidence
} from "./release-artifact-evidence";
import { createArtifactManifest, serializeArtifactManifest } from "./release-artifact-manifest";

const mode = process.argv[2];
assert.ok(mode === "create" || mode === "verify", "Usage: release-artifact-candidate.ts <create|verify> [options]");

const artifactDirectory = path.resolve(readRequiredOption("--artifact"));
const evidenceDirectory = path.resolve(readRequiredOption("--evidence-directory"));
const evidenceRelativeToArtifact = path.relative(artifactDirectory, evidenceDirectory);
assert.ok(
  evidenceRelativeToArtifact.startsWith("..") && !path.isAbsolute(evidenceRelativeToArtifact),
  "Evidence directory must be outside the release artifact directory."
);
const evidencePath = path.join(evidenceDirectory, "release-candidate.json");
const manifestPath = path.join(evidenceDirectory, "artifact-manifest.sha256");
const manifest = createArtifactManifest(artifactDirectory);

if (mode === "create") {
  const commit = readRequiredOption("--commit");
  const createdAt = readRequiredOption("--created-at");
  const evidence = createReleaseCandidateEvidence(manifest, {
    branch: readRequiredOption("--branch"),
    commit,
    createdAt,
    expiresAt: readRequiredOption("--expires-at"),
    productionUrl: readRequiredOption("--production-url")
  });
  fs.mkdirSync(evidenceDirectory, { recursive: true });
  fs.writeFileSync(manifestPath, serializeArtifactManifest(manifest.lines), "utf8");
  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  console.log(`Created non-production release candidate evidence: ${path.relative(process.cwd(), evidencePath)}`);
  console.log(`Artifact SHA-256: ${manifest.aggregateSha256}`);
  process.exit(0);
}

assert.ok(fs.existsSync(evidencePath), `Release candidate evidence is missing: ${evidencePath}`);
assert.ok(fs.existsSync(manifestPath), `Release candidate manifest is missing: ${manifestPath}`);
const evidence = JSON.parse(fs.readFileSync(evidencePath, "utf8")) as ReleaseCandidateEvidence;
const retainedManifest = fs.readFileSync(manifestPath, "utf8");
assert.equal(retainedManifest, serializeArtifactManifest(manifest.lines), "Retained manifest does not match the artifact directory.");
validateReleaseCandidateEvidence(evidence, manifest, {
  verifiedAt: readRequiredOption("--verified-at"),
  branch: readRequiredOption("--branch"),
  commit: readRequiredOption("--commit"),
  productionUrl: readRequiredOption("--production-url")
});
console.log(`Verified non-production release candidate: ${evidence.source.commit}`);
console.log(`Artifact SHA-256: ${manifest.aggregateSha256}`);

function readRequiredOption(name: string): string {
  const prefix = `${name}=`;
  const value = process.argv.slice(3).find((argument) => argument.startsWith(prefix))?.slice(prefix.length).trim();
  assert.ok(value, `Missing required option ${name}=<value>.`);
  return value;
}
