import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_SERVER } from "next/constants.js";
import { contentSecurityPolicy, securityHeaders } from "../src/config/security-headers.mjs";

async function main() {
  const root = process.cwd();
  const nextConfigModule = (await import(pathToFileURL(path.join(root, "next.config.mjs")).href)) as {
    default: (phase: string) => {
      headers?: () => Promise<unknown>;
      output?: string;
    };
  };
  const nextConfigFactory = nextConfigModule.default;
  const nextConfig = fs.readFileSync(path.join(root, "next.config.mjs"), "utf8");
  const cloudflareHeaders = fs.readFileSync(path.join(root, "public", "_headers"), "utf8");
  const exportCheck = fs.readFileSync(path.join(root, "scripts", "check-cloudflare-export.ts"), "utf8");

assert.match(nextConfig, /securityHeaders/, "normal Next responses should use the shared security policy");
assert.match(nextConfig, /!isDevServer && !isStaticExport/, "only non-dev, non-export Next responses should use the headers hook");
assert.match(nextConfig, /source: "\/:path\*"/, "security headers should apply to every normal Next route");

const previousStaticExport = process.env.NEXT_STATIC_EXPORT;
delete process.env.NEXT_STATIC_EXPORT;
const developmentConfig = nextConfigFactory(PHASE_DEVELOPMENT_SERVER);
const productionServerConfig = nextConfigFactory(PHASE_PRODUCTION_SERVER);
process.env.NEXT_STATIC_EXPORT = "1";
const staticExportConfig = nextConfigFactory(PHASE_PRODUCTION_SERVER);
if (previousStaticExport === undefined) delete process.env.NEXT_STATIC_EXPORT;
else process.env.NEXT_STATIC_EXPORT = previousStaticExport;

assert.equal(developmentConfig.headers, undefined, "next dev should not receive the production CSP header hook");
assert.equal(typeof productionServerConfig.headers, "function", "normal production Next serving should retain security headers");
assert.equal(staticExportConfig.headers, undefined, "static export should rely on the Cloudflare _headers artifact");
assert.equal(staticExportConfig.output, "export", "static export behavior should remain enabled for Cloudflare");

for (const { key, value } of securityHeaders) {
  assert.ok(cloudflareHeaders.includes(`  ${key}: ${value}`), `Cloudflare policy should match shared ${key}`);
}

[
  "default-src 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline'",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "img-src 'self' data: blob: https:",
  "upgrade-insecure-requests"
].forEach((directive) => assert.ok(contentSecurityPolicy.includes(directive), `CSP should include ${directive}`));

assert.doesNotMatch(contentSecurityPolicy, /unsafe-eval/, "production scripts should not permit eval");
assert.doesNotMatch(contentSecurityPolicy, /script-src[^;]*https:/, "external scripts should stay blocked while ads and analytics are disabled");
assert.match(exportCheck, /securityHeaders/, "Cloudflare validation should enforce the shared security policy");

  console.log("security header tests passed");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
