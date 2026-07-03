import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

type Viewport = {
  width: number;
  height: number;
  mobile: boolean;
};

type Scenario = {
  id: "desktop-sidebar-area" | "mobile-panel-area" | "mobile-modal-area";
  label: string;
  viewport: Viewport;
  prepareScript: string;
  targetScript: string;
};

type RunResult = {
  scenario: string;
  run: number;
  checkedMs: number | null;
  urlMs: number | null;
  resultsMs: number | null;
  longTaskMs: number;
  finalUrl: string;
  resultHeading: string;
};

type CdpResponseResult = Record<string, unknown>;

type CdpEvent = {
  method: string;
  params?: CdpResponseResult;
};

type CdpMessage = {
  id?: number;
  method?: string;
  result?: CdpResponseResult;
  error?: unknown;
  params?: CdpResponseResult;
};

type CdpClient = {
  send: (method: string, params?: Record<string, unknown>) => Promise<CdpResponseResult>;
  waitFor: (method: string, timeout?: number) => Promise<CdpEvent>;
  close: () => void;
};

const RUNS = Number(process.env.RUNS ?? "5");
const CPU_THROTTLE = Number(process.env.CPU_THROTTLE ?? "1");
const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const RESTAURANTS_URL = `${BASE_URL.replace(/\/$/, "")}/restaurants/`;

const scenarios: Scenario[] = [
  {
    id: "desktop-sidebar-area",
    label: "Desktop sidebar area checkbox",
    viewport: { width: 1280, height: 900, mobile: false },
    prepareScript: `
      await waitFor(() => Boolean(findLabelByText("aside label", "Barking & Dagenham")), 3000);
      window.scrollTo(0, 0);
      await new Promise((resolve) => setTimeout(resolve, 250));
    `,
    targetScript: `
      findLabelByText("aside label", "Barking & Dagenham")
    `
  },
  {
    id: "mobile-panel-area",
    label: "Mobile visible filter checkbox",
    viewport: { width: 393, height: 852, mobile: true },
    prepareScript: `
      await waitFor(() => Boolean(document.querySelector("aside details")), 3000);
      const details = document.querySelector("aside details");
      if (details) details.open = true;
      const label = findLabelByText("aside details label", "Barking & Dagenham");
      if (label) label.scrollIntoView({ block: "center" });
      await new Promise((resolve) => setTimeout(resolve, 350));
    `,
    targetScript: `
      findLabelByText("aside details label", "Barking & Dagenham")
    `
  },
  {
    id: "mobile-modal-area",
    label: "Mobile Show more modal checkbox",
    viewport: { width: 393, height: 852, mobile: true },
    prepareScript: `
      await waitFor(() => Boolean(document.querySelector("aside details")), 3000);
      const details = document.querySelector("aside details");
      if (details) details.open = true;
      const areaGroupButton = findVisibleButtonByText("aside details button", "Area");
      if (areaGroupButton) areaGroupButton.scrollIntoView({ block: "center" });
      await new Promise((resolve) => setTimeout(resolve, 250));
      const showMore = findVisibleButtonByText("aside details button", "Show more");
      if (!showMore) throw new Error("Mobile area Show more button not found");
      showMore.click();
      await waitFor(() => Boolean(document.querySelector('[role="dialog"]')), 2000);
      const label = findFirstCheckboxLabel('[role="dialog"] label');
      if (label) label.scrollIntoView({ block: "center" });
      await new Promise((resolve) => setTimeout(resolve, 350));
    `,
    targetScript: `
      findFirstCheckboxLabel('[role="dialog"] label')
    `
  }
];

async function main() {
  await assertServerReady();

  const chromePath = resolveChromePath();
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "mobile-filter-benchmark-"));
  const port = 12400 + Math.floor(Math.random() * 1000);
  const chrome = spawnChrome(chromePath, userDataDir, port);
  let client: CdpClient | undefined;

  try {
    const target = await createPageTarget(port);
    client = await connectCdp(target.webSocketDebuggerUrl);
    await client.send("Page.enable");
    await client.send("Runtime.enable");
    await client.send("Input.setIgnoreInputEvents", { ignore: false });
    if (CPU_THROTTLE > 1) {
      await client.send("Emulation.setCPUThrottlingRate", { rate: CPU_THROTTLE });
    }

    const results: RunResult[] = [];
    for (const scenario of scenarios) {
      for (let run = 1; run <= RUNS; run += 1) {
        results.push(await runScenario(client, scenario, run));
      }
    }

    printResults(results);
  } finally {
    client?.close();
    chrome.kill();
  }
}

