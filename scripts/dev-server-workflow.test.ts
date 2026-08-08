import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const scriptPath = path.join(root, "scripts", "start-dev-server.ps1");
const postcssConfigPath = path.join(root, "postcss.config.mjs");

assert.equal(
  packageJson.scripts.dev,
  "powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-dev-server.ps1",
  "npm run dev should use the guarded Windows dev server workflow"
);
assert.equal(
  packageJson.scripts["dev:next"],
  "next dev --turbo --hostname 127.0.0.1 --port 3000",
  "dev:next should keep the fast raw Next dev command available"
);
assert.ok(fs.existsSync(scriptPath), "scripts/start-dev-server.ps1 should exist");

const script = fs.readFileSync(scriptPath, "utf8");
assert.match(script, /3000/);
assert.match(script, /3001/);
assert.match(script, /Stop-Process/);
assert.match(script, /Get-CimInstance\s+Win32_Process/);
assert.match(script, /Invoke-WebRequest/);
assert.match(script, /127\.0\.0\.1/);

const postcssConfig = fs.readFileSync(postcssConfigPath, "utf8");
assert.match(postcssConfig, /"postcss-remove-tailwind-global-scroll-snap-strictness"\s*:\s*\{\}/);
assert.doesNotMatch(
  postcssConfig,
  /["']\.\/scripts\/postcss-remove-tailwind-global-scroll-snap-strictness\.cjs["']\s*:/,
  "local PostCSS plugin should not use a bare relative key that Turbopack resolves from .next"
);

console.log("dev server workflow tests passed");
