import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type AuditVia = string | {
  source?: number;
  name?: string;
  title?: string;
  url?: string;
  severity?: string;
};

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

type LockPackage = {
  version?: string;
  dependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
};

type PackageLock = {
  packages?: Record<string, LockPackage>;
};

const reviewedAdvisories = new Map([
  ["https://github.com/advisories/GHSA-qx2v-qp2m-jg93", { packageName: "postcss", severity: "moderate" }],
  ["https://github.com/advisories/GHSA-6g55-p6wh-862q", { packageName: "postcss", severity: "high" }],
  ["https://github.com/advisories/GHSA-r28c-9q8g-f849", { packageName: "postcss", severity: "high" }],
  ["https://github.com/advisories/GHSA-f88m-g3jw-g9cj", { packageName: "sharp", severity: "high" }],
  ["https://github.com/advisories/GHSA-mh99-v99m-4gvg", { packageName: "brace-expansion", severity: "high" }]
]);

const reviewedPackages = new Set([
  "@eslint/config-array",
  "@eslint/eslintrc",
  "brace-expansion",
  "eslint",
  "eslint-config-next",
  "eslint-plugin-import",
  "eslint-plugin-jsx-a11y",
  "eslint-plugin-react",
  "miniflare",
  "minimatch",
  "next",
  "postcss",
  "sharp",
  "wrangler"
]);

const reviewedLockVersions: Record<string, string> = {
  "node_modules/@typescript-eslint/typescript-estree/node_modules/brace-expansion": "5.0.9",
  "node_modules/brace-expansion": "1.1.18",
  "node_modules/miniflare": "5.20260801.0-alpha",
  "node_modules/next": "16.3.0",
  "node_modules/postcss": "8.5.23",
  "node_modules/sharp": "0.35.2",
  "node_modules/wrangler": "4.119.0"
};

const reviewedNodes: Record<string, string[]> = {
  "@eslint/config-array": ["node_modules/@eslint/config-array"],
  "@eslint/eslintrc": ["node_modules/@eslint/eslintrc"],
  "brace-expansion": ["node_modules/brace-expansion"],
  eslint: ["node_modules/eslint"],
  "eslint-config-next": ["node_modules/eslint-config-next"],
  "eslint-plugin-import": ["node_modules/eslint-plugin-import"],
  "eslint-plugin-jsx-a11y": ["node_modules/eslint-plugin-jsx-a11y"],
  "eslint-plugin-react": ["node_modules/eslint-plugin-react"],
  miniflare: ["node_modules/miniflare"],
  minimatch: ["node_modules/minimatch"],
  next: ["node_modules/next"],
  postcss: ["node_modules/next/node_modules/postcss", "node_modules/postcss"],
  sharp: ["node_modules/sharp"],
  wrangler: ["node_modules/wrangler"]
};

const auditCommand = process.platform === "win32" ? (process.env.ComSpec ?? "cmd.exe") : "npm";
const auditArguments = process.platform === "win32"
  ? ["/d", "/s", "/c", "npm.cmd audit --json"]
  : ["audit", "--json"];

if (isMainModule()) {
  runAudit();
}

export function evaluateAuditReport(report: AuditReport, root = process.cwd()) {
  const vulnerabilities = report.vulnerabilities ?? {};
  const policyFailures: string[] = [];
  const acceptedRisks: string[] = [];

  for (const [packageName, vulnerability] of Object.entries(vulnerabilities)) {
    if (vulnerability.severity === "critical") {
      policyFailures.push(`${packageName} has critical severity`);
      continue;
    }

    if (isReviewedRiskFinding(packageName, vulnerability, vulnerabilities)) {
      acceptedRisks.push(`${packageName} has a reviewed ${vulnerability.severity} finding`);
      continue;
    }

    if (vulnerability.severity === "high") {
      policyFailures.push(`${packageName} has ${vulnerability.severity} severity`);
      continue;
    }

    policyFailures.push(`${packageName} has an unreviewed ${vulnerability.severity} advisory`);
  }

  if (acceptedRisks.length > 0) {
    policyFailures.push(...validateReviewedRiskContext(root));
  }

  return { acceptedRisks, policyFailures };
}