async function runScenario(client: CdpClient, scenario: Scenario, run: number): Promise<RunResult> {
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: scenario.viewport.width,
    height: scenario.viewport.height,
    deviceScaleFactor: scenario.viewport.mobile ? 3 : 1,
    mobile: scenario.viewport.mobile
  });
  await client.send("Page.navigate", { url: RESTAURANTS_URL });
  await client.waitFor("Page.loadEventFired", 20_000);
  await sleep(1_500);
  await client.send("Runtime.evaluate", {
    expression: pageHelpers(),
    awaitPromise: true,
    returnByValue: true
  });
  await client.send("Runtime.evaluate", {
    expression: `(async () => { ${scenario.prepareScript} })()`,
    awaitPromise: true,
    returnByValue: true
  });

  const targetResult = await client.send("Runtime.evaluate", {
    expression: setupBenchmarkExpression(scenario.targetScript),
    awaitPromise: true,
    returnByValue: true
  });
  const target = cdpReturnValue(targetResult) as null | { x: number; y: number };
  if (!target) throw new Error(`${scenario.id}: benchmark target not found`);

  await client.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: target.x, y: target.y, button: "none" });
  await client.send("Input.dispatchMouseEvent", { type: "mousePressed", x: target.x, y: target.y, button: "left", clickCount: 1 });
  await client.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: target.x, y: target.y, button: "left", clickCount: 1 });

  const measurementResult = await client.send("Runtime.evaluate", {
    expression: "window.__readFilterBenchmarkResult()",
    awaitPromise: true,
    returnByValue: true
  });

  const measurement = cdpReturnValue(measurementResult) as RunResult;
  return {
    ...measurement,
    scenario: scenario.id,
    run
  };
}

function cdpReturnValue(result: CdpResponseResult) {
  return (result.result as { value?: unknown } | undefined)?.value;
}

function setupBenchmarkExpression(targetScript: string) {
  return `
    (async () => {
      const targetLabel = ${targetScript};
      if (!targetLabel) return null;
      const input = targetLabel.querySelector('input[type="checkbox"]');
      if (!input) throw new Error("Target checkbox input not found");
      const startingUrl = window.location.href;
      const startingHeading = currentResultsHeading();
      const hadClientMain = Boolean(document.getElementById("directory-listings-client-main"));
      const desiredChecked = !input.checked;
      window.__filterBenchmark = {
        start: 0,
        checkedAt: null,
        urlAt: null,
        resultsAt: null,
        longTasks: [],
        startingUrl,
        startingHeading,
        hadClientMain
      };
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.startTime >= window.__filterBenchmark.start) {
            window.__filterBenchmark.longTasks.push(entry.duration);
          }
        }
      });
      try {
        observer.observe({ type: "longtask", buffered: true });
      } catch {}
      input.addEventListener("change", () => {
        if (input.checked === desiredChecked && window.__filterBenchmark.checkedAt === null) {
          window.__filterBenchmark.checkedAt = performance.now();
        }
      }, { once: true });
      window.addEventListener("directory-url-change", () => {
        if (window.location.href !== startingUrl && window.__filterBenchmark.urlAt === null) {
          window.__filterBenchmark.urlAt = performance.now();
        }
      });
      const mutationObserver = new MutationObserver(() => {
        const heading = currentResultsHeading();
        const clientMain = document.getElementById("directory-listings-client-main");
        if (
          window.__filterBenchmark.resultsAt === null &&
          ((heading && heading !== startingHeading) || (clientMain && !window.__filterBenchmark.hadClientMain))
        ) {
          window.__filterBenchmark.resultsAt = performance.now();
        }
      });
      mutationObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
      window.__filterBenchmark.stop = () => {
        observer.disconnect();
        mutationObserver.disconnect();
      };
      window.__filterBenchmark.start = performance.now();
      const rect = targetLabel.getBoundingClientRect();
      return {
        x: Math.round(rect.left + rect.width / 2),
        y: Math.round(rect.top + rect.height / 2)
      };
    })()
  `;
}

function pageHelpers() {
  return `
    (() => {
      window.findLabelByText = (selector, text) => Array.from(document.querySelectorAll(selector))
        .find((label) => label.textContent?.trim().includes(text));
      window.findButtonByText = (selector, text) => Array.from(document.querySelectorAll(selector))
        .find((button) => button.textContent?.trim() === text);
      window.isVisibleElement = (element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
      };
      window.findVisibleButtonByText = (selector, text) => Array.from(document.querySelectorAll(selector))
        .find((button) => button.textContent?.trim() === text && window.isVisibleElement(button));
      window.findFirstCheckboxLabel = (selector) => Array.from(document.querySelectorAll(selector))
        .find((label) => label.querySelector('input[type="checkbox"]'));
      window.currentResultsHeading = () => {
        const headings = Array.from(document.querySelectorAll("h2"));
        const visibleHeading = headings.find((heading) => {
          const rect = heading.getBoundingClientRect();
          const style = getComputedStyle(heading);
          return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && heading.textContent?.includes("Found");
        });
        return visibleHeading?.textContent?.trim() ?? "";
      };
      window.waitFor = async (predicate, timeoutMs = 2000) => {
        const started = performance.now();
        while (performance.now() - started < timeoutMs) {
          if (predicate()) return true;
          await new Promise((resolve) => setTimeout(resolve, 25));
        }
        throw new Error("Timed out waiting for predicate");
      };
      window.__readFilterBenchmarkResult = async () => {
        const state = window.__filterBenchmark;
        await new Promise((resolve) => setTimeout(resolve, 4500));
        if (state.resultsAt === null) {
          const heading = currentResultsHeading();
          const clientMain = document.getElementById("directory-listings-client-main");
          if ((heading && heading !== state.startingHeading) || (clientMain && !state.hadClientMain)) {
            state.resultsAt = performance.now();
          }
        }
        state.stop?.();
        const sinceStart = (time) => typeof time === "number" ? Math.round(time - state.start) : null;
        return {
          checkedMs: sinceStart(state.checkedAt),
          urlMs: sinceStart(state.urlAt),
          resultsMs: sinceStart(state.resultsAt),
          longTaskMs: Math.round(state.longTasks.reduce((sum, duration) => sum + duration, 0)),
          finalUrl: window.location.href,
          resultHeading: currentResultsHeading()
        };
      };
    })()
  `;
}

