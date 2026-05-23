import assert from "node:assert/strict";
import { IMAGE_FALLBACK_TIMEOUT_MS, shouldBypassImageOptimization } from "../src/components/DirectoryImage";

function googleHostedListingImagesBypassNextOptimization() {
  assert.equal(
    shouldBypassImageOptimization("https://lh3.googleusercontent.com/gps-cs-s/example"),
    true
  );
  assert.equal(
    shouldBypassImageOptimization("https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid=example"),
    true
  );
}

function remoteImagesKeepNextOptimizationWhenHostAllowsIt() {
  assert.equal(
    shouldBypassImageOptimization("https://images.unsplash.com/photo-123?auto=format"),
    false
  );
  assert.equal(
    shouldBypassImageOptimization("https://thecurryclub.uk/wp-content/uploads/restaurant.jpg"),
    false
  );
  assert.equal(shouldBypassImageOptimization(undefined), false);
}

googleHostedListingImagesBypassNextOptimization();
remoteImagesKeepNextOptimizationWhenHostAllowsIt();
assert.ok(IMAGE_FALLBACK_TIMEOUT_MS > 0, "blank remote images should have a fallback timeout");

console.log("directory image behavior tests passed");
