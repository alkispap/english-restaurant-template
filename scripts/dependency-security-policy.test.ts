import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { evaluateAuditReport, type AuditReport } from "./check-dependency-security";

const root = process.cwd();
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")) as {
  scripts?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

assert.equal(packageJson.scripts?.["audit:dependencies"], "tsx scripts/check-dependency-security.ts");
assert.equal(packageJson.devDependencies?.tsx, "^4.23.1");

for (const severity of ["info", "low", "moderate", "high", "critical"] as const) {
  const result = evaluateAuditReport(report({ example: vulnerability(severity) }));
  assert.deepEqual(result.acceptedRisks, []);
  assert.deepEqual(result.policyFailures, [`example has ${severity} severity`]);
}

assert.deepEqual(evaluateAuditReport(report({})), { acceptedRisks: [], policyFailures: [] });

console.log("dependency security policy tests passed");

function report(vulnerabilities: NonNullable<AuditReport["vulnerabilities"]>): AuditReport {
  return { vulnerabilities };
}

function vulnerability(severity: "info" | "low" | "moderate" | "high" | "critical") {
  return { name: "example", severity, via: [] };
}
