import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const sourceFiles = collectSourceFiles(path.join(process.cwd(), "src"));
const rootEntries = fs.readdirSync(process.cwd(), { withFileTypes: true });

for (const file of sourceFiles) {
  const content = fs.readFileSync(file, "utf8");
  const relative = path.relative(process.cwd(), file);

  assert.ok(!content.includes("eslint-disable-next-line react-hooks/exhaustive-deps"), `${relative} should not suppress hook dependency checks`);
  assert.ok(!relative.startsWith(path.join("src", "app", "admin")), "browser admin pages should not ship in the template");
  assert.ok(!relative.startsWith(path.join("src", "app", "api", "admin")), "browser admin API routes should not ship in the template");
}

for (const entry of rootEntries) {
  assert.ok(!/^next-.*(\.(out|err))?\.log$/.test(entry.name), `${entry.name} should not be kept in the template root`);
  assert.ok(!/^codex-review-.*\.log$/.test(entry.name), `${entry.name} should not be kept in the template root`);
  assert.ok(!/\.png$/i.test(entry.name), `${entry.name} should not be kept in the template root`);
  assert.ok(entry.name !== "scratch", "scratch review artifacts should not be kept in the template root");
  assert.ok(entry.name !== "homepage.html", "generated homepage.html should not be kept in the template root");
}

console.log("source hygiene tests passed");

function collectSourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(fullPath);
    return /\.(ts|tsx)$/.test(entry.name) ? [fullPath] : [];
  });
}
