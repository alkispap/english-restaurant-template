import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const hookPath = path.join(root, "src", "lib", "use-modal-dialog.ts");
const checkboxGroupPath = path.join(root, "src", "components", "FilterCheckboxGroup.tsx");
const responsiveFiltersPath = path.join(root, "src", "components", "ResponsiveDirectoryFilters.tsx");

assert.ok(fs.existsSync(hookPath), "dialogs should share one focus-management implementation");

const hookSource = fs.readFileSync(hookPath, "utf8");
const checkboxGroupSource = fs.readFileSync(checkboxGroupPath, "utf8");
const responsiveFiltersSource = fs.readFileSync(responsiveFiltersPath, "utf8");

assert.match(hookSource, /event\.key === "Escape"/, "modal dialogs should close on Escape");
assert.match(hookSource, /event\.key !== "Tab"/, "modal dialogs should trap Tab navigation");
assert.match(hookSource, /initialFocus\.focus\(\)/, "modal dialogs should receive focus when opened");
assert.match(hookSource, /focusTarget\?\.focus\(\)/, "modal dialogs should restore focus when closed");
assert.match(hookSource, /document\.body\.style\.overflow = "hidden"/, "modal dialogs should lock page scrolling");
assert.match(hookSource, /element\.inert = true/, "modal dialogs should make background content non-interactive");
assert.match(hookSource, /element\.setAttribute\("aria-hidden", "true"\)/, "modal dialogs should hide background content from assistive technology");
assert.match(hookSource, /isTopmostDialog\(activeDialog\)/, "nested dialogs should only let the topmost dialog handle keys");

for (const [name, source] of [
  ["filter choice", checkboxGroupSource],
  ["mobile filter", responsiveFiltersSource]
] as const) {
  assert.match(source, /useModalDialog\(/, `${name} dialog should use shared focus management`);
  assert.match(source, /role="dialog"/, `${name} dialog should expose the dialog role`);
  assert.match(source, /aria-modal="true"/, `${name} dialog should expose its modal state`);
  assert.match(source, /tabIndex=\{-1\}/, `${name} dialog should provide a programmatic focus fallback`);
  assert.match(source, /createPortal\(/, `${name} dialog should render through a page-level portal`);
}

assert.match(checkboxGroupSource, /initialFocusRef: modalSearchRef/, "filter choice dialog should focus its search field first");
assert.match(
  checkboxGroupSource,
  /\{hasMore \? \([\s\S]*ref=\{modalTriggerRef\}[\s\S]*Show more/,
  "filter choice dialog should restore focus to its Show more trigger"
);
assert.match(responsiveFiltersSource, /initialFocusRef: mobileCloseRef/, "mobile filter dialog should focus its close button first");
assert.match(responsiveFiltersSource, /ref=\{mobileTriggerRef\}/, "mobile filter dialog should restore focus to its trigger");

console.log("dialog focus management tests passed");
