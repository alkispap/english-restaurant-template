import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const benchmarkPath = path.join(process.cwd(), "scripts", "mobile-filter-reaction-benchmark.ts");

assert.ok(fs.existsSync(benchmarkPath), "mobile filter reaction benchmark script should exist");

const source = fs.readFileSync(benchmarkPath, "utf8");

assert.match(source, /desktop-sidebar-area/, "benchmark should include a desktop sidebar checkbox scenario");
assert.match(source, /mobile-panel-area/, "benchmark should include a mobile visible filter checkbox scenario");
assert.match(source, /mobile-modal-area/, "benchmark should include a mobile Show more modal checkbox scenario");
assert.match(source, /checkedMs/, "benchmark should report time to checkbox checked state");
assert.match(source, /urlMs/, "benchmark should report time to URL query update");
assert.match(source, /resultsMs/, "benchmark should report time to results update");
assert.match(source, /longTaskMs/, "benchmark should report long main-thread work after click");
assert.match(source, /median/, "benchmark should summarize median timing");
assert.match(source, /slowest/, "benchmark should summarize slowest timing");
assert.match(source, /RUNS/, "benchmark should allow overriding run count");
assert.match(source, /CPU_THROTTLE/, "benchmark should allow optional CPU throttling");

console.log("mobile filter reaction benchmark tests passed");
