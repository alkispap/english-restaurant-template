import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const viewSource = fs.readFileSync(
  path.join(process.cwd(), "src", "components", "DirectoryListingsView.tsx"),
  "utf8"
);

assert.match(
  viewSource,
  /<source media="\(max-width: 639px\)" srcSet=\{siteConfig\.heroImageMobile\}/,
  "homepage hero should serve the dedicated mobile image on small screens"
);

assert.match(
  viewSource,
  /className="[^"]*object-contain[^"]*sm:object-cover[^"]*"/,
  "homepage hero should show the full mobile portrait image before switching to desktop cover cropping"
);
