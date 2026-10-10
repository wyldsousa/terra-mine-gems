/** Bound requests and retries; never log credentials or the RPC response body. */
export const RANK_REQUEST_TIMEOUT_MS = 12_000;
export function rankingRetryDelay(attempt: number) {
  return Math.min(2_000 * 2 ** Math.max(0, attempt), 60_000);
}

export function rankingPollInterval(failures: number) {
  return Math.min(30_000 * 2 ** Math.max(0, failures), 120_000);
}

export async function rankingFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (init?.signal?.aborted) controller.abort();
  init?.signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, RANK_REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
    init?.signal?.removeEventListener("abort", abort);
  }
}