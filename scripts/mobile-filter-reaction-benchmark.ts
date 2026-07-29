import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  assertSafeBrowserProfilePath,
  cleanupBrowserProfile,
  stopBrowserProcessTree
} from "./browser-profile-cleanup";
import { createCdpEventQueue } from "./cdp-event-queue";

type Viewport = {
  width: number;
  height: number;
  mobile: boolean;
};

type Scenario = {
  id: "desktop-sidebar-area" | "mobile-fullscreen-area" | "mobile-nested-area-modal";
  label: string;
  viewport: Viewport;
  prepareScript: string;
  targetScript: string;
  subsequentTargetScript: string;
  validationScript: string;
  cleanupScript: string;
};

type RunResult = {
  scenario: string;
  cacheMode: CacheMode;
  interactionPhase: InteractionPhase;
  run: number;
  checkedMs: number | null;
  urlMs: number | null;
  resultsMs: number | null;
  longTaskMs: number | null;
  moduleLoadMs: number | null;
  modelBuildMs: number | null;
  reactCommitMs: number | null;
  scriptResourceMs: number | null;
  moduleEvaluationMs: number | null;
  dataFetchMs: number | null;
  dataTextMs: number | null;
  dataParseMs: number | null;
  dataUnpackMs: number | null;
  runtimeInitMs: number | null;
  schedulingMs: number | null;
  ttfbMs?: number | null;
  responseEndMs?: number | null;
  domInteractiveMs?: number | null;
  domContentLoadedMs?: number | null;
  loadEventMs?: number | null;
  enhancerModuleAtMs?: number | null;
  enhancerRenderAtMs?: number | null;
  queryEffectAtMs?: number | null;
  updateStartedAtMs?: number | null;
  runtimeImportAtMs?: number | null;
  runtimeModuleAtMs?: number | null;
  clientImportsAtMs?: number | null;
  browserModuleAtMs?: number | null;
  shellModuleAtMs?: number | null;
  stateScheduledAtMs?: number | null;
  shellRenderAtMs?: number | null;
  resultPaintAtMs?: number | null;
  resultPaintDelayMs?: number | null;
  startupLongTaskMs?: number | null;
  startupLongestTaskMs?: number | null;
  finalUrl: string;
  resultHeading: string;
  viewportWidth: number;
  documentWidth: number;
  robotsContent: string;
};

type CacheMode = "cold" | "warm";
type InteractionPhase = "first" | "subsequent" | "navigation";

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
  send: (method: string, params?: Record<string, unknown>, timeout?: number) => Promise<CdpResponseResult>;
  waitForNext: (method: string, timeout?: number) => Promise<CdpEvent>;
  close: () => void;
};

