import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { serializeJsonLd } from "../src/lib/json-ld";

const hostilePayload = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: 'Imported name </script><script>alert("schema injection")</script>',
  description: "HTML-significant < > & characters",
  separators: "line\u2028paragraph\u2029end"
};
const serialized = serializeJsonLd(hostilePayload);

assert.doesNotMatch(serialized, /<\/script/i, "serialized JSON-LD must not contain a script-closing sequence");
assert.doesNotMatch(serialized, /[<>&\u2028\u2029]/u, "serialized JSON-LD should escape HTML-significant and JavaScript separator characters");
assert.deepEqual(JSON.parse(serialized), hostilePayload, "script-safe JSON-LD must preserve the original schema values");
assert.throws(() => serializeJsonLd(undefined), /must be serializable/, "undefined JSON-LD should fail explicitly");

const srcRoot = path.join(process.cwd(), "src");
const schemaEmitters = findSourceFiles(srcRoot)
  .filter((filePath) => fs.readFileSync(filePath, "utf8").includes('application/ld+json'))
  .map((filePath) => path.relative(process.cwd(), filePath).replace(/\\/g, "/"));

assert.deepEqual(
  schemaEmitters,
  ["src/components/JsonLd.tsx"],
  "all JSON-LD script emission should remain centralized in the safe component"
);

const emitterSource = fs.readFileSync(path.join(srcRoot, "components", "JsonLd.tsx"), "utf8");
assert.match(emitterSource, /serializeJsonLd\(data\)/, "the JSON-LD component should use the safe serializer");
assert.doesNotMatch(emitterSource, /JSON\.stringify/, "the JSON-LD component should not bypass the safe serializer");

[
  "src/app/page.tsx",
  "src/app/restaurants/[slug]/page.tsx",
  "src/components/GuideArticleContent.tsx",
  "src/components/SeoLandingPageContent.tsx"
].forEach((relativePath) => {
  const source = fs.readFileSync(path.join(process.cwd(), ...relativePath.split("/")), "utf8");
  assert.match(source, /<JsonLd\b/, `${relativePath} should emit structured data through JsonLd`);
  assert.doesNotMatch(source, /dangerouslySetInnerHTML/, `${relativePath} should not serialize scripts directly`);
});

console.log("JSON-LD security tests passed");

function findSourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return findSourceFiles(entryPath);
    return /\.[cm]?[jt]sx?$/.test(entry.name) ? [entryPath] : [];
  });
}
