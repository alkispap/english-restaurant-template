import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";

const projectName = process.env.CLOUDFLARE_PROJECT_NAME?.trim();

assert.ok(projectName, "Set CLOUDFLARE_PROJECT_NAME before publishing to Cloudflare Pages.");

run("npm", ["run", "typecheck"]);
run("npm", ["run", "test"]);
run("npm", ["run", "prepare:cloudflare"]);
run("npx", ["wrangler", "pages", "deploy", "out", "--project-name", projectName]);

function run(command: string, args: string[]) {
  const display = `${command} ${args.join(" ")}`;
  console.log(`\n> ${display}`);

  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32"
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
