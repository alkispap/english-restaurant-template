import { createHash } from "node:crypto";

/**
 * Historical CSV provenance was recorded from the original CRLF export while
 * Git stores the snapshot with LF line endings. Canonicalize only newline
 * representation so every other source byte remains covered by the digest.
 */
export function canonicalCrLfSnapshotBytes(source: Buffer): Buffer {
  let bareLineFeeds = 0;
  for (let index = 0; index < source.length; index += 1) {
    if (source[index] === 0x0a && source[index - 1] !== 0x0d) bareLineFeeds += 1;
  }

  if (bareLineFeeds === 0) return Buffer.from(source);

  const canonical = Buffer.allocUnsafe(source.length + bareLineFeeds);
  let targetIndex = 0;
  for (let index = 0; index < source.length; index += 1) {
    const byte = source[index];
    if (byte === 0x0a && source[index - 1] !== 0x0d) {
      canonical[targetIndex] = 0x0d;
      targetIndex += 1;
    }
    canonical[targetIndex] = byte;
    targetIndex += 1;
  }

  return canonical;
}

export function historicalCsvSnapshotSha256(source: Buffer): string {
  return createHash("sha256").update(canonicalCrLfSnapshotBytes(source)).digest("hex");
}
