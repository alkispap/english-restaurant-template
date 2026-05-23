import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.join(process.cwd(), "src/components/ListingCard.tsx"), "utf8");

assert.ok(source.includes('className="h-full p-0.5"'), "listing cards should have outer breathing room for hover lift");
assert.ok(source.includes("group flex h-full flex-col rounded-lg border-2"), "border should stay on the visible card element");
assert.ok(!source.includes("border-2 ${statusBorderClass} bg-white shadow-soft transition hover:-translate-y-0.5"), "hover transform should not be applied directly to the bordered card");
assert.ok(!source.includes("hover:-translate-y-0.5"), "listing cards in scroll rows should not move upward on hover because the row clips vertical overflow");
assert.ok(source.includes("group-hover:scale-105"), "the image should still zoom on card hover");

console.log("listing card hover tests passed");
