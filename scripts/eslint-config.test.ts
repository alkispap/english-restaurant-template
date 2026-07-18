import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ESLint } from "eslint";

const eslintConfigPath = path.join(process.cwd(), "eslint.config.mjs");

async function main() {
assert.ok(fs.existsSync(eslintConfigPath), "ESLint flat config should exist");

const source = fs.readFileSync(eslintConfigPath, "utf8");

assert.match(
  source,
  /["']\.diagnostics\/\*\*["']/,
  "ESLint should ignore generated diagnostics artifacts"
);
assert.match(source, /["']\.codex-local\/\*\*["']/, "ESLint should ignore local verification evidence");

const eslint = new ESLint({ cwd: process.cwd() });
assert.equal(await eslint.isPathIgnored(".codex-local/verification/lighthouse-batch.mjs"), true);
assert.equal(await eslint.isPathIgnored("src/app/layout.tsx"), false, "application source must remain linted");
assert.equal(await eslint.isPathIgnored("scripts/favicon.test.ts"), false, "project tests must remain linted");

const [probe] = await eslint.lintText("const deliberatelyUnsafe: any = 1;\nconsole.log(deliberatelyUnsafe);\n", {
  filePath: path.join(process.cwd(), "scripts", "__eslint-probe__.ts")
});
assert.ok(probe.errorCount > 0, "an intentional project-owned lint violation must still fail");
assert.ok(
  probe.messages.some((message) => message.ruleId === "@typescript-eslint/no-explicit-any"),
  "project-owned TypeScript should retain strict TypeScript lint protection"
);

console.log("eslint config tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
