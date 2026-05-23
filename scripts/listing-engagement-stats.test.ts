import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const componentPath = path.join(process.cwd(), "src/components/ListingEngagementStats.tsx");

assert.ok(fs.existsSync(componentPath), "listing engagement stats component should exist");

const source = fs.readFileSync(componentPath, "utf8");

assert.ok(source.includes("\"use client\""), "listing engagement stats should be a client component");
assert.ok(source.includes("slug: string"), "listing engagement stats should accept the listing slug");
assert.ok(source.includes("watching now"), "listing engagement stats should show the live watching label");
assert.ok(source.includes("total views"), "listing engagement stats should show the total views label");
assert.ok(source.includes("useState(() => getInitialStats(slug))"), "initial stats should be derived from the slug before browser effects run");
assert.ok(source.includes("setInterval"), "watching now should update gently while the visitor is on the page");
assert.ok(!source.includes("localStorage"), "demo view counters should not store visitor activity locally");
assert.ok(!source.includes("getSupabaseBrowserClient"), "demo view counters should not use Supabase");

console.log("listing engagement stats tests passed");
