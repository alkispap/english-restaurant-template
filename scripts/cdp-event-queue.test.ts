import assert from "node:assert/strict";
import { createCdpEventQueue } from "./cdp-event-queue";

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  const queue = createCdpEventQueue();

  queue.push({ method: "Page.loadEventFired", params: { sequence: "stale" } });
  let resolved = false;
  const nextLoad = queue.waitForNext("Page.loadEventFired", 500).then((event) => {
    resolved = true;
    return event;
  });
  await Promise.resolve();
  assert.equal(resolved, false, "a stale event must not satisfy a future navigation waiter");

  queue.push({ method: "Runtime.consoleAPICalled" });
  assert.equal(resolved, false, "an unrelated event must not satisfy the navigation waiter");
  queue.push({ method: "Page.loadEventFired", params: { sequence: "current" } });
  assert.deepEqual(await nextLoad, {
    method: "Page.loadEventFired",
    params: { sequence: "current" }
  });

  const timeoutQueue = createCdpEventQueue();
  await assert.rejects(
    timeoutQueue.waitForNext("Page.loadEventFired", 5),
    /Timed out waiting for next CDP event Page\.loadEventFired after 5ms/
  );

  const closedQueue = createCdpEventQueue();
  const pending = closedQueue.waitForNext("Page.loadEventFired", 500);
  closedQueue.close(new Error("CDP connection closed before navigation completed."));
  await assert.rejects(pending, /CDP connection closed before navigation completed/);
  await assert.rejects(
    closedQueue.waitForNext("Page.loadEventFired", 500),
    /CDP connection closed before navigation completed/
  );

  console.log("CDP event queue tests passed");
}
