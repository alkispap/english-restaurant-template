import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  DIRECTORY_EVENT_ACTIONS,
  DIRECTORY_PAGE_TYPES,
  normalizeDirectoryAnalyticsEvent,
  trackDirectoryEvent,
  type DirectoryAnalyticsEvent
} from "../src/lib/directory-analytics";

const expectedPageTypes = [
  "homepage",
  "listing_detail",
  "area_hub",
  "category_hub",
  "area_category_hub",
  "neighborhood_hub",
  "best_hub",
  "facet_hub",
  "compare"
];

const expectedActions = [
  "page_view",
  "listing_view",
  "website_click",
  "phone_click",
  "maps_click",
  "reviews_click",
  "reserve_click",
  "order_click",
  "appointment_click",
  "menu_click",
  "email_click",
  "save_listing",
  "remove_saved_listing",
  "share_open",
  "share_native",
  "share_social",
  "share_copy",
  "compare_open",
  "compare_listing_click",
  "compare_action_click"
];

assert.deepEqual(DIRECTORY_PAGE_TYPES, expectedPageTypes);
assert.deepEqual(DIRECTORY_EVENT_ACTIONS, expectedActions);

assert.doesNotThrow(() => {
  trackDirectoryEvent({ pageType: "homepage", action: "page_view", route: "/" });
});

const normalized = normalizeDirectoryAnalyticsEvent({
  pageType: "listing_detail",
  action: "website_click",
  route: "/listings/example",
  listingSlug: "example",
  label: "",
  targetUrl: undefined
});
assert.deepEqual(normalized, {
  pageType: "listing_detail",
  action: "website_click",
  route: "/listings/example",
  listingSlug: "example"
});

const previousWindow = (globalThis as { window?: unknown }).window;
const dispatchedEvents: Array<{ type: string; detail: DirectoryAnalyticsEvent }> = [];
const trackedEvents: DirectoryAnalyticsEvent[] = [];

(globalThis as { window?: unknown }).window = {
  CustomEvent: class TestCustomEvent {
    type: string;
    detail: DirectoryAnalyticsEvent;

    constructor(type: string, init: { detail: DirectoryAnalyticsEvent }) {
      this.type = type;
      this.detail = init.detail;
    }
  },
  dispatchEvent(event: { type: string; detail: DirectoryAnalyticsEvent }) {
    dispatchedEvents.push(event);
    return true;
  },
  directoryAnalytics: {
    track(event: DirectoryAnalyticsEvent) {
      trackedEvents.push(event);
    }
  }
};

trackDirectoryEvent({
  pageType: "listing_detail",
  action: "maps_click",
  route: "/listings/example",
  listingSlug: "example",
  label: "Open Google Maps",
  targetUrl: "https://maps.example.com"
});

(globalThis as { window?: unknown }).window = previousWindow;

assert.equal(dispatchedEvents.length, 1);
assert.equal(dispatchedEvents[0].type, "directory-analytics-event");
assert.deepEqual(dispatchedEvents[0].detail, trackedEvents[0]);
assert.equal(trackedEvents[0].action, "maps_click");
assert.equal(trackedEvents[0].pageType, "listing_detail");

const root = process.cwd();
const source = (file: string) => fs.readFileSync(path.join(root, file), "utf8");
const listingPage = source("src/app/listings/[slug]/page.tsx");
const shareButton = source("src/components/ShareButton.tsx");
const saveButton = source("src/components/SaveListingButton.tsx");
const comparePage = source("src/components/CompareSavedListings.tsx");
const savedLink = source("src/components/SavedListingsLink.tsx");
const pageTrackingSources = [
  source("src/app/page.tsx"),
  source("src/app/listings/[slug]/page.tsx"),
  source("src/app/areas/[area]/page.tsx"),
  source("src/app/categories/[category]/page.tsx"),
  source("src/app/areas/[area]/categories/[category]/page.tsx"),
  source("src/app/neighborhoods/[neighborhood]/page.tsx"),
  source("src/app/best/[slug]/page.tsx"),
  source("src/app/services/[service]/page.tsx"),
  source("src/app/dietary/[dietary]/page.tsx"),
  source("src/app/types/[type]/page.tsx"),
  source("src/app/offerings/[offering]/page.tsx"),
  source("src/app/compare/page.tsx")
].join("\n");

[
  "maps_click",
  "reviews_click",
  "website_click",
  "reserve_click",
  "order_click",
  "appointment_click",
  "menu_click",
  "phone_click",
  "email_click"
].forEach((action) => {
  assert.ok(listingPage.includes(action), `listing page should track ${action}`);
});

["share_open", "share_native", "share_social", "share_copy"].forEach((action) => {
  assert.ok(shareButton.includes(action), `share button should track ${action}`);
});

assert.ok(saveButton.includes("save_listing"), "save button should track save_listing");
assert.ok(saveButton.includes("remove_saved_listing"), "save button should track remove_saved_listing");

["compare_open", "compare_listing_click", "compare_action_click"].forEach((action) => {
  assert.ok(comparePage.includes(action) || savedLink.includes(action), `compare flow should track ${action}`);
});

[
  "pageType=\"homepage\"",
  "pageType=\"listing_detail\"",
  "pageType=\"area_hub\"",
  "pageType=\"category_hub\"",
  "pageType=\"area_category_hub\"",
  "pageType=\"neighborhood_hub\"",
  "pageType=\"best_hub\"",
  "pageType=\"facet_hub\"",
  "pageType=\"compare\""
].forEach((pageTypeUsage) => {
  assert.ok(pageTrackingSources.includes(pageTypeUsage), `expected ${pageTypeUsage} page tracking`);
});

console.log("directory analytics tests passed");
