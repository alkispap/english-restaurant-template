import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";

const DEFAULT_WORKERS = 4;
const SLOW_TEST_COUNT = 10;

type TestResult = {
  test: string;
  durationMs: number;
  exitCode: number;
  stdout: string;
  stderr: string;
  error?: string;
};

const scriptsDir = path.join(process.cwd(), "scripts");
const tests = fs
  .readdirSync(scriptsDir)
  .filter((file) => file.endsWith(".test.ts"))
  .sort();

main();

async function main() {
  const workerCount = resolveWorkerCount(process.env.TEST_WORKERS, tests.length);
  const startedAt = performance.now();

  console.log(`Running ${tests.length} tests with ${workerCount} worker${workerCount === 1 ? "" : "s"}`);

  const results = await runTests(tests, workerCount);
  const durationMs = performance.now() - startedAt;
  const failed = results.filter((result) => result.exitCode !== 0);
  const passed = results.length - failed.length;

  printSummary({ results, passed, failed, durationMs });

  if (failed.length > 0) {
    process.exit(1);
  }
}

async function runTests(testFiles: string[], workers: number) {
  const queue = [...testFiles];
  const results: TestResult[] = [];
  const activeWorkers = Array.from({ length: Math.min(workers, queue.length) }, async () => {
    while (queue.length > 0) {
      const test = queue.shift();
      if (!test) return;

      console.log(`Running ${test}`);
      const result = await runTest(test);
      results.push(result);

      if (result.exitCode === 0) {
        console.log(`Passed ${test} (${formatDuration(result.durationMs)})`);
      } else {
        console.error(`Failed ${test} (${formatDuration(result.durationMs)})`);
      }
    }
  });

  await Promise.all(activeWorkers);
  return results.sort((a, b) => testFiles.indexOf(a.test) - testFiles.indexOf(b.test));
}

function runTest(test: string): Promise<TestResult> {
  const startedAt = performance.now();
  const tsxCli = path.join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs");
  const testPath = path.join("scripts", test);

  return new Promise((resolve) => {
    const child = spawn(process.execPath, [tsxCli, testPath], {
      cwd: process.cwd(),
      env: process.env,
      windowsHide: true
    });
    let stdout = "";
    let stderr = "";
    let processError: string | undefined;

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      processError = error.message;
    });
    child.on("close", (code) => {
      resolve({
        test,
        durationMs: performance.now() - startedAt,
        exitCode: processError ? 1 : code ?? 1,
        stdout,
        stderr,
        error: processError
      });
    });
  });
}

function printSummary({
  results,
  passed,
  failed,
  durationMs
}: {
  results: TestResult[];
  passed: number;
  failed: TestResult[];
  durationMs: number;
}) {
  console.log("");
  console.log("Test summary");
  console.log(`Total: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Runtime: ${formatDuration(durationMs)}`);

  console.log("");
  console.log("Slowest tests");
  [...results]
    .sort((a, b) => b.durationMs - a.durationMs)
    .slice(0, SLOW_TEST_COUNT)
    .forEach((result) => {
      console.log(`- ${result.test}: ${formatDuration(result.durationMs)}`);
    });

  if (failed.length === 0) return;

  console.log("");
  console.log("Failed tests");
  failed.forEach((result) => {
    console.log("");
    console.log(`--- ${result.test} ---`);
    console.log(`Exit code: ${result.exitCode}`);
    if (result.error) console.log(`Process error: ${result.error}`);
    if (result.stdout.trim()) {
      console.log("");
      console.log("stdout:");
      console.log(result.stdout.trimEnd());
    }
    if (result.stderr.trim()) {
      console.log("");
      console.log("stderr:");
      console.log(result.stderr.trimEnd());
    }
  });
}

function resolveWorkerCount(value: string | undefined, testCount: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  const requested = Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_WORKERS;
  return Math.max(1, Math.min(requested, Math.max(testCount, 1)));
}

function formatDuration(milliseconds: number) {
  const seconds = milliseconds / 1000;
  if (seconds < 60) return `${seconds.toFixed(2)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds - minutes * 60;
  return `${minutes}m ${remainingSeconds.toFixed(2)}s`;
}
