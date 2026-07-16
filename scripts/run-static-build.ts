import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { activeDirectoryPack } from "../src/config/directory-packs";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || activeDirectoryPack.productionUrl;
const parsedUrl = new URL(siteUrl);

assert.equal(parsedUrl.protocol, "https:", "Static production exports require an HTTPS site URL.");
assert.ok(!["localhost", "127.0.0.1", "0.0.0.0"].includes(parsedUrl.hostname), "Static production exports cannot use a local site URL.");

console.log(`Building directory pack "${activeDirectoryPack.id}" for ${siteUrl}`);

const nextCli = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
const result = spawnSync(process.execPath, [nextCli, "build"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    NEXT_PUBLIC_SITE_URL: siteUrl,
    NEXT_STATIC_EXPORT: "1"
  },
  stdio: "inherit",
  shell: false
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
