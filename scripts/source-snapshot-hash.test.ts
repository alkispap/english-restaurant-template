import assert from "node:assert/strict";
import { canonicalCrLfSnapshotBytes, historicalCsvSnapshotSha256 } from "./source-snapshot-hash";

const lf = Buffer.from("name,address\nExample,London\n", "utf8");
const crlf = Buffer.from("name,address\r\nExample,London\r\n", "utf8");
const changed = Buffer.from("name,address\nChanged,London\n", "utf8");

assert.deepEqual(canonicalCrLfSnapshotBytes(lf), crlf);
assert.deepEqual(canonicalCrLfSnapshotBytes(crlf), crlf, "existing CRLF bytes must remain unchanged");
assert.equal(historicalCsvSnapshotSha256(lf), historicalCsvSnapshotSha256(crlf));
assert.notEqual(
  historicalCsvSnapshotSha256(lf),
  historicalCsvSnapshotSha256(changed),
  "content changes must still invalidate historical provenance"
);

console.log("source snapshot hash tests passed");
