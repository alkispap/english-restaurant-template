import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.join(process.cwd(), "src/components/OpenStatusBadge.tsx"), "utf8");

assert.ok(source.includes("Clock"), "open status badge should use a clock icon");
assert.ok(!source.includes("h-2 w-2 rounded-full"), "open status badge should not render the old dot icon");
assert.ok(!source.includes('compact ? (status.isOpen ? "Open" : "Closed")'), "compact badges should keep timing details");

console.log("open status badge UI tests passed");
