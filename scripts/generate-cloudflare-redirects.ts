import path from "node:path";
import { buildCloudflareRedirects } from "../src/lib/cloudflare-redirects";
import { writeTextFileIfChanged } from "./publication-script-utils";

const outputPath = path.join(process.cwd(), "public", "_redirects");
const source = buildCloudflareRedirects();
const changed = writeTextFileIfChanged(outputPath, source);

console.log(
  `${changed ? "Generated" : "Verified"} ${source.trimEnd().split("\n").length.toLocaleString()} Cloudflare redirect lines.`
);
