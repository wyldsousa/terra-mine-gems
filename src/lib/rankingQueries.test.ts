import { QueryClient, QueryObserver, focusManager, onlineManager } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./ranking.functions", () => ({ getRankingSnapshot: vi.fn() }));
import { getRankingSnapshot } from "./ranking.functions";
import { rankingQuery } from "./rankingQueries";

afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); focusManager.setFocused(undefined); onlineManager.setOnline(true); });

describe("manual-only public ranking", () => {
  it("does not poll, refetch on focus/reconnect, or retry automatically", async () => {
    vi.useFakeTimers();
    vi.mocked(getRankingSnapshot).mockResolvedValue({ rows: [], fetchedAt: "2026-10-10T00:00:00Z" });
    const client = new QueryClient();
    client.mount();
    await client.fetchQuery({ ...rankingQuery(), staleTime: 0 });
    const observer = new QueryObserver(client, rankingQuery());
    const unsubscribe = observer.subscribe(() => {});
    await vi.advanceTimersByTimeAsync(180_000);
    focusManager.setFocused(false); focusManager.setFocused(true);
    onlineManager.setOnline(false); onlineManager.setOnline(true);
    await vi.advanceTimersByTimeAsync(180_000);
    expect(getRankingSnapshot).toHaveBeenCalledTimes(1);
    unsubscribe(); client.unmount(); client.clear();
  });

  it("fetches fresh data on entry and explicit manual refresh", async () => {
    vi.mocked(getRankingSnapshot).mockResolvedValue({ rows: [], fetchedAt: "2026-10-10T00:00:00Z" });
    const client = new QueryClient();
    await client.fetchQuery({ ...rankingQuery(), staleTime: 0 });
    await client.fetchQuery({ ...rankingQuery(), staleTime: 0 });
    const observer = new QueryObserver(client, rankingQuery());
    await observer.refetch();
    expect(getRankingSnapshot).toHaveBeenCalledTimes(3);
    client.clear();
  });

  it("does not retry a failed entry request", async () => {
    vi.mocked(getRankingSnapshot).mockRejectedValue(new Error("Connection unavailable"));
    const client = new QueryClient();
    await expect(client.fetchQuery({ ...rankingQuery(), staleTime: 0 })).rejects.toThrow("Connection unavailable");
    expect(getRankingSnapshot).toHaveBeenCalledTimes(1);
    client.clear();
  });

  it("preserves previous real data when manual refresh fails", async () => {
    const previous = { rows: [], fetchedAt: "2026-10-10T00:00:00Z" };
    vi.mocked(getRankingSnapshot).mockResolvedValueOnce(previous).mockRejectedValueOnce(new Error("Offline"));
    const client = new QueryClient();
    await client.fetchQuery({ ...rankingQuery(), staleTime: 0 });
    const observer = new QueryObserver(client, rankingQuery());
    const result = await observer.refetch();
    expect(result.isRefetchError).toBe(true);
    expect(result.data).toEqual(previous);
    client.clear();
  });
});