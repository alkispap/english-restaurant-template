import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { getFilterPanelOptionGroups } from "../src/lib/filter-panel-options";

const source = fs.readFileSync(path.join(process.cwd(), "src", "lib", "filter-panel-options.ts"), "utf8");

assert.match(source, /cachedOptionGroupConfigs/, "filter panel option source should cache static option group configs");
assert.match(source, /getOptionGroupConfigs/, "filter panel option source should centralize cached option group creation");

const first = getFilterPanelOptionGroups({ area: "ealing" });
const second = getFilterPanelOptionGroups({ area: "ealing" });

assert.deepEqual(second, first, "cached filter option groups should keep the same public output");

console.log("filter option cache tests passed");
