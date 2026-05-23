import assert from "node:assert/strict";
import { getFilterPanelOptionGroups } from "../src/lib/filter-panel-options";

const groups = getFilterPanelOptionGroups();
const serializedBytes = Buffer.byteLength(JSON.stringify(groups), "utf8");

assert.ok(serializedBytes < 75_000, `filter panel option payload should stay under 75KB, got ${serializedBytes}`);
assert.ok(groups.some((group) => group.name === "area"), "expected area filters");
assert.ok(groups.some((group) => group.name === "category"), "expected category filters");

console.log("listings payload tests passed");
