import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")) as {
  scripts?: Record<string, string>;
  devDependencies?: Record<string, string>;
};
const policySource = fs.readFileSync(path.join(root, "scripts", "check-dependency-security.ts"), "utf8");
const packageLock = JSON.parse(fs.readFileSync(path.join(root, "package-lock.json"), "utf8")) as {
  packages?: Record<string, { version?: string }>;
};

assert.equal(
  packageJson.scripts?.["audit:dependencies"],
  "tsx scripts/check-dependency-security.ts",
  "package scripts should expose the dependency security policy"
);
assert.equal(packageJson.devDependencies?.tsx, "^4.23.1", "tsx should retain the Windows dev-server security fix");
assert.match(policySource, /severity === "high" \|\| vulnerability\.severity === "critical"/, "policy should reject high and critical advisories");
assert.match(policySource, /GHSA-qx2v-qp2m-jg93/, "policy should identify the reviewed PostCSS advisory exactly");
assert.match(policySource, /packageName === "next"/, "policy should constrain the accepted transitive Next finding");
assert.match(policySource, /packageName !== "postcss"/, "policy should reject unrelated moderate or low advisories");
assert.match(policySource, /process\.env\.ComSpec \?\? "cmd\.exe"/, "policy command should launch through the Windows command shim when required");
assert.match(policySource, /do not use npm audit fix --force/, "policy output should preserve the unsafe-force decision");
assert.equal(
  packageLock.packages?.["node_modules/brace-expansion"]?.version,
  "1.1.16",
  "the lockfile should resolve the patched brace-expansion release used by ESLint's minimatch dependency"
);

console.log("dependency security policy tests passed");
