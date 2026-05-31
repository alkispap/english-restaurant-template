import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.join(process.cwd(), "next.config.mjs"), "utf8");

assert.ok(source.includes("outputFileTracingRoot"), "Next config should pin outputFileTracingRoot to this project");

console.log("Next config root tests passed");
