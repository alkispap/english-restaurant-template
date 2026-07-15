import fs from "node:fs";
import path from "node:path";
import { buildCloudflareRedirects } from "../src/lib/cloudflare-redirects";

const outputPath = path.join(process.cwd(), "public", "_redirects");
const source = buildCloudflareRedirects();

fs.writeFileSync(outputPath, source, "utf8");
console.log(`Generated ${source.trimEnd().split("\n").length.toLocaleString()} Cloudflare redirect lines.`);
