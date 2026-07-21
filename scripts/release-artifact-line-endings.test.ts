import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  normalizeTextLineEndings,
  textContentsEqual,
  writeTextFileIfChanged
} from "./publication-script-utils";

assert.equal(normalizeTextLineEndings("one\r\ntwo\rthree\n"), "one\ntwo\nthree\n");
assert.ok(textContentsEqual("one\r\ntwo\r\n", "one\ntwo\n"));
assert.ok(!textContentsEqual("one\r\ntwo\r\n", "one\nchanged\n"));

const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "release-artifact-line-endings-"));
const artifactPath = path.join(temporaryDirectory, "artifact.txt");

try {
  fs.writeFileSync(artifactPath, "one\r\ntwo\r\n", "utf8");
  assert.equal(
    writeTextFileIfChanged(artifactPath, "one\ntwo\n"),
    false,
    "newline-only differences should not rewrite tracked release artifacts"
  );
  assert.equal(
    fs.readFileSync(artifactPath, "utf8"),
    "one\r\ntwo\r\n",
    "a no-op comparison should preserve the checkout's existing line endings"
  );

  assert.equal(writeTextFileIfChanged(artifactPath, "one\nchanged\n"), true);
  assert.equal(fs.readFileSync(artifactPath, "utf8"), "one\nchanged\n");
} finally {
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
}

console.log("release artifact line-ending tests passed");
