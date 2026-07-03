import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const componentPath = path.join(process.cwd(), "src", "components", "FilterCheckboxGroup.tsx");
const source = fs.readFileSync(componentPath, "utf8");

assert.doesNotMatch(
  source,
  /window\.location\.assign/,
  "filter checkbox changes should not trigger full page navigation"
);
assert.match(
  source,
  /window\.history\.pushState/,
  "filter checkbox changes should update the URL through history state"
);
assert.doesNotMatch(
  source,
  /directory-url-change/,
  "filter checkbox changes should not manually dispatch directory-url-change after pushState"
);
assert.match(
  source,
  /scrollIntoView|scrollTo/,
  "filter checkbox changes should intentionally keep the user near the filter/results area"
);
assert.doesNotMatch(source, />\s*Apply\s*</, "filter pop-up choices should auto-apply without a modal Apply button");
assert.doesNotMatch(source, /draftValues|setDraftValues|toggleDraftValue/, "filter pop-up choices should not use draft-only selection state");
assert.match(source, /data-filter-option-pill/, "filter choices should render as pill-style selectable controls");
assert.match(source, /rounded-full/, "filter choice controls should use rounded pill styling");
assert.match(source, /type="checkbox"[\s\S]*className="sr-only peer"/, "pill filters should keep checkbox semantics for multi-select behavior");
assert.match(source, /selectedPillClass/, "selected pill styling should be explicit and separate from unselected styling");

console.log("filter checkbox URL behavior tests passed");
