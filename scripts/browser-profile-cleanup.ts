import { spawnSync, type ChildProcessWithoutNullStreams } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const PROFILE_CLEANUP_MAX_ATTEMPTS = 6;
export const PROFILE_CLEANUP_RETRY_DELAY_MS = 200;
export const BROWSER_EXIT_TIMEOUT_MS = 5_000;

const RECOVERABLE_CLEANUP_CODES = new Set(["EBUSY", "EACCES", "EMFILE", "ENFILE", "ENOTEMPTY", "EPERM"]);

type CleanupOptions = {
  temporaryRoot?: string;
  expectedPrefix?: string;
  maxAttempts?: number;
  retryDelayMs?: number;
  removeDirectory?: (target: string) => void;
  wait?: (milliseconds: number) => Promise<void>;
};

export function assertSafeBrowserProfilePath(
  profilePath: string,
  temporaryRoot = os.tmpdir(),
  expectedPrefix = "mobile-filter-benchmark-"
) {
  const root = path.resolve(temporaryRoot);
  const target = path.resolve(profilePath);
  const relative = path.relative(root, target);

  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to clean browser profile outside the approved temporary root: ${target}`);
  }
  if (!path.basename(target).startsWith(expectedPrefix)) {
    throw new Error(`Refusing to clean browser profile without the expected prefix "${expectedPrefix}": ${target}`);
  }

  return target;
}

export async function cleanupBrowserProfile(profilePath: string, options: CleanupOptions = {}) {
  const target = assertSafeBrowserProfilePath(
    profilePath,
    options.temporaryRoot,
    options.expectedPrefix
  );
  const maxAttempts = options.maxAttempts ?? PROFILE_CLEANUP_MAX_ATTEMPTS;
  const retryDelayMs = options.retryDelayMs ?? PROFILE_CLEANUP_RETRY_DELAY_MS;
  const removeDirectory = options.removeDirectory ?? ((directory: string) => {
    fs.rmSync(directory, { recursive: true, force: true });
  });
  const wait = options.wait ?? sleep;

  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > PROFILE_CLEANUP_MAX_ATTEMPTS) {
    throw new Error(`Browser profile cleanup attempts must be between 1 and ${PROFILE_CLEANUP_MAX_ATTEMPTS}.`);
  }
  if (!Number.isFinite(retryDelayMs) || retryDelayMs < 0 || retryDelayMs > 1_000) {
    throw new Error("Browser profile cleanup retry delay must be between 0 and 1000ms.");
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      removeDirectory(target);
      return { removed: true as const, attempts: attempt };
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (!code || !RECOVERABLE_CLEANUP_CODES.has(code)) throw error;
      if (attempt === maxAttempts) {
        return {
          removed: false as const,
          attempts: attempt,
          warning: `Browser profile cleanup stopped after ${attempt} attempts because Windows still has files open: ${target}`
        };
      }
      await wait(retryDelayMs * attempt);
    }
  }

  throw new Error("Browser profile cleanup exhausted an unreachable retry path.");
}

export async function stopBrowserProcessTree(browser: ChildProcessWithoutNullStreams) {
  if (await waitForProcessExit(browser, 1_500)) return;

  if (process.platform === "win32" && browser.pid) {
    spawnSync("taskkill.exe", ["/PID", String(browser.pid), "/T", "/F"], {
      windowsHide: true,
      stdio: "ignore",
      shell: false
    });
  } else {
    browser.kill("SIGTERM");
  }

  if (await waitForProcessExit(browser, BROWSER_EXIT_TIMEOUT_MS)) return;
  if (process.platform !== "win32") browser.kill("SIGKILL");
  if (!(await waitForProcessExit(browser, 2_000))) {
    throw new Error(`Browser process ${browser.pid ?? "unknown"} did not exit after bounded process-tree termination.`);
  }
}

export function waitForProcessExit(browser: ChildProcessWithoutNullStreams, timeoutMs = BROWSER_EXIT_TIMEOUT_MS) {
  if (browser.exitCode !== null || browser.signalCode !== null) return Promise.resolve(true);

  return new Promise<boolean>((resolve) => {
    const timeout = setTimeout(() => resolve(false), timeoutMs);
    browser.once("exit", () => {
      clearTimeout(timeout);
      resolve(true);
    });
  });
}

function sleep(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}
