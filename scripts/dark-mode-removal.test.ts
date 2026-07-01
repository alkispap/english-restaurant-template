import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const sourceRoot = path.join(process.cwd(), "src");
const sourceFiles = collectFiles(sourceRoot);
const themeTogglePath = path.join(sourceRoot, "components", "ThemeToggle.tsx");
const layoutPath = path.join(sourceRoot, "app", "layout.tsx");
const globalsPath = path.join(sourceRoot, "app", "globals.css");

assert.ok(!fs.existsSync(themeTogglePath), "ThemeToggle should be removed when the site is light-mode only");

const layout = fs.readFileSync(layoutPath, "utf8");
assert.ok(!layout.includes("localStorage.getItem('theme')"), "layout should not read a saved theme before render");
assert.ok(!layout.includes("prefers-color-scheme:dark"), "layout should not apply dark mode from the visitor's system preference");
assert.ok(!layout.includes("classList.add('dark')"), "layout should not add the dark class before hydration");

const globals = fs.readFileSync(globalsPath, "utf8");
assert.ok(!globals.includes(".dark"), "global CSS should not include dark-mode selectors");
assert.ok(!globals.includes(":root:not(.dark)"), "global CSS should not depend on absence of the dark class");

for (const file of sourceFiles) {
  const relative = path.relative(process.cwd(), file);
  const content = fs.readFileSync(file, "utf8");
  assert.ok(!content.includes("dark:"), `${relative} should not include Tailwind dark-mode variants`);
  assert.ok(!content.includes('from "@/components/ThemeToggle"'), `${relative} should not import ThemeToggle`);
}

console.log("dark mode removal tests passed");

function collectFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectFiles(fullPath);
    return /\.(ts|tsx|css)$/.test(entry.name) ? [fullPath] : [];
  });
}
