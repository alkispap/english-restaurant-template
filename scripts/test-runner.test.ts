import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const runnerPath = path.join(process.cwd(), "scripts", "run-tests.ts");
const runner = fs.readFileSync(runnerPath, "utf8");

assert.ok(runner.includes("TEST_WORKERS"), "test runner should allow TEST_WORKERS override");
assert.ok(runner.includes("DEFAULT_WORKERS = 4"), "test runner should default to 4 workers");
assert.ok(runner.includes("spawn("), "test runner should use async child processes for bounded parallelism");
assert.ok(runner.includes("stdout") && runner.includes("stderr"), "test runner should capture output per test");
assert.ok(runner.includes("Slowest tests"), "test runner should print a slowest-tests summary");
assert.ok(runner.includes("Failed tests"), "test runner should print a failed-tests summary");

console.log("test runner behavior tests passed");
