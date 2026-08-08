import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type AuditVia = string | object;

export type AuditVulnerability = {
  name: string;
  severity: "info" | "low" | "moderate" | "high" | "critical";
  nodes?: string[];
  via: AuditVia[];
};

export type AuditReport = {
  vulnerabilities?: Record<string, AuditVulnerability>;
  metadata?: {
    vulnerabilities?: Record<string, number>;
  };
};

const auditCommand = process.platform === "win32" ? (process.env.ComSpec ?? "cmd.exe") : "npm";
const auditArguments = process.platform === "win32"
  ? ["/d", "/s", "/c", "npm.cmd audit --json"]
  : ["audit", "--json"];

if (isMainModule()) {
  runAudit();
}

export function evaluateAuditReport(report: AuditReport) {
  const vulnerabilities = report.vulnerabilities ?? {};
  const policyFailures: string[] = [];

  for (const [packageName, vulnerability] of Object.entries(vulnerabilities)) {
    policyFailures.push(`${packageName} has ${vulnerability.severity} severity`);
  }

  return { acceptedRisks: [], policyFailures };
}

function runAudit() {
  const result = spawnSync(auditCommand, auditArguments, {
    cwd: process.cwd(),
    encoding: "utf8",
    windowsHide: true
  });

  if (result.error) throw result.error;

  let report: AuditReport;
  try {
    report = JSON.parse(result.stdout) as AuditReport;
  } catch {
    console.error(result.stderr || result.stdout || "npm audit returned no readable report.");
    process.exit(1);
  }

  const { policyFailures } = evaluateAuditReport(report);
  console.log(`Dependency audit counts: ${JSON.stringify(report.metadata?.vulnerabilities ?? {})}`);

  if (policyFailures.length) {
    policyFailures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log("Dependency security policy passed.");
}

function isMainModule() {
  return Boolean(process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url));
}
