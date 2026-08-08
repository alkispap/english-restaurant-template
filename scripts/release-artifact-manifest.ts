import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export type ArtifactManifest = {
  aggregateSha256: string;
  fileCount: number;
  lines: string[];
  totalBytes: number;
};

export function createArtifactManifest(root: string): ArtifactManifest {
  assert.ok(fs.existsSync(root), `Release artifact directory does not exist: ${root}`);
  const files = listFiles(root).sort((left, right) => left.localeCompare(right, "en"));
  let totalBytes = 0;
  const lines = files.map((file) => {
    const content = fs.readFileSync(file);
    totalBytes += content.byteLength;
    const relativePath = path.relative(root, file).split(path.sep).join("/");
    return `${createHash("sha256").update(content).digest("hex")}  ${relativePath}`;
  });
  const serialized = serializeArtifactManifest(lines);
  return {
    aggregateSha256: createHash("sha256").update(serialized).digest("hex"),
    fileCount: files.length,
    lines,
    totalBytes
  };
}

export function serializeArtifactManifest(lines: string[]): string {
  return lines.length > 0 ? `${lines.join("\n")}\n` : "";
}

function listFiles(root: string): string[] {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(root, entry.name);
    return entry.isDirectory() ? listFiles(target) : [target];
  });
}
