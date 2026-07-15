import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { contentSecurityPolicy, securityHeaders } from "../src/config/security-headers.mjs";

const root = process.cwd();
const nextConfig = fs.readFileSync(path.join(root, "next.config.mjs"), "utf8");
const cloudflareHeaders = fs.readFileSync(path.join(root, "public", "_headers"), "utf8");
const exportCheck = fs.readFileSync(path.join(root, "scripts", "check-cloudflare-export.ts"), "utf8");

assert.match(nextConfig, /securityHeaders/, "normal Next responses should use the shared security policy");
assert.match(nextConfig, /!isStaticExport \|\| isDevServer/, "static export should not declare the unsupported Next headers hook");
assert.match(nextConfig, /source: "\/:path\*"/, "security headers should apply to every normal Next route");

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
