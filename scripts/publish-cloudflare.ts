import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const checksOnly = process.argv.includes("--checks-only");
const projectName = process.env.CLOUDFLARE_PROJECT_NAME?.trim();
const productionBranch = process.env.CLOUDFLARE_PRODUCTION_BRANCH?.trim() || "main";
const confirmation = readOption("--confirm-project");
const wranglerCli = path.join(process.cwd(), "node_modules", "wrangler", "bin", "wrangler.js");

assert.match(productionBranch, /^[A-Za-z0-9._/-]+$/, "CLOUDFLARE_PRODUCTION_BRANCH contains unsupported characters.");
assert.ok(
  fs.existsSync(wranglerCli),
  "Project-local Wrangler is missing. Run npm ci before release checks; cached or global installations are not accepted."
);

if (!checksOnly) {
  assert.ok(projectName, "Set CLOUDFLARE_PROJECT_NAME before publishing to Cloudflare Pages.");
  assert.match(projectName, /^[a-z0-9][a-z0-9-]*$/, "CLOUDFLARE_PROJECT_NAME contains unsupported characters.");
  assert.equal(
    confirmation,
    projectName,
    `Production publish refused. Re-run with --confirm-project=${projectName} to confirm the exact Cloudflare target.`
  );
}

assertCleanWorktree("before release checks");

const branch = capture("git", ["branch", "--show-current"]);
const commit = capture("git", ["rev-parse", "--short", "HEAD"]);
const wranglerVersion = capture(process.execPath, [wranglerCli, "--version"]);

console.log(checksOnly ? "\nCloudflare release checks" : "\nCloudflare production release");
console.log(`Project: ${projectName || "not required for checks-only mode"}`);
console.log(`Production branch: ${productionBranch}`);
console.log(`Source: ${branch || "detached HEAD"} @ ${commit}`);
console.log(`Wrangler: ${wranglerVersion}`);

run("npm", ["run", "typecheck"]);
run("npm", ["run", "test"]);
run("npm", ["run", "prepare:cloudflare"]);
assertCleanWorktree("after release checks and static export");

if (checksOnly) {
  console.log("\nRelease checks passed. No files were uploaded.");
} else {
  run(process.execPath, [
    wranglerCli,
    "pages",
    "deploy",
    "out",
    "--project-name",
    projectName as string,
    "--branch",
    productionBranch
  ]);
}

function readOption(name: string) {
  const equalsPrefix = `${name}=`;
  const equalsValue = process.argv.slice(2).find((argument) => argument.startsWith(equalsPrefix));

  if (equalsValue) {
    return equalsValue.slice(equalsPrefix.length).trim();
  }

  const optionIndex = process.argv.indexOf(name, 2);
  return optionIndex >= 0 ? process.argv[optionIndex + 1]?.trim() : undefined;
}

function assertCleanWorktree(stage: string) {
  const status = capture("git", ["status", "--porcelain", "--untracked-files=all"]);
  assert.equal(
    status,
    "",
    `Production publish refused because the Git worktree is not clean ${stage}. Commit or intentionally remove the listed changes:\n${status}`
  );
}

function capture(command: string, args: string[]) {
  const result = spawnSync(platformCommand(command), args, {
    encoding: "utf8",
    shell: false
  });

  if (result.error) {
    throw result.error;
  }

  assert.equal(
    result.status,
    0,
    `${command} ${args.join(" ")} failed.\n${result.stderr?.trim() || result.stdout?.trim() || "No command output."}`
  );

  return result.stdout.trim();
}

function run(command: string, args: string[]) {
  const display = `${command} ${args.join(" ")}`;
  console.log(`\n> ${display}`);

  const result = spawnSync(platformCommand(command), args, {
    stdio: "inherit",
    shell: false
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function platformCommand(command: string) {
  return process.platform === "win32" && (command === "npm" || command === "npx") ? `${command}.cmd` : command;
}
