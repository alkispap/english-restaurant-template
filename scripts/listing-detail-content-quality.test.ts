import { readFileSync } from "node:fs";
import { join } from "node:path";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

const pageSource = readFileSync(join(process.cwd(), "src/app/restaurants/[slug]/page.tsx"), "utf8");

assert(
  pageSource.includes("visibleFactBlocks") && pageSource.includes(".filter((block) => block.available)"),
  "restaurant detail page should render only available quick-fact blocks"
);

assert(
  pageSource.includes("visibleFactBlocks.map((block)"),
  "restaurant detail page should map visible quick-fact blocks instead of every EAV block"
);

console.log("listing detail content quality tests passed");
