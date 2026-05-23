import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const scriptsDir = path.join(process.cwd(), "scripts");
const tests = fs
  .readdirSync(scriptsDir)
  .filter((file) => file.endsWith(".test.ts"))
  .sort();

for (const test of tests) {
  console.log(`Running ${test}`);
  const tsxCli = path.join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs");
  const result = spawnSync(process.execPath, [tsxCli, path.join("scripts", test)], {
    stdio: "inherit"
  });

  if (result.error) {
    console.error(result.error.message);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
