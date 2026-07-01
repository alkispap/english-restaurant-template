import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const layoutPath = path.join(root, "src", "app", "layout.tsx");
const accountProviderPath = path.join(root, "src", "components", "AccountProvider.tsx");
const headerPath = path.join(root, "src", "components", "Header.tsx");

const layout = fs.readFileSync(layoutPath, "utf8");
assert.ok(!layout.includes("AccountProvider"), "root layout must not wrap the whole site in AccountProvider");

const accountProvider = fs.readFileSync(accountProviderPath, "utf8");
assert.ok(
  !accountProvider.includes("must be used within AccountProvider"),
  "useAccount must work without a root React provider"
);
assert.ok(
  accountProvider.includes("useSyncExternalStore"),
  "account state should be exposed through a providerless external store"
);

const header = fs.readFileSync(headerPath, "utf8");
assert.ok(!header.includes('"use client"') && !header.includes("'use client'"), "Header should stay server-rendered");
assert.ok(
  !header.includes("useState") && !header.includes("useEffect"),
  "Header should not own browser-only state directly"
);
assert.ok(
  !header.includes("sticky top-0"),
  "Header should not use sticky positioning because it can suppress homepage LCP reporting"
);

console.log("account hydration boundary tests passed");
