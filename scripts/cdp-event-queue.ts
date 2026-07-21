export type CdpQueuedEvent = {
  method: string;
  params?: Record<string, unknown>;
};

type PendingWaiter = {
  method: string;
  resolve: (event: CdpQueuedEvent) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
};

export function createCdpEventQueue() {
  const waiters: PendingWaiter[] = [];
  let closedError: Error | null = null;

  function push(event: CdpQueuedEvent) {
    const waiterIndex = waiters.findIndex((waiter) => waiter.method === event.method);
    if (waiterIndex === -1) return;

    const [waiter] = waiters.splice(waiterIndex, 1);
    clearTimeout(waiter.timeout);
    waiter.resolve(event);
  }

  function waitForNext(method: string, timeoutMs = 10_000) {
    if (closedError) return Promise.reject(closedError);

    return new Promise<CdpQueuedEvent>((resolve, reject) => {
      const waiter: PendingWaiter = {
        method,
        resolve,
        reject,
        timeout: setTimeout(() => {
          const index = waiters.indexOf(waiter);
          if (index !== -1) waiters.splice(index, 1);
          reject(new Error(`Timed out waiting for next CDP event ${method} after ${timeoutMs}ms.`));
        }, timeoutMs)
      };
      waiters.push(waiter);
    });
  }

  function close(error: Error) {
    if (closedError) return;
    closedError = error;
    waiters.splice(0).forEach((waiter) => {
      clearTimeout(waiter.timeout);
      waiter.reject(error);
    });
  }

  return { push, waitForNext, close };
}