const RUNS = Number(process.env.RUNS ?? "5");
const CPU_THROTTLE = Number(process.env.CPU_THROTTLE ?? "1");
const CACHE_MODE = process.env.CACHE_MODE ?? "both";
const PRINT_RAW_RUNS = process.env.PRINT_RAW_RUNS !== "0";
const QUERY_ONLY = process.env.QUERY_ONLY === "1";
const SCENARIO_ID = process.env.SCENARIO_ID;
const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const HOMEPAGE_URL = `${BASE_URL.replace(/\/$/, "")}/`;
const RESTAURANTS_URL = `${BASE_URL.replace(/\/$/, "")}/restaurants/`;
const QUERY_ACTIVATION_URL = `${RESTAURANTS_URL}?q=Dishoom`;
const SEO_LANDING_QUERY_URL = `${BASE_URL.replace(/\/$/, "")}/areas/redbridge/?open=1`;
const BROWSER_STDERR_LIMIT = 4_000;
const ACTIVE_TEXT_LIMIT = 200;

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
    `,
    subsequentTargetScript: `
      findLabelByText("aside label", "Barnet")
    `,
    validationScript: "true",
    cleanupScript: "true"
  },
  {
    id: "mobile-fullscreen-area",
    label: "Mobile full-screen filter checkbox",
    viewport: { width: 320, height: 852, mobile: true },
    prepareScript: `
      await openMobileFilters();
      const label = findLabelByText("#mobile-filter-screen label", "Barking & Dagenham");
      if (label) label.scrollIntoView({ block: "center" });
      await new Promise((resolve) => setTimeout(resolve, 350));
    `,
    targetScript: `
      findLabelByText("#mobile-filter-screen label", "Barking & Dagenham")
    `,
    subsequentTargetScript: `
      findLabelByText("#mobile-filter-screen label", "Barnet")
    `,
    validationScript: `
      document.activeElement?.getAttribute("aria-label") === "Close filters"
    `,
    cleanupScript: `
      !Array.from(document.querySelectorAll("#mobile-filter-screen")).some((element) => isVisibleElement(element)) &&
        document.activeElement?.textContent?.trim().includes("Filters")
    `
  },
  {
    id: "mobile-nested-area-modal",
    label: "Mobile nested Show more modal checkbox",
    viewport: { width: 393, height: 852, mobile: true },
    prepareScript: `
      await openMobileFilters();
      const areaGroup = findFilterGroup("#mobile-filter-screen", "Area");
      const areaGroupButton = areaGroup?.querySelector("legend button");
      if (areaGroupButton) areaGroupButton.scrollIntoView({ block: "center" });
      await new Promise((resolve) => setTimeout(resolve, 250));
      const showMore = findVisibleButtonByTextWithin(areaGroup, "button", "Show more");
      if (!showMore) throw new Error("Mobile area Show more button not found");
      showMore.click();
      await waitFor(() => document.querySelectorAll('[role="dialog"][aria-modal="true"]').length === 2, 2000);
      const label = findFirstCheckboxLabelInLastDialog();
      if (label) label.scrollIntoView({ block: "center" });
      await new Promise((resolve) => setTimeout(resolve, 350));
    `,
    targetScript: `
      findFirstCheckboxLabelInLastDialog()
    `,
    subsequentTargetScript: `
      findFirstUncheckedCheckboxLabelInLastDialog()
    `,
    validationScript: `
      document.activeElement?.getAttribute("type") === "search" &&
        document.querySelectorAll('[role="dialog"][aria-modal="true"]').length === 2
    `,
    cleanupScript: `
      document.querySelectorAll('[role="dialog"][aria-modal="true"]').length === 1 &&
        (
          document.activeElement?.textContent?.trim().includes("Show more") ||
          document.activeElement?.getAttribute("aria-label") === "Close filters"
        )
    `
  }
];

const selectedScenarios = SCENARIO_ID
  ? scenarios.filter((scenario) => scenario.id === SCENARIO_ID)
  : scenarios;

if (SCENARIO_ID && selectedScenarios.length === 0) {
  throw new Error(`Unknown SCENARIO_ID: ${SCENARIO_ID}`);
}

async function main() {
  printBenchmarkHeader();
  await assertServerReady();

  const chromePath = resolveChromePath();
  console.log(`[benchmark] browser: ${chromePath}`);
  console.log(`[benchmark] version: ${readBrowserVersion(chromePath)}`);
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "mobile-filter-benchmark-"));
  assertSafeBrowserProfilePath(userDataDir);
  const port = 12400 + Math.floor(Math.random() * 1000);
  const chrome = spawnChrome(chromePath, userDataDir, port);
  const browserState = observeBrowserProcess(chrome);
  let client: CdpClient | undefined;
  let primaryError: unknown;

  try {
    console.log("[benchmark] stage: browser-startup");
    const target = await createPageTarget(port, browserState.describe);
    client = await connectCdp(target.webSocketDebuggerUrl);
    await client.send("Page.enable");
    await client.send("Runtime.enable");
    await client.send("Network.enable");
    await client.send("Page.addScriptToEvaluateOnNewDocument", {
      source: `
        window.__directoryStartupLongTasks = [];
        try {
          new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => window.__directoryStartupLongTasks.push({
              startTime: entry.startTime,
              duration: entry.duration,
              name: entry.name
            }));
          }).observe({ type: "longtask", buffered: true });
        } catch {}
      `
    });
    await client.send("Input.setIgnoreInputEvents", { ignore: false });
    if (CPU_THROTTLE > 1) {
      await client.send("Emulation.setCPUThrottlingRate", { rate: CPU_THROTTLE });
    }

    const results: RunResult[] = [];
    for (const cacheMode of selectedCacheModes()) {
      if (cacheMode === "warm") await primeFilterModuleCache(client);
      if (cacheMode === "cold") await client.send("Network.clearBrowserCache");
      await validateSeoLandingQueryRobots(client, cacheMode);
      // Measure navigation startup immediately after the declared cache setup so unrelated
      // interaction stress and garbage collection cannot contaminate the navigation result.
      for (let run = 1; run <= RUNS; run += 1) {
        if (cacheMode === "cold") await client.send("Network.clearBrowserCache");
        results.push(await runQueryActivationScenario(client, run, cacheMode));
      }
      if (!QUERY_ONLY) {
        for (let run = 1; run <= RUNS; run += 1) {
          if (cacheMode === "cold") await client.send("Network.clearBrowserCache");
          results.push(await runHomepageSearchSubmissionScenario(client, run, cacheMode));
        }
        for (const scenario of selectedScenarios) {
          for (let run = 1; run <= RUNS; run += 1) {
            if (cacheMode === "cold") await client.send("Network.clearBrowserCache");
            results.push(...await runScenario(client, scenario, run, cacheMode));
          }
        }
      }
    }

    printResults(results);
  } catch (error) {
    primaryError = error;
    throw error;
  } finally {
    const cleanupWarnings: string[] = [];
    try {
      await client?.send("Browser.close");
    } catch (error) {
      cleanupWarnings.push(`Browser.close failed: ${errorMessage(error)}`);
    }
    client?.close();
    try {
      await stopBrowserProcessTree(chrome);
    } catch (error) {
      cleanupWarnings.push(`Browser process cleanup failed: ${errorMessage(error)}`);
    }
    try {
      const cleanup = await cleanupBrowserProfile(userDataDir);
      if (!cleanup.removed) cleanupWarnings.push(cleanup.warning);
    } catch (error) {
      cleanupWarnings.push(`Browser profile cleanup failed: ${errorMessage(error)}`);
    }
    cleanupWarnings.forEach((warning) => console.warn(`[benchmark] cleanup warning: ${warning}`));
    if (!primaryError && cleanupWarnings.some((warning) => warning.startsWith("Browser process cleanup failed"))) {
      throw new Error(cleanupWarnings.join(" "));
    }
  }
}

async function validateSeoLandingQueryRobots(client: CdpClient, cacheMode: CacheMode) {
  console.log(`[benchmark] scenario: seo-landing-query-robots cache=${cacheMode} stage=navigate`);
  const nextLoad = client.waitForNext("Page.loadEventFired", 20_000);
  await Promise.all([client.send("Page.navigate", { url: SEO_LANDING_QUERY_URL }), nextLoad]);
  await evaluateRuntimeStage(
    client,
    `seo-landing-query-robots ${cacheMode}`,
    {
      expression: `(async () => {
        const waitFor = async (predicate, message) => {
          const started = performance.now();
          while (performance.now() - started < 10000) {
            if (predicate()) return;
            await new Promise((resolve) => setTimeout(resolve, 25));
          }
          throw new Error(message);
        };
        const robots = () => document.querySelector('meta[data-directory-query-robots="true"]')?.getAttribute("content") ?? "";
        await waitFor(() => robots() === "noindex, follow", "SEO landing query did not expose noindex, follow");
        await waitFor(
          () => Boolean(document.getElementById("seo-landing-client-results")),
          "SEO landing query enhancer did not finish hydration"
        );
        history.replaceState({}, "", window.location.pathname);
        await waitFor(() => robots() === "", "SEO landing query robots metadata remained after clearing filters");
        history.replaceState({}, "", window.location.pathname + "?open=1");
        await waitFor(() => robots() === "noindex, follow", "SEO landing query did not restore noindex after reactivation");
        const homeLink = document.querySelector('header a[href="/"]');
        if (!(homeLink instanceof HTMLAnchorElement)) throw new Error("Header home link was not available");
        homeLink.click();
        await waitFor(
          () => window.location.pathname === "/" && robots() === "",
          "Client-side navigation carried SEO landing noindex onto the homepage"
        );
        return true;
      })()`,
      awaitPromise: true,
      returnByValue: true
    },
    12_000
  );
}

async function runScenario(client: CdpClient, scenario: Scenario, run: number, cacheMode: CacheMode): Promise<RunResult[]> {
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: scenario.viewport.width,
    height: scenario.viewport.height,
    deviceScaleFactor: scenario.viewport.mobile ? 3 : 1,
    mobile: scenario.viewport.mobile
  });
  console.log(`[benchmark] scenario: ${scenario.id} cache=${cacheMode} run=${run} stage=navigate`);
  const nextLoad = client.waitForNext("Page.loadEventFired", 20_000);
  await Promise.all([
    client.send("Page.navigate", { url: RESTAURANTS_URL }),
    nextLoad
  ]);
  await waitForPageReadiness(client, scenario, run, cacheMode);
  await client.send("Runtime.evaluate", {
    expression: pageHelpers(),
    awaitPromise: true,
    returnByValue: true
  });
  const first = await measureScenarioInteraction(client, scenario, run, cacheMode, "first");
  await sleep(300);
  const subsequent = await measureScenarioInteraction(client, scenario, run, cacheMode, "subsequent");
  return [first, subsequent];
}

async function waitForPageReadiness(
  client: CdpClient,
  scenario: Scenario,
  run: number,
  cacheMode: CacheMode
) {
  await evaluateRuntimeStage(
    client,
    `${scenario.id} ${cacheMode} run ${run} page readiness`,
    {
      expression: `(async () => {
        const started = performance.now();
        while (performance.now() - started < 10000) {
          const enhancerRendered = performance.getEntriesByName("directory-query-enhancer-first-render", "mark").length > 0;
          const filterControl = ${scenario.viewport.mobile
            ? `Array.from(document.querySelectorAll('aside button[aria-controls="mobile-filter-screen"]')).some((button) => {
                const rect = button.getBoundingClientRect();
                const style = getComputedStyle(button);
                return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden";
              })`
            : `Boolean(document.querySelector('aside input[type="checkbox"]'))`};
          if (document.readyState === "complete" && enhancerRendered && filterControl) {
            await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            return true;
          }
          await new Promise((resolve) => setTimeout(resolve, 25));
        }
        throw new Error("Timed out waiting for the hydrated directory controls");
      })()`,
      awaitPromise: true,
      returnByValue: true
    },
    12_000
  );
}

async function runBenchmarkStage<T>(stage: string, operation: () => Promise<T>) {
  try {
    return await operation();
  } catch (error) {
    throw new Error(`[benchmark] failed stage: ${stage}: ${errorMessage(error)}`, { cause: error });
  }
}

async function evaluateRuntimeStage(
  client: CdpClient,
  stage: string,
  params: Record<string, unknown>,
  timeoutMs = 20_000
) {
  const response = await runBenchmarkStage(stage, () => client.send("Runtime.evaluate", params, timeoutMs));
  if (response.exceptionDetails) {
    const details = JSON.stringify(response.exceptionDetails).slice(0, 1_000);
    throw new Error(`[benchmark] failed stage: ${stage}: Runtime.evaluate exception: ${details}`);
  }
  return response;
}

async function measureScenarioInteraction(
  client: CdpClient,
  scenario: Scenario,
  run: number,
  cacheMode: CacheMode,
  interactionPhase: Exclude<InteractionPhase, "navigation">
): Promise<RunResult> {
  console.log(`[benchmark] scenario: ${scenario.id} cache=${cacheMode} run=${run} stage=${interactionPhase}-prepare`);
  await evaluateRuntimeStage(
    client,
    `${scenario.id} ${cacheMode} run ${run} ${interactionPhase} preparation`,
    {
      expression: `(async () => { ${scenario.prepareScript} })()`,
      awaitPromise: true,
      returnByValue: true
    }
  );
  const validationResult = await client.send("Runtime.evaluate", {
    expression: `Boolean(${scenario.validationScript})`,
    returnByValue: true
  });
  if (cdpReturnValue(validationResult) !== true) {
    const diagnostics = await client.send("Runtime.evaluate", {
      expression: `({
        url: window.location.href,
        readyState: document.readyState,
        activeTag: document.activeElement?.tagName ?? "",
        activeId: document.activeElement?.id ?? "",
        activeRole: document.activeElement?.getAttribute("role") ?? "",
        activeLabel: document.activeElement?.getAttribute("aria-label") ?? "",
        activeText: (document.activeElement?.textContent?.trim() ?? "").slice(0, ${ACTIVE_TEXT_LIMIT}),
        filtersExpanded: Array.from(document.querySelectorAll('aside button[aria-controls="mobile-filter-screen"]'))
          .find((button) => isVisibleElement(button))?.getAttribute("aria-expanded") ?? "missing",
        dialogs: Array.from(document.querySelectorAll('[role="dialog"][aria-modal="true"]')).map((dialog) => ({
          visible: isVisibleElement(dialog),
          label: dialog.getAttribute("aria-label")
        })),
        filterScreens: Array.from(document.querySelectorAll("#mobile-filter-screen")).map((screen) => isVisibleElement(screen))
      })`,
      returnByValue: true
    });
    throw new Error(
      `${scenario.id} ${interactionPhase}: prepared dialog state or initial focus was incorrect: ${JSON.stringify(cdpReturnValue(diagnostics))}`
    );
  }

  const targetResult = await client.send("Runtime.evaluate", {
    expression: setupBenchmarkExpression(
      interactionPhase === "subsequent" ? scenario.subsequentTargetScript : scenario.targetScript
    ),
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
  if (measurement.documentWidth > measurement.viewportWidth + 1) {
    throw new Error(
      `${scenario.id}: page-level horizontal overflow (${measurement.documentWidth}px document at ${measurement.viewportWidth}px viewport)`
    );
  }
  if (measurement.robotsContent !== "noindex, follow") {
    throw new Error(`${scenario.id}: active filter URL did not expose noindex, follow robots metadata`);
  }

  if (scenario.cleanupScript !== "true") await cleanupScenario(client, scenario);

  return {
    ...measurement,
    scenario: scenario.id,
    cacheMode,
    interactionPhase,
    run
  };
}

async function cleanupScenario(client: CdpClient, scenario: Scenario) {
  await pressEscape(client);
  await sleep(150);
  const cleanupResult = await client.send("Runtime.evaluate", {
    expression: `Boolean(${scenario.cleanupScript})`,
    returnByValue: true
  });
  if (cdpReturnValue(cleanupResult) === true) return;

  const cleanupDiagnostics = await client.send("Runtime.evaluate", {
    expression: `({
      dialogs: document.querySelectorAll('[role="dialog"][aria-modal="true"]').length,
      activeText: document.activeElement?.textContent?.trim() ?? "",
      activeLabel: document.activeElement?.getAttribute("aria-label") ?? ""
    })`,
    returnByValue: true
  });
  throw new Error(
    `${scenario.id}: Escape did not close the topmost dialog and restore focus: ${JSON.stringify(cdpReturnValue(cleanupDiagnostics))}`
  );
}

async function runQueryActivationScenario(client: CdpClient, run: number, cacheMode: CacheMode): Promise<RunResult> {
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: 393,
    height: 852,
    deviceScaleFactor: 3,
    mobile: true
  });
  await client.send("Page.navigate", { url: QUERY_ACTIVATION_URL });
  const state = await waitForQueryActivation(client);

  if (state.documentWidth > state.viewportWidth + 1) {
    throw new Error(
      `query-string-activation: page-level horizontal overflow (${state.documentWidth}px document at ${state.viewportWidth}px viewport)`
    );
  }
  if (!state.finalUrl.includes("q=Dishoom") || !state.resultHeading.toLowerCase().includes("found")) {
    throw new Error(`query-string-activation: result or URL correctness failed: ${JSON.stringify(state)}`);
  }
  if (state.robotsContent !== "noindex, follow") {
    throw new Error("query-string-activation: query URL did not expose noindex, follow robots metadata");
  }

  return {
    scenario: "query-string-activation",
    cacheMode,
    interactionPhase: "navigation",
    run,
    checkedMs: null,
    urlMs: null,
    resultsMs: state.navigationElapsedMs,
    longTaskMs: state.startupLongTaskMs,
    ...state
  };
}

async function runHomepageSearchSubmissionScenario(
  client: CdpClient,
  run: number,
  cacheMode: CacheMode
): Promise<RunResult> {
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: 393,
    height: 852,
    deviceScaleFactor: 3,
    mobile: true
  });
  await client.send("Page.navigate", { url: HOMEPAGE_URL });
  const homepageWaitStarted = Date.now();
  let homepageSearchReady = false;
  while (Date.now() - homepageWaitStarted < 20_000) {
    try {
      const readyResult = await client.send("Runtime.evaluate", {
        expression: `window.location.pathname === "/" && document.readyState === "complete" && Boolean(document.querySelector('form[data-directory-query-intent="true"] input[name="q"]'))`,
        returnByValue: true
      });
      if (cdpReturnValue(readyResult) === true) {
        homepageSearchReady = true;
        break;
      }
    } catch {
      // The directory document may still be unloading.
    }
    await sleep(25);
  }
  if (!homepageSearchReady) throw new Error("Homepage directory search form did not become ready.");
  const startedAt = Date.now();
  await client.send("Runtime.evaluate", {
    expression: `(() => {
      const input = document.querySelector('form[data-directory-query-intent="true"] input[name="q"]');
      const form = input?.closest("form");
      const submit = form?.querySelector('button[type="submit"]');
      if (!(input instanceof HTMLInputElement) || !(form instanceof HTMLFormElement) || !(submit instanceof HTMLButtonElement)) {
        throw new Error("Homepage directory search form was not available.");
      }
      input.focus();
    })()`,
    returnByValue: true
  });
  await client.send("Input.insertText", { text: "Dishoom" });
  await client.send("Runtime.evaluate", {
    expression: `(() => {
      const form = document.querySelector('form[data-directory-query-intent="true"]');
      const submit = form?.querySelector('button[type="submit"]');
      if (!(form instanceof HTMLFormElement) || !(submit instanceof HTMLButtonElement)) {
        throw new Error("Homepage directory search form was not ready for submission.");
      }
      form.requestSubmit(submit);
    })()`
  });
  const state = await waitForQueryActivation(client);
  const submissionElapsedMs = Date.now() - startedAt;

  if (state.documentWidth > state.viewportWidth + 1) {
    throw new Error(
      `homepage-search-submission: page-level horizontal overflow (${state.documentWidth}px document at ${state.viewportWidth}px viewport)`
    );
  }
  if (!state.finalUrl.includes("q=Dishoom") || !state.resultHeading.toLowerCase().includes("found")) {
    throw new Error(`homepage-search-submission: result or URL correctness failed: ${JSON.stringify(state)}`);
  }
  if (state.robotsContent !== "noindex, follow") {
    throw new Error("homepage-search-submission: query URL did not expose noindex, follow robots metadata");
  }

  return {
    scenario: "homepage-search-submission",
    cacheMode,
    interactionPhase: "navigation",
    run,
    checkedMs: null,
    urlMs: null,
    resultsMs: submissionElapsedMs,
    longTaskMs: state.startupLongTaskMs,
    ...state
  };
}

async function waitForQueryActivation(client: CdpClient) {
  const started = Date.now();
  let lastState: {
    finalUrl: string;
    resultHeading: string;
    viewportWidth: number;
    documentWidth: number;
    robotsContent: string;
    clientReady?: boolean;
    navigationElapsedMs: number;
    moduleLoadMs: number | null;
    modelBuildMs: number | null;
    reactCommitMs: number | null;
    scriptResourceMs: number | null;
    moduleEvaluationMs: number | null;
    dataFetchMs: number | null;
    dataTextMs: number | null;
    dataParseMs: number | null;
    dataUnpackMs: number | null;
    runtimeInitMs: number | null;
    schedulingMs: number | null;
    ttfbMs: number | null;
    responseEndMs: number | null;
    domInteractiveMs: number | null;
    domContentLoadedMs: number | null;
    loadEventMs: number | null;
    enhancerModuleAtMs: number | null;
    enhancerRenderAtMs: number | null;
    queryEffectAtMs: number | null;
    updateStartedAtMs: number | null;
    runtimeImportAtMs: number | null;
    runtimeModuleAtMs: number | null;
    clientImportsAtMs: number | null;
    browserModuleAtMs: number | null;
    shellModuleAtMs: number | null;
    stateScheduledAtMs: number | null;
    shellRenderAtMs: number | null;
    resultPaintAtMs: number | null;
    resultPaintDelayMs: number | null;
    startupLongTaskMs: number | null;
    startupLongestTaskMs: number | null;
  } | undefined;

  while (Date.now() - started < 20_000) {
    try {
      const result = await client.send("Runtime.evaluate", {
        expression: `({
          finalUrl: window.location.href,
          resultHeading: Array.from(document.querySelectorAll("#directory-listings-client-main h2"))
            .find((heading) => heading.textContent?.toLowerCase().includes("found"))?.textContent?.trim() ?? "",
          viewportWidth: window.innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          robotsContent: document.querySelector('meta[name="robots"]')?.getAttribute("content") ?? "",
          clientReady: Boolean(document.getElementById("directory-listings-client-main")),
          ...(() => {
            const latest = (name) => performance.getEntriesByName(name, "measure").at(-1);
            const moduleMeasure = latest("directory-client-modules");
            const modelMeasure = latest("directory-model-build");
            const reactMeasure = latest("directory-react-commit");
            const dataFetchMeasure = latest("directory-search-data-fetch");
            const dataTextMeasure = latest("directory-search-data-text");
            const dataParseMeasure = latest("directory-search-data-parse");
            const dataUnpackMeasure = latest("directory-search-data-unpack");
            const runtimeInitMeasure = latest("directory-search-runtime-init");
            const schedulingMeasure = latest("directory-update-scheduling");
            const resultPaintMeasure = latest("directory-result-paint");
            const markAt = (name) => {
              const value = performance.getEntriesByName(name, "mark").at(-1)?.startTime;
              return typeof value === "number" ? Math.round(value) : null;
            };
            const navigation = performance.getEntriesByType("navigation")[0];
            const startupLongTasks = window.__directoryStartupLongTasks ?? [];
            const scripts = performance.getEntriesByType("resource").filter((entry) => entry.initiatorType === "script");
            const scriptResourceMs = scripts.length ? Math.max(...scripts.map((entry) => entry.duration)) : null;
            const latestScriptResponse = scripts.length ? Math.max(...scripts.map((entry) => entry.responseEnd)) : null;
            const moduleReadyAt = moduleMeasure ? moduleMeasure.startTime + moduleMeasure.duration : null;
            return {
              navigationElapsedMs: Math.round(
                reactMeasure ? reactMeasure.startTime + reactMeasure.duration : performance.now()
              ),
              moduleLoadMs: moduleMeasure ? Math.round(moduleMeasure.duration) : null,
              modelBuildMs: modelMeasure ? Math.round(modelMeasure.duration) : null,
              reactCommitMs: reactMeasure ? Math.round(reactMeasure.duration) : null,
              scriptResourceMs: scriptResourceMs === null ? null : Math.round(scriptResourceMs),
              moduleEvaluationMs: moduleReadyAt !== null && latestScriptResponse !== null
                ? Math.round(Math.max(0, moduleReadyAt - latestScriptResponse))
                : null,
              dataFetchMs: dataFetchMeasure ? Math.round(dataFetchMeasure.duration) : null,
              dataTextMs: dataTextMeasure ? Math.round(dataTextMeasure.duration) : null,
              dataParseMs: dataParseMeasure ? Math.round(dataParseMeasure.duration) : null,
              dataUnpackMs: dataUnpackMeasure ? Math.round(dataUnpackMeasure.duration) : null,
              runtimeInitMs: runtimeInitMeasure ? Math.round(runtimeInitMeasure.duration) : null,
              schedulingMs: schedulingMeasure ? Math.round(schedulingMeasure.duration) : null,
              ttfbMs: navigation ? Math.round(navigation.responseStart) : null,
              responseEndMs: navigation ? Math.round(navigation.responseEnd) : null,
              domInteractiveMs: navigation ? Math.round(navigation.domInteractive) : null,
              domContentLoadedMs: navigation ? Math.round(navigation.domContentLoadedEventEnd) : null,
              loadEventMs: navigation ? Math.round(navigation.loadEventEnd) : null,
              enhancerModuleAtMs: markAt("directory-query-enhancer-module-evaluated"),
              enhancerRenderAtMs: markAt("directory-query-enhancer-first-render"),
              queryEffectAtMs: markAt("directory-query-effect-started"),
              updateStartedAtMs: markAt("directory-update-started"),
              runtimeImportAtMs: markAt("directory-runtime-import-started"),
              runtimeModuleAtMs: markAt("directory-search-runtime-module-evaluated"),
              clientImportsAtMs: markAt("directory-client-imports-started"),
              browserModuleAtMs: markAt("directory-browser-model-module-evaluated"),
              shellModuleAtMs: markAt("directory-interactive-shell-module-evaluated"),
              stateScheduledAtMs: markAt("directory-primary-state-scheduled"),
              shellRenderAtMs: markAt("directory-interactive-shell-rendered"),
              resultPaintAtMs: markAt("directory-primary-results-painted"),
              resultPaintDelayMs: resultPaintMeasure ? Math.round(resultPaintMeasure.duration) : null,
              startupLongTaskMs: Math.round(startupLongTasks.reduce((sum, entry) => sum + entry.duration, 0)),
              startupLongestTaskMs: startupLongTasks.length
                ? Math.round(Math.max(...startupLongTasks.map((entry) => entry.duration)))
                : 0
            };
          })()
        })`,
        returnByValue: true
      });
      const value = cdpReturnValue(result) as typeof lastState;
      if (value) {
        lastState = value;
        if (value.clientReady && value.resultHeading && value.resultPaintAtMs !== null) return value;
      }
    } catch {
      // The previous document may still be unloading.
    }
    await sleep(25);
  }

  throw new Error(`query-string-activation: timed out waiting for client results: ${JSON.stringify(lastState)}`);
}

async function primeFilterModuleCache(client: CdpClient) {
  await runScenario(client, scenarios[0], 0, "warm");
}

function selectedCacheModes(): CacheMode[] {
  if (CACHE_MODE === "cold" || CACHE_MODE === "warm") return [CACHE_MODE];
  if (CACHE_MODE === "both") return ["cold", "warm"];
  throw new Error(`CACHE_MODE must be cold, warm, or both; received ${CACHE_MODE}`);
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
        .find((label) => label.textContent?.trim().includes(text) && window.isVisibleElement(label));
      window.findButtonByText = (selector, text) => Array.from(document.querySelectorAll(selector))
        .find((button) => button.textContent?.trim() === text);
      window.isVisibleElement = (element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
      };
      window.findVisibleButtonByText = (selector, text) => Array.from(document.querySelectorAll(selector))
        .find((button) => button.textContent?.trim() === text && window.isVisibleElement(button));
      window.findVisibleButtonByTextWithin = (root, selector, text) => root
        ? Array.from(root.querySelectorAll(selector))
          .find((button) => button.textContent?.trim() === text && window.isVisibleElement(button))
        : undefined;
      window.findFilterGroup = (rootSelector, legendText) => Array.from(document.querySelectorAll(rootSelector + " fieldset"))
        .find((fieldset) => fieldset.querySelector("legend button")?.textContent?.trim().includes(legendText));
      window.findFirstCheckboxLabelInLastDialog = () => {
        const dialogs = Array.from(document.querySelectorAll('[role="dialog"][aria-modal="true"]'))
          .filter((dialog) => window.isVisibleElement(dialog));
        return Array.from(dialogs.at(-1)?.querySelectorAll("label") ?? [])
          .find((label) => label.querySelector('input[type="checkbox"]') && window.isVisibleElement(label));
      };
      performance.clearMeasures("directory-client-modules");
      performance.clearMeasures("directory-model-build");
      performance.clearMeasures("directory-react-commit");
      performance.clearMeasures("directory-search-data-fetch");
      performance.clearMeasures("directory-search-data-text");
      performance.clearMeasures("directory-search-data-parse");
      performance.clearMeasures("directory-search-data-unpack");
      performance.clearMeasures("directory-search-runtime-init");
      performance.clearMeasures("directory-update-scheduling");
      window.findFirstUncheckedCheckboxLabelInLastDialog = () => {
        const dialogs = Array.from(document.querySelectorAll('[role="dialog"][aria-modal="true"]'))
          .filter((dialog) => window.isVisibleElement(dialog));
        return Array.from(dialogs.at(-1)?.querySelectorAll("label") ?? [])
          .find((label) => {
            const input = label.querySelector('input[type="checkbox"]');
            return input && !input.checked && window.isVisibleElement(label);
          });
      };
      window.openMobileFilters = async () => {
        const visibleFilterScreen = Array.from(document.querySelectorAll("#mobile-filter-screen"))
          .some((element) => window.isVisibleElement(element));
        if (visibleFilterScreen) return;
        const filtersButton = Array.from(document.querySelectorAll("aside button"))
          .find((button) => button.textContent?.trim().startsWith("Filters") && window.isVisibleElement(button));
        if (!filtersButton) throw new Error("Mobile Filters button not found");
        filtersButton.click();
        await waitFor(() => Array.from(document.querySelectorAll("#mobile-filter-screen"))
          .some((element) => window.isVisibleElement(element)), 2000);
      };
      window.currentResultsHeading = () => {
        const clientMain = document.getElementById("directory-listings-client-main");
        const headings = Array.from((clientMain ?? document).querySelectorAll("h2"));
        if (clientMain) {
          return headings.find((heading) => heading.textContent?.includes("Found") || heading.textContent?.includes("found"))
            ?.textContent?.trim() ?? "";
        }
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
        const waitStarted = performance.now();
        while (state.resultsAt === null && performance.now() - waitStarted < 5000) {
          const heading = currentResultsHeading();
          const clientMain = document.getElementById("directory-listings-client-main");
          if ((heading && heading !== state.startingHeading) || (clientMain && !state.hadClientMain)) {
            state.resultsAt = performance.now();
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 25));
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
        if (state.resultsAt === null) {
          const heading = currentResultsHeading();
          const clientMain = document.getElementById("directory-listings-client-main");
          if ((heading && heading !== state.startingHeading) || (clientMain && !state.hadClientMain)) {
            state.resultsAt = performance.now();
          }
        }
        state.stop?.();
        const sinceStart = (time) => typeof time === "number" ? Math.round(time - state.start) : null;
        const { reactCommitAtMs, ...phaseTimings } = directoryPerformanceTimings(state.start);
        return {
          checkedMs: sinceStart(state.checkedAt),
          urlMs: sinceStart(state.urlAt),
          resultsMs: reactCommitAtMs === null ? sinceStart(state.resultsAt) : sinceStart(reactCommitAtMs),
          longTaskMs: Math.round(state.longTasks.reduce((sum, duration) => sum + duration, 0)),
          ...phaseTimings,
          finalUrl: window.location.href,
          resultHeading: currentResultsHeading(),
          viewportWidth: window.innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          robotsContent: document.querySelector('meta[name="robots"]')?.getAttribute("content") ?? ""
        };
      };
      window.directoryPerformanceTimings = (startedAt) => {
        const latestMeasure = (name) => performance.getEntriesByName(name, "measure")
          .filter((entry) => entry.startTime >= startedAt)
          .at(-1);
        const moduleMeasure = latestMeasure("directory-client-modules");
        const modelMeasure = latestMeasure("directory-model-build");
        const reactMeasure = latestMeasure("directory-react-commit");
        const dataFetchMeasure = latestMeasure("directory-search-data-fetch");
        const dataTextMeasure = latestMeasure("directory-search-data-text");
        const dataParseMeasure = latestMeasure("directory-search-data-parse");
        const dataUnpackMeasure = latestMeasure("directory-search-data-unpack");
        const runtimeInitMeasure = latestMeasure("directory-search-runtime-init");
        const schedulingMeasure = latestMeasure("directory-update-scheduling");
        const scripts = performance.getEntriesByType("resource")
          .filter((entry) => entry.initiatorType === "script" && entry.startTime >= startedAt);
        const scriptResourceMs = scripts.length ? Math.max(...scripts.map((entry) => entry.duration)) : null;
        const latestScriptResponse = scripts.length ? Math.max(...scripts.map((entry) => entry.responseEnd)) : null;
        const moduleReadyAt = moduleMeasure ? moduleMeasure.startTime + moduleMeasure.duration : null;
        const moduleEvaluationMs = moduleReadyAt !== null && latestScriptResponse !== null
          ? Math.max(0, moduleReadyAt - latestScriptResponse)
          : null;
        return {
          reactCommitAtMs: reactMeasure ? reactMeasure.startTime + reactMeasure.duration : null,
          moduleLoadMs: moduleMeasure ? Math.round(moduleMeasure.duration) : null,
          modelBuildMs: modelMeasure ? Math.round(modelMeasure.duration) : null,
          reactCommitMs: reactMeasure ? Math.round(reactMeasure.duration) : null,
          scriptResourceMs: scriptResourceMs === null ? null : Math.round(scriptResourceMs),
          moduleEvaluationMs: moduleEvaluationMs === null ? null : Math.round(moduleEvaluationMs),
          dataFetchMs: dataFetchMeasure ? Math.round(dataFetchMeasure.duration) : null,
          dataTextMs: dataTextMeasure ? Math.round(dataTextMeasure.duration) : null,
          dataParseMs: dataParseMeasure ? Math.round(dataParseMeasure.duration) : null,
          dataUnpackMs: dataUnpackMeasure ? Math.round(dataUnpackMeasure.duration) : null,
          runtimeInitMs: runtimeInitMeasure ? Math.round(runtimeInitMeasure.duration) : null,
          schedulingMs: schedulingMeasure ? Math.round(schedulingMeasure.duration) : null
        };
      };
    })()
  `;
}

