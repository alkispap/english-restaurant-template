import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { getFilterPanelOptionGroups } from "../src/lib/filter-panel-options";

const source = fs.readFileSync(path.join(process.cwd(), "src", "lib", "filter-panel-options.ts"), "utf8");

assert.match(source, /cachedOptionGroupConfigs/, "filter panel option source should cache static option group configs");
assert.match(source, /getOptionGroupConfigs/, "filter panel option source should centralize cached option group creation");

const started = performance.now();
const first = getFilterPanelOptionGroups({ area: "ealing" });
const coldDuration = performance.now() - started;
const second = getFilterPanelOptionGroups({ area: "ealing" });

assert.deepEqual(second, first, "cached filter option groups should keep the same public output");
assert.ok(coldDuration < 500, `cold filter option construction should remain single-pass; measured ${Math.round(coldDuration)}ms`);

console.log("filter option cache tests passed");
