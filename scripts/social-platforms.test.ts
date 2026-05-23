import assert from "node:assert/strict";
import { getSocialPlatform } from "../src/lib/social-platforms";

function knownPlatformsAreDetectedFromLabelOrUrl() {
  assert.equal(getSocialPlatform("facebook", "https://example.com").id, "facebook");
  assert.equal(getSocialPlatform("social", "https://www.instagram.com/example").id, "instagram");
  assert.equal(getSocialPlatform("x", "https://twitter.com/example").id, "x");
  assert.equal(getSocialPlatform("tiktok", "https://www.tiktok.com/@example").id, "tiktok");
  assert.equal(getSocialPlatform("youtube", "https://youtube.com/example").id, "youtube");
}

function unknownPlatformsUseExternalFallback() {
  const platform = getSocialPlatform("newsletter", "https://example.com/news");

  assert.equal(platform.id, "external");
  assert.equal(platform.label, "Newsletter");
}

knownPlatformsAreDetectedFromLabelOrUrl();
unknownPlatformsUseExternalFallback();

console.log("social platform behavior tests passed");