function printResults(results: RunResult[]) {
  const scenarioIds = [
    ...selectedScenarios.map((scenario) => scenario.id),
    "query-string-activation",
    "homepage-search-submission"
  ];
  const phases: InteractionPhase[] = ["first", "subsequent", "navigation"];
  const summary = selectedCacheModes().flatMap((cacheMode) => scenarioIds.flatMap((scenario) => phases.map((interactionPhase) => {
    const items = results.filter((result) =>
      result.scenario === scenario && result.cacheMode === cacheMode && result.interactionPhase === interactionPhase
    );
    if (!items.length) return null;
    return {
      cacheMode,
      scenario,
      interactionPhase,
      runs: items.length,
      checkedMedianMs: median(items.map((item) => item.checkedMs)),
      checkedSlowestMs: slowest(items.map((item) => item.checkedMs)),
      urlMedianMs: median(items.map((item) => item.urlMs)),
      urlSlowestMs: slowest(items.map((item) => item.urlMs)),
      resultsMedianMs: median(items.map((item) => item.resultsMs)),
      resultsSlowestMs: slowest(items.map((item) => item.resultsMs)),
      longTaskMedianMs: median(items.map((item) => item.longTaskMs)),
      longTaskSlowestMs: slowest(items.map((item) => item.longTaskMs)),
      moduleMedianMs: median(items.map((item) => item.moduleLoadMs)),
      modelMedianMs: median(items.map((item) => item.modelBuildMs)),
      reactMedianMs: median(items.map((item) => item.reactCommitMs)),
      resourceMedianMs: median(items.map((item) => item.scriptResourceMs)),
      evaluationMedianMs: median(items.map((item) => item.moduleEvaluationMs)),
      dataFetchMedianMs: median(items.map((item) => item.dataFetchMs)),
      dataParseMedianMs: median(items.map((item) => item.dataParseMs)),
      dataUnpackMedianMs: median(items.map((item) => item.dataUnpackMs)),
      schedulingMedianMs: median(items.map((item) => item.schedulingMs)),
      enhancerModuleMedianMs: median(items.map((item) => item.enhancerModuleAtMs ?? null)),
      queryEffectMedianMs: median(items.map((item) => item.queryEffectAtMs ?? null)),
      updateStartedMedianMs: median(items.map((item) => item.updateStartedAtMs ?? null)),
      resultPaintMedianMs: median(items.map((item) => item.resultPaintAtMs ?? null)),
      startupLongTaskMedianMs: median(items.map((item) => item.startupLongTaskMs ?? null)),
      startupLongestTaskMs: slowest(items.map((item) => item.startupLongestTaskMs ?? null))
    };
  }).filter((item): item is NonNullable<typeof item> => Boolean(item))));

  console.log("[benchmark] completed successfully");
  console.table(summary);
  if (PRINT_RAW_RUNS) {
    console.log("Raw runs:");
    console.table(results);
  }
}

