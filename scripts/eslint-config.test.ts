import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const eslintConfigPath = path.join(process.cwd(), "eslint.config.mjs");

assert.ok(fs.existsSync(eslintConfigPath), "ESLint flat config should exist");

const source = fs.readFileSync(eslintConfigPath, "utf8");

assert.match(
  source,
  /["']\.diagnostics\/\*\*["']/,
  "ESLint should ignore generated diagnostics artifacts"
);

console.log("eslint config tests passed");
