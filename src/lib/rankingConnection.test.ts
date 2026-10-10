import { afterEach, describe, expect, it, vi } from "vitest";
import { RANK_REQUEST_TIMEOUT_MS, rankingFetch } from "./rankingConnection";

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("ranking single-request connection", () => {
  it("aborts a stalled database request after twelve seconds", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn((_input, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener("abort", () => reject(new Error("aborted")));
    })));
    const request = rankingFetch("https://example.test/rpc");
    const result = expect(request).rejects.toThrow("aborted");
    await vi.advanceTimersByTimeAsync(RANK_REQUEST_TIMEOUT_MS);
    await result;
  });
  it("keeps a successful empty response distinct from connection failure", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("[]", { status: 200 })));
    const response = await rankingFetch("https://example.test/rpc");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });
  it("does not convert database permission failures to an empty ranking", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response('{"code":"42501"}', { status: 403 })));
    const response = await rankingFetch("https://example.test/rpc");
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ code: "42501" });
  });
});