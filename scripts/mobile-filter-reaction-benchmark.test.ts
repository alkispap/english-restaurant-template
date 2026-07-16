import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const benchmarkPath = path.join(process.cwd(), "scripts", "mobile-filter-reaction-benchmark.ts");

assert.ok(fs.existsSync(benchmarkPath), "mobile filter reaction benchmark script should exist");

const source = fs.readFileSync(benchmarkPath, "utf8");

assert.match(source, /desktop-sidebar-area/, "benchmark should include a desktop sidebar checkbox scenario");
assert.match(source, /mobile-fullscreen-area/, "benchmark should include the current mobile full-screen filter scenario");
assert.match(source, /mobile-nested-area-modal/, "benchmark should include the nested mobile Show more dialog scenario");
assert.match(source, /openMobileFilters/, "mobile scenarios should open the current Filters dialog");
assert.doesNotMatch(source, /aside details/, "benchmark should not target the retired inline mobile filter UI");
assert.match(source, /prepared dialog state or initial focus was incorrect/, "benchmark should validate initial dialog focus");
assert.match(source, /Escape did not close the topmost dialog and restore focus/, "benchmark should validate dialog focus restoration");
assert.match(source, /page-level horizontal overflow/, "benchmark should fail on mobile page overflow");
assert.match(source, /fs\.rmSync\(userDataDir/, "benchmark should remove its temporary browser profile");
assert.match(source, /checkedMs/, "benchmark should report time to checkbox checked state");
assert.match(source, /urlMs/, "benchmark should report time to URL query update");
assert.match(source, /resultsMs/, "benchmark should report time to results update");
assert.match(source, /longTaskMs/, "benchmark should report long main-thread work after click");
assert.match(source, /median/, "benchmark should summarize median timing");
assert.match(source, /slowest/, "benchmark should summarize slowest timing");
assert.match(source, /RUNS/, "benchmark should allow overriding run count");
assert.match(source, /CPU_THROTTLE/, "benchmark should allow optional CPU throttling");
assert.doesNotMatch(source, /\bany\b/, "benchmark should use bounded unknown-based CDP types instead of explicit any");

console.log("mobile filter reaction benchmark tests passed");
