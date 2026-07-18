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
assert.match(source, /CACHE_MODE/, "benchmark should distinguish cold and warm module-cache behavior");
assert.match(source, /Network\.clearBrowserCache/, "cold benchmark runs should clear the browser cache");
assert.match(source, /primeFilterModuleCache/, "warm benchmark runs should prime the filter module cache");
assert.match(source, /query-string-activation/, "benchmark should measure direct query-string activation");
assert.match(source, /q=Dishoom/, "query activation should exercise the confirmed expensive text-search path");
assert.match(source, /homepage-search-submission/, "benchmark should cover the homepage search journey");
assert.match(source, /form\.requestSubmit\(submit\)/, "homepage search should exercise the rendered form submission path");
assert.match(source, /interactionPhase/, "benchmark should separate first and true same-document interactions");
assert.match(source, /"subsequent"/, "benchmark should measure a second filter change without navigation");
assert.match(source, /moduleLoadMs/, "benchmark should attribute asynchronous module preparation time");
assert.match(source, /modelBuildMs/, "benchmark should attribute browser model construction time");
assert.match(source, /reactCommitMs/, "benchmark should attribute React commit time");
assert.match(source, /QUERY_ONLY/, "benchmark should support focused direct-query profiling without weakening full matrices");
assert.match(source, /SCENARIO_ID/, "benchmark should support isolated diagnosis without changing scenario definitions");
assert.ok(
  source.indexOf("runQueryActivationScenario(client") < source.indexOf("runScenario(client, scenario"),
  "navigation startup should be measured before unrelated interaction stress"
);
assert.doesNotMatch(source, /\bany\b/, "benchmark should use bounded unknown-based CDP types instead of explicit any");

console.log("mobile filter reaction benchmark tests passed");