function printBenchmarkHeader() {
  console.log("Mobile filter reaction benchmark");
  console.log(`URL: ${RESTAURANTS_URL}`);
  console.log(`RUNS=${RUNS} CPU_THROTTLE=${CPU_THROTTLE} CACHE_MODE=${CACHE_MODE}`);
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

function readBrowserVersion(chromePath: string) {
  const result = process.platform === "win32"
    ? spawnSync("powershell.exe", [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        "(Get-Item -LiteralPath $env:BENCHMARK_BROWSER_PATH).VersionInfo.ProductVersion"
      ], {
        encoding: "utf8",
        windowsHide: true,
        timeout: 5_000,
        env: { ...process.env, BENCHMARK_BROWSER_PATH: chromePath }
      })
    : spawnSync(chromePath, ["--version"], {
        encoding: "utf8",
        windowsHide: true,
        timeout: 5_000
      });
  const output = `${result.stdout}\n${result.stderr}`;
  return output.split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => process.platform === "win32" ? /^\d+(?:\.\d+)+$/.test(line) : /(?:Google Chrome|Microsoft Edge|Chromium)\s+\d/i.test(line))
    ?? "version unavailable";
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

function observeBrowserProcess(browser: ChildProcessWithoutNullStreams) {
  let processError = "";
  let exitDescription = "";
  let stderrTail = "";

  browser.stderr.setEncoding("utf8");
  browser.stderr.on("data", (chunk: string) => {
    stderrTail = `${stderrTail}${chunk}`.slice(-BROWSER_STDERR_LIMIT);
  });
  browser.on("error", (error) => {
    processError = error.message;
  });
  browser.on("exit", (code, signal) => {
    exitDescription = `browser exited code=${code ?? "null"} signal=${signal ?? "null"}`;
  });

  return {
    describe() {
      return [processError, exitDescription, stderrTail.trim() ? `stderr tail: ${stderrTail.trim()}` : ""]
        .filter(Boolean)
        .join("; ");
    }
  };
}

async function createPageTarget(port: number, browserDescription: () => string) {
  try {
    await waitForJson(`http://127.0.0.1:${port}/json/version`);
    return await waitForJson(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" });
  } catch (error) {
    const details = browserDescription();
    throw new Error(
      `Browser did not expose its CDP endpoint on port ${port}: ${errorMessage(error)}${details ? `; ${details}` : ""}`,
      { cause: error }
    );
  }
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
  const pending = new Map<number, {
    resolve: (value: CdpResponseResult) => void;
    reject: (error: Error) => void;
    timeout: ReturnType<typeof setTimeout>;
  }>();
  const eventQueue = createCdpEventQueue();

  function rejectPending(error: Error) {
    pending.forEach(({ reject, timeout }) => {
      clearTimeout(timeout);
      reject(error);
    });
    pending.clear();
    eventQueue.close(error);
  }

  ws.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data)) as CdpMessage;
    if (message.id && pending.has(message.id)) {
      const callbacks = pending.get(message.id);
      pending.delete(message.id);
      if (!callbacks) return;
      clearTimeout(callbacks.timeout);
      if (message.error) callbacks.reject(new Error(JSON.stringify(message.error)));
      else callbacks.resolve(message.result ?? {});
    } else if (message.method) {
      eventQueue.push({ method: message.method, params: message.params });
    }
  });

  return new Promise((resolve, reject) => {
    ws.addEventListener("open", () => {
      resolve({
        send(method, params = {}, timeoutMs = 20_000) {
          const messageId = ++id;
          return new Promise((resolveSend, rejectSend) => {
            const timeout = setTimeout(() => {
              pending.delete(messageId);
              rejectSend(new Error(`CDP command ${method} timed out after ${timeoutMs}ms.`));
            }, timeoutMs);
            pending.set(messageId, { resolve: resolveSend, reject: rejectSend, timeout });
            ws.send(JSON.stringify({ id: messageId, method, params }));
          });
        },
        waitForNext(method, timeout = 10_000) {
          return eventQueue.waitForNext(method, timeout);
        },
        close() {
          ws.close();
        }
      });
    });
    ws.addEventListener("error", () => {
      const error = new Error("CDP WebSocket connection failed.");
      rejectPending(error);
      reject(error);
    });
    ws.addEventListener("close", () => {
      rejectPending(new Error("CDP WebSocket closed before the benchmark completed."));
    });
  });
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pressEscape(client: CdpClient) {
  await client.send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Escape",
    code: "Escape",
    windowsVirtualKeyCode: 27,
    nativeVirtualKeyCode: 27
  });
  await client.send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Escape",
    code: "Escape",
    windowsVirtualKeyCode: 27,
    nativeVirtualKeyCode: 27
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
