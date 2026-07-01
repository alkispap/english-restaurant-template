import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const diagnosticsPath = path.join(process.cwd(), "scripts", "static-export-diagnostics.ts");

assert.ok(fs.existsSync(diagnosticsPath), "static export diagnostics script should exist");

const source = fs.readFileSync(diagnosticsPath, "utf8");

for (const expected of [
  "route families",
  "out folder",
  "largest files",
  "sitemap.xml",
  "robots.txt",
  "NEXT_PUBLIC_SITE_URL"
]) {
  assert.ok(source.includes(expected), `diagnostics script should report ${expected}`);
}

console.log("static export diagnostics tests passed");