function printResults(results: RunResult[]) {
  const summary = scenarios.map((scenario) => {
    const items = results.filter((result) => result.scenario === scenario.id);
    return {
      scenario: scenario.id,
      runs: items.length,
      checkedMedianMs: median(items.map((item) => item.checkedMs)),
      checkedSlowestMs: slowest(items.map((item) => item.checkedMs)),
      urlMedianMs: median(items.map((item) => item.urlMs)),
      urlSlowestMs: slowest(items.map((item) => item.urlMs)),
      resultsMedianMs: median(items.map((item) => item.resultsMs)),
      resultsSlowestMs: slowest(items.map((item) => item.resultsMs)),
      longTaskMedianMs: median(items.map((item) => item.longTaskMs)),
      longTaskSlowestMs: slowest(items.map((item) => item.longTaskMs))
    };
  });

  console.log(`Mobile filter reaction benchmark`);
  console.log(`URL: ${RESTAURANTS_URL}`);
  console.log(`RUNS=${RUNS} CPU_THROTTLE=${CPU_THROTTLE}`);
  console.table(summary);
  console.log("Raw runs:");
  console.table(results);
}

function median(values: Array<number | null>) {
  const numeric = values.filter((value): value is number => typeof value === "number").sort((a, b) => a - b);
  if (!numeric.length) return null;
  return numeric[Math.floor(numeric.length / 2)];
}

function slowest(values: Array<number | null>) {
  const numeric = values.filter((value): value is number => typeof value === "number");
  if (!numeric.length) return null;
  return Math.max(...numeric);
}

async function assertServerReady() {
  const response = await fetch(RESTAURANTS_URL);
  if (!response.ok) throw new Error(`Expected ${RESTAURANTS_URL} to return 2xx, got ${response.status}`);
}

function resolveChromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    path.join(os.homedir(), "AppData/Local/Google/Chrome/Application/chrome.exe"),
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe"
  ].filter(Boolean) as string[];

  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) throw new Error("Chrome executable not found. Set CHROME_PATH to run the benchmark.");
  return found;
}

function spawnChrome(chromePath: string, userDataDir: string, port: number): ChildProcessWithoutNullStreams {
  return spawn(chromePath, [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--window-size=1280,900",
    "about:blank"
  ]);
}

async function createPageTarget(port: number) {
  await waitForJson(`http://127.0.0.1:${port}/json/version`);
  return waitForJson(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" });
}

async function waitForJson(url: string, init?: RequestInit) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(url, init);
      if (response.ok) return response.json();
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await sleep(250);
  }
  throw lastError;
}

function connectCdp(wsUrl: string): Promise<CdpClient> {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map<number, { resolve: (value: CdpResponseResult) => void; reject: (error: Error) => void }>();
  const events: CdpEvent[] = [];

  ws.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data)) as CdpMessage;
    if (message.id && pending.has(message.id)) {
      const callbacks = pending.get(message.id);
      pending.delete(message.id);
      if (!callbacks) return;
      if (message.error) callbacks.reject(new Error(JSON.stringify(message.error)));
      else callbacks.resolve(message.result ?? {});
    } else if (message.method) {
      events.push({ method: message.method, params: message.params });
    }
  });

  return new Promise((resolve, reject) => {
    ws.addEventListener("open", () => {
      resolve({
        send(method, params = {}) {
          const messageId = ++id;
          ws.send(JSON.stringify({ id: messageId, method, params }));
          return new Promise((resolveSend, rejectSend) => {
            pending.set(messageId, { resolve: resolveSend, reject: rejectSend });
          });
        },
        waitFor(method, timeout = 10_000) {
          const existing = events.find((event) => event.method === method);
          if (existing) return Promise.resolve(existing);
          return new Promise((resolveEvent, rejectEvent) => {
            const started = Date.now();
            const timer = setInterval(() => {
              const found = events.find((event) => event.method === method);
              if (found) {
                clearInterval(timer);
                resolveEvent(found);
              } else if (Date.now() - started > timeout) {
                clearInterval(timer);
                rejectEvent(new Error(`Timed out waiting for ${method}`));
              }
            }, 50);
          });
        },
        close() {
          ws.close();
        }
      });
    });
    ws.addEventListener("error", reject);
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
