import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.join(process.cwd(), "next.config.mjs"), "utf8");

assert.ok(source.includes("outputFileTracingRoot"), "Next config should pin outputFileTracingRoot to this project");
assert.ok(source.includes("NEXT_STATIC_EXPORT"), "Next config should only export static HTML when the static export flag is set");
assert.ok(source.includes('"export"'), "Next config should support static HTML export for Cloudflare Pages");
assert.ok(source.includes("staticPageGenerationTimeout"), "Static exports should tolerate worker contention while generating thousands of routes");
assert.ok(
  source.includes("generateBuildId") && source.includes("NEXT_BUILD_ID") && source.includes("/^[0-9a-f]{40}$/"),
  "release builds should use only a validated full Git commit as their deterministic Next.js build ID"
);
assert.ok(source.includes("? 180 : undefined"), "The extended page-generation timeout should apply only to static exports");
assert.ok(source.includes("PHASE_DEVELOPMENT_SERVER"), "Next config should keep local dev out of static export mode");
assert.ok(source.includes("trailingSlash: true"), "Next config should emit directory-style static routes");
assert.ok(source.includes("unoptimized: isStaticExport"), "Next image optimization should be disabled for static hosting but not normal local builds");

console.log("Next config root tests passed");
