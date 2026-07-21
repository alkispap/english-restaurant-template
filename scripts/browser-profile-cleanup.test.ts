import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  assertSafeBrowserProfilePath,
  BROWSER_EXIT_TIMEOUT_MS,
  cleanupBrowserProfile,
  PROFILE_CLEANUP_MAX_ATTEMPTS,
  PROFILE_CLEANUP_RETRY_DELAY_MS
} from "./browser-profile-cleanup";

async function main() {
assert.equal(PROFILE_CLEANUP_MAX_ATTEMPTS, 6, "cleanup retries should remain bounded");
assert.equal(PROFILE_CLEANUP_RETRY_DELAY_MS, 200, "cleanup retries should use a short backoff");
assert.equal(BROWSER_EXIT_TIMEOUT_MS, 5_000, "browser shutdown should have a bounded wait");

const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "browser-profile-cleanup-test-root-"));
const realProfile = fs.mkdtempSync(path.join(temporaryRoot, "profile-"));
fs.writeFileSync(path.join(realProfile, "lock"), "test");

try {
  assert.equal(
    assertSafeBrowserProfilePath(realProfile, temporaryRoot, "profile-"),
    path.resolve(realProfile),
    "approved prefixed profiles should resolve safely"
  );
  assert.throws(
    () => assertSafeBrowserProfilePath(temporaryRoot, temporaryRoot, "profile-"),
    /outside the approved temporary root/,
    "cleanup must never remove the approved root itself"
  );
  assert.throws(
    () => assertSafeBrowserProfilePath(path.dirname(temporaryRoot), temporaryRoot, "profile-"),
    /outside the approved temporary root/,
    "cleanup must reject parent paths"
  );
  assert.throws(
    () => assertSafeBrowserProfilePath(path.join(temporaryRoot, "unapproved"), temporaryRoot, "profile-"),
    /expected prefix/,
    "cleanup must reject paths without the approved prefix"
  );

  const removed = await cleanupBrowserProfile(realProfile, { temporaryRoot, expectedPrefix: "profile-" });
  assert.equal(removed.removed, true);
  assert.equal(fs.existsSync(realProfile), false, "a normal profile should be removed");

  let attempts = 0;
  const waits: number[] = [];
  const recovered = await cleanupBrowserProfile(path.join(temporaryRoot, "profile-retry"), {
    temporaryRoot,
    expectedPrefix: "profile-",
    removeDirectory() {
      attempts += 1;
      if (attempts < 3) throw Object.assign(new Error("locked"), { code: "EPERM" });
    },
    wait: async (milliseconds) => {
      waits.push(milliseconds);
    }
  });
  assert.deepEqual(recovered, { removed: true, attempts: 3 });
  assert.deepEqual(waits, [200, 400], "recoverable locks should use bounded incremental backoff");

  attempts = 0;
  const deferred = await cleanupBrowserProfile(path.join(temporaryRoot, "profile-locked"), {
    temporaryRoot,
    expectedPrefix: "profile-",
    maxAttempts: 2,
    retryDelayMs: 0,
    removeDirectory() {
      attempts += 1;
      throw Object.assign(new Error("still locked"), { code: "EBUSY" });
    },
    wait: async () => undefined
  });
  assert.equal(deferred.removed, false, "a persistent Windows lock should become a precise cleanup warning");
  assert.equal(deferred.attempts, 2);
  assert.match(deferred.warning, /stopped after 2 attempts/);
  assert.equal(attempts, 2, "a persistent lock must not cause unbounded retries");

  await assert.rejects(
    cleanupBrowserProfile(path.join(temporaryRoot, "profile-invalid"), {
      temporaryRoot,
      expectedPrefix: "profile-",
      removeDirectory() {
        throw Object.assign(new Error("invalid target"), { code: "EINVAL" });
      }
    }),
    /invalid target/,
    "unexpected cleanup failures must remain fatal"
  );
} finally {
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
}

console.log("browser profile cleanup tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
