import { spawnSync } from "node:child_process";

type AuditVia = string | {
  source?: number;
  name?: string;
  title?: string;
  url?: string;
  severity?: string;
};

type AuditVulnerability = {
  name: string;
  severity: "info" | "low" | "moderate" | "high" | "critical";
  via: AuditVia[];
};

type AuditReport = {
  vulnerabilities?: Record<string, AuditVulnerability>;
  metadata?: {
    vulnerabilities?: Record<string, number>;
  };
};

const acceptedPostcssAdvisory = "https://github.com/advisories/GHSA-qx2v-qp2m-jg93";
const auditCommand = process.platform === "win32" ? (process.env.ComSpec ?? "cmd.exe") : "npm";
const auditArguments = process.platform === "win32"
  ? ["/d", "/s", "/c", "npm.cmd audit --json"]
  : ["audit", "--json"];
const result = spawnSync(auditCommand, auditArguments, {
  cwd: process.cwd(),
  encoding: "utf8",
  windowsHide: true
});

if (result.error) {
  throw result.error;
}

let report: AuditReport;
try {
  report = JSON.parse(result.stdout) as AuditReport;
} catch {
  console.error(result.stderr || result.stdout || "npm audit returned no readable report.");
  process.exit(1);
}

const vulnerabilities = Object.entries(report.vulnerabilities ?? {});
const policyFailures: string[] = [];

for (const [packageName, vulnerability] of vulnerabilities) {
  if (vulnerability.severity === "high" || vulnerability.severity === "critical") {
    policyFailures.push(`${packageName} has ${vulnerability.severity} severity`);
    continue;
  }

  if (!isAcceptedNextPostcssFinding(packageName, vulnerability)) {
    policyFailures.push(`${packageName} has an unreviewed ${vulnerability.severity} advisory`);
  }
}

console.log(`Dependency audit counts: ${JSON.stringify(report.metadata?.vulnerabilities ?? {})}`);

if (policyFailures.length) {
  policyFailures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

if (vulnerabilities.length) {
  console.log(
    "Accepted risk: Next's pinned PostCSS is used only with trusted authored CSS during builds; do not use npm audit fix --force."
  );
}

console.log("Dependency security policy passed.");

function isAcceptedNextPostcssFinding(packageName: string, vulnerability: AuditVulnerability) {
  if (vulnerability.severity !== "moderate") return false;

  if (packageName === "next") {
    return vulnerability.via.length > 0 && vulnerability.via.every((via) => via === "postcss");
  }

  if (packageName !== "postcss") return false;

  const advisoryUrls = vulnerability.via
    .filter((via): via is Exclude<AuditVia, string> => typeof via !== "string")
    .map((via) => via.url)
    .filter(Boolean);

  return advisoryUrls.length > 0 && advisoryUrls.every((url) => url === acceptedPostcssAdvisory);
}