export function validateReviewedRiskContext(root: string) {
  const failures: string[] = [];
  const packageLock = readJson<PackageLock>(path.join(root, "package-lock.json"));

  for (const [lockPath, expectedVersion] of Object.entries(reviewedLockVersions)) {
    const actualVersion = packageLock.packages?.[lockPath]?.version;
    if (actualVersion !== expectedVersion) {
      failures.push(`reviewed-risk context drift: ${lockPath} must remain exactly ${expectedVersion}, found ${actualVersion ?? "missing"}`);
    }
  }

  expectLockDependency(packageLock, "node_modules/next", "postcss", "8.5.23", failures);
  expectLockDependency(packageLock, "node_modules/next", "sharp", "^0.35.3", failures, true);
  expectLockDependency(packageLock, "node_modules/miniflare", "sharp", "0.35.2", failures);
  expectLockDependency(packageLock, "node_modules/wrangler", "miniflare", "5.20260801.0-alpha", failures);

  const nextConfig = fs.readFileSync(path.join(root, "next.config.mjs"), "utf8");
  const staticBuild = fs.readFileSync(path.join(root, "scripts", "run-static-build.ts"), "utf8");
  if (!/output:\s*isStaticExport\s*&&\s*!isDevServer\s*\?\s*"export"/.test(nextConfig)) {
    failures.push("reviewed-risk context drift: production output must remain a guarded static export");
  }
  if (!/unoptimized:\s*isStaticExport/.test(nextConfig)) {
    failures.push("reviewed-risk context drift: static-export image optimisation must remain disabled");
  }
  if (!/NEXT_STATIC_EXPORT:\s*"1"/.test(staticBuild)) {
    failures.push("reviewed-risk context drift: the production static-build runner must enable NEXT_STATIC_EXPORT");
  }

  return failures;
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

  const { acceptedRisks, policyFailures } = evaluateAuditReport(report);
  console.log(`Dependency audit counts: ${JSON.stringify(report.metadata?.vulnerabilities ?? {})}`);

  acceptedRisks.forEach((finding) => console.warn(`- Accepted risk: ${finding}`));

  if (acceptedRisks.length) {
    console.warn(
      "Accepted only for the pinned static-export build with trusted authored CSS/images; Sharp and PostCSS are not shipped in the Cloudflare artifact."
    );
    console.warn(
      "The brace-expansion registry finding is accepted only for patched backports 1.1.18/5.0.9 on the locked ESLint development-tool chain."
    );
  }

  if (policyFailures.length) {
    policyFailures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log("Dependency security policy passed.");
}

function isReviewedRiskFinding(
  packageName: string,
  vulnerability: AuditVulnerability,
  vulnerabilities: Record<string, AuditVulnerability>,
  visiting = new Set<string>()
): boolean {
  if (!reviewedPackages.has(packageName) || visiting.has(packageName) || vulnerability.via.length === 0) return false;
  if (!hasOnlyReviewedNodes(packageName, vulnerability.nodes)) return false;

  const nextVisiting = new Set(visiting).add(packageName);
  return vulnerability.via.every((via) => {
    if (typeof via !== "string") {
      const reviewed = via.url ? reviewedAdvisories.get(via.url) : undefined;
      return reviewed?.packageName === packageName && reviewed.severity === via.severity;
    }
    const dependency = vulnerabilities[via];
    return Boolean(dependency && isReviewedRiskFinding(via, dependency, vulnerabilities, nextVisiting));
  });
}

function hasOnlyReviewedNodes(packageName: string, nodes: string[] | undefined) {
  const expected = reviewedNodes[packageName];
  return Boolean(expected && nodes?.length && nodes.every((node) => expected.includes(node)));
}

function expectLockDependency(
  packageLock: PackageLock,
  parentPath: string,
  dependencyName: string,
  expectedRange: string,
  failures: string[],
  optional = false
) {
  const parent = packageLock.packages?.[parentPath];
  const actualRange = optional ? parent?.optionalDependencies?.[dependencyName] : parent?.dependencies?.[dependencyName];
  if (actualRange !== expectedRange) {
    failures.push(
      `reviewed-risk context drift: ${parentPath} must declare ${dependencyName} exactly ${expectedRange}, found ${actualRange ?? "missing"}`
    );
  }
}

function readJson<T>(file: string) {
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

function isMainModule() {
  return Boolean(process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url));
}
