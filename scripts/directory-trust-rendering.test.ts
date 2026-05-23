import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const renderedFiles = [
  "src/app/page.tsx",
  "src/app/listings/page.tsx",
  "src/app/listings/[slug]/page.tsx",
  "src/components/DirectorySidebar.tsx"
];

for (const file of renderedFiles) {
  const content = fs.readFileSync(path.join(root, file), "utf8");

  assert.ok(!content.includes("DirectoryTrustBlock"), `${file} should not render DirectoryTrustBlock`);
}

const sourceFiles = collectSourceFiles(path.join(root, "src"));
for (const file of sourceFiles) {
  const content = fs.readFileSync(file, "utf8");
  const relative = path.relative(root, file);

  assert.ok(!content.includes("Directory snapshot"), `${relative} should not contain stale Directory snapshot copy`);
}

console.log("directory trust rendering tests passed");

function collectSourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(fullPath);
    return /\.(ts|tsx)$/.test(entry.name) ? [fullPath] : [];
  });
}
