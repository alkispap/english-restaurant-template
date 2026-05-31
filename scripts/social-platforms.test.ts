import assert from "node:assert/strict";
import { getSocialPlatform, SOCIAL_PLATFORM_IDS } from "../src/lib/social-platforms";

function knownPlatformsAreDetectedFromLabelOrUrl() {
  assert.equal(getSocialPlatform("facebook", "https://example.com").id, "facebook");
  assert.equal(getSocialPlatform("social", "https://www.instagram.com/example").id, "instagram");
  assert.equal(getSocialPlatform("x", "https://twitter.com/example").id, "x");
  assert.equal(getSocialPlatform("tiktok", "https://www.tiktok.com/@example").id, "tiktok");
  assert.equal(getSocialPlatform("youtube", "https://youtube.com/example").id, "youtube");
  assert.equal(getSocialPlatform("whatsapp", "https://example.com").id, "whatsapp");
  assert.equal(getSocialPlatform("chat", "https://wa.me/447700900123").id, "whatsapp");
  assert.equal(getSocialPlatform("chat", "https://api.whatsapp.com/send?phone=447700900123").id, "whatsapp");
}

function platformIdsCoverKnownSocials() {
  assert.deepEqual(SOCIAL_PLATFORM_IDS, [
    "facebook",
    "instagram",
    "tiktok",
    "youtube",
    "x",
    "whatsapp",
    "external"
  ]);
}

function unknownPlatformsUseExternalFallback() {
  const platform = getSocialPlatform("newsletter", "https://example.com/news");

  assert.equal(platform.id, "external");
  assert.equal(platform.label, "Newsletter");
}

knownPlatformsAreDetectedFromLabelOrUrl();
platformIdsCoverKnownSocials();
unknownPlatformsUseExternalFallback();

console.log("social platform behavior tests passed");
