import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { evaluateAuditReport, type AuditReport, validateReviewedRiskContext } from "./check-dependency-security";

const root = process.cwd();
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")) as {
  scripts?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

assert.equal(
  packageJson.scripts?.["audit:dependencies"],
  "tsx scripts/check-dependency-security.ts",
  "package scripts should expose the dependency security policy"
);
assert.equal(packageJson.devDependencies?.tsx, "^4.23.1", "tsx should retain the Windows dev-server security fix");
assert.deepEqual(validateReviewedRiskContext(root), [], "the reviewed-risk exception must be bound to the approved lock and static-export context");

const reviewedReport = report({
  postcss: vulnerability("high", [
    advisory("https://github.com/advisories/GHSA-qx2v-qp2m-jg93", "moderate"),
    advisory("https://github.com/advisories/GHSA-6g55-p6wh-862q", "high"),
    advisory("https://github.com/advisories/GHSA-r28c-9q8g-f849", "high")
  ], ["node_modules/next/node_modules/postcss", "node_modules/postcss"]),
  sharp: vulnerability("high", [advisory("https://github.com/advisories/GHSA-f88m-g3jw-g9cj", "high")], ["node_modules/sharp"]),
  next: vulnerability("high", ["postcss", "sharp"], ["node_modules/next"]),
  miniflare: vulnerability("high", ["sharp"], ["node_modules/miniflare"]),
  wrangler: vulnerability("high", ["miniflare"], ["node_modules/wrangler"]),
  "brace-expansion": vulnerability(
    "high",
    [advisory("https://github.com/advisories/GHSA-mh99-v99m-4gvg", "high")],
    ["node_modules/brace-expansion"]
  ),
  minimatch: vulnerability("high", ["brace-expansion"], ["node_modules/minimatch"]),
  "@eslint/config-array": vulnerability("high", ["minimatch"], ["node_modules/@eslint/config-array"]),
  "@eslint/eslintrc": vulnerability("high", ["minimatch"], ["node_modules/@eslint/eslintrc"]),
  eslint: vulnerability("high", ["@eslint/config-array", "@eslint/eslintrc", "minimatch"], ["node_modules/eslint"]),
  "eslint-plugin-import": vulnerability("high", ["minimatch"], ["node_modules/eslint-plugin-import"]),
  "eslint-plugin-jsx-a11y": vulnerability("high", ["minimatch"], ["node_modules/eslint-plugin-jsx-a11y"]),
  "eslint-plugin-react": vulnerability("high", ["minimatch"], ["node_modules/eslint-plugin-react"]),
  "eslint-config-next": vulnerability(
    "high",
    ["eslint", "eslint-plugin-import", "eslint-plugin-jsx-a11y", "eslint-plugin-react"],
    ["node_modules/eslint-config-next"]
  )
});

const reviewed = evaluateAuditReport(reviewedReport, root);
assert.deepEqual(reviewed.policyFailures, [], "only the exact reviewed Sharp/PostCSS dependency chains should pass");
assert.deepEqual(
  reviewed.acceptedRisks.map((finding) => finding.split(" has ")[0]).sort(),
  [
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
  ],
  "accepted transitive findings should be explicit"
);

const unknownHigh = evaluateAuditReport(
  report({
    ...reviewedReport.vulnerabilities,
    "new-package": vulnerability("high", [advisory("https://github.com/advisories/GHSA-new1-new2-new3", "high")], ["node_modules/new-package"])
  }),
  root
);
assert.ok(unknownHigh.policyFailures.includes("new-package has high severity"), "an unrelated High finding must remain blocking");

const critical = evaluateAuditReport(report({ sharp: vulnerability("critical", [advisory("https://github.com/advisories/GHSA-f88m-g3jw-g9cj", "critical")], ["node_modules/sharp"]) }), root);
assert.deepEqual(critical.acceptedRisks, []);
assert.ok(
  critical.policyFailures.includes("sharp has critical severity"),
  "Critical severity must never be accepted even when an advisory URL was previously reviewed"
);

const changedPostcssAdvisory = evaluateAuditReport(
  report({ postcss: vulnerability("high", [advisory("https://github.com/advisories/GHSA-new1-new2-new3", "high")], ["node_modules/postcss"]) }),
  root
);
assert.ok(changedPostcssAdvisory.policyFailures.includes("postcss has high severity"), "a new PostCSS advisory must remain blocking");

const orphanPropagation = evaluateAuditReport(report({ next: vulnerability("high", ["postcss"], ["node_modules/next"]) }), root);
assert.ok(orphanPropagation.policyFailures.includes("next has high severity"), "a missing reviewed dependency chain must not be accepted");

const changedSeverity = evaluateAuditReport(
  report({ postcss: vulnerability("high", [advisory("https://github.com/advisories/GHSA-qx2v-qp2m-jg93", "high")], ["node_modules/postcss"]) }),
  root
);
assert.ok(changedSeverity.policyFailures.includes("postcss has high severity"), "reviewed advisory severity drift must remain blocking");

const wrongPackage = evaluateAuditReport(
  report({ postcss: vulnerability("high", [advisory("https://github.com/advisories/GHSA-f88m-g3jw-g9cj", "high")], ["node_modules/postcss"]) }),
  root
);
assert.ok(wrongPackage.policyFailures.includes("postcss has high severity"), "a reviewed advisory must not be accepted on another package");

const driftRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dependency-policy-"));
try {
  fs.mkdirSync(path.join(driftRoot, "scripts"));
  fs.copyFileSync(path.join(root, "package-lock.json"), path.join(driftRoot, "package-lock.json"));
  fs.copyFileSync(path.join(root, "next.config.mjs"), path.join(driftRoot, "next.config.mjs"));
  fs.copyFileSync(path.join(root, "scripts", "run-static-build.ts"), path.join(driftRoot, "scripts", "run-static-build.ts"));
  const driftLockPath = path.join(driftRoot, "package-lock.json");
  const driftLock = JSON.parse(fs.readFileSync(driftLockPath, "utf8")) as {
    packages: Record<string, { version?: string }>;
  };
  driftLock.packages["node_modules/brace-expansion"].version = "1.1.16";
  fs.writeFileSync(driftLockPath, JSON.stringify(driftLock));
  assert.ok(
    validateReviewedRiskContext(driftRoot).some((failure) => failure.includes("brace-expansion") && failure.includes("1.1.18")),
    "the exception must close if the patched brace-expansion backport drifts"
  );
  fs.writeFileSync(
    path.join(driftRoot, "next.config.mjs"),
    fs.readFileSync(path.join(driftRoot, "next.config.mjs"), "utf8").replace("unoptimized: isStaticExport", "unoptimized: false")
  );
  assert.ok(
    validateReviewedRiskContext(driftRoot).some((failure) => failure.includes("image optimisation")),
    "the exception must close if static exports start optimising images"
  );
} finally {
  fs.rmSync(driftRoot, { recursive: true, force: true });
}

console.log("dependency security policy tests passed");

function report(vulnerabilities: NonNullable<AuditReport["vulnerabilities"]>): AuditReport {
  return { vulnerabilities };
}

function vulnerability(
  severity: "moderate" | "high" | "critical",
  via: NonNullable<AuditReport["vulnerabilities"]>[string]["via"],
  nodes: string[]
) {
  return { name: "fixture", severity, via, nodes };
}

function advisory(url: string, severity: string) {
  return { url, severity };
}
