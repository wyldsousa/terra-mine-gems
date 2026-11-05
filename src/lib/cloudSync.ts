import type { Mine } from "@/types";

/** First sync on a device merges local + server (no loss); later syncs trust the server copy. */
export function mergeMines(local: Mine[], server: Mine[], firstSync: boolean): Mine[] {
  if (!firstSync) return server;
  const byId = new Map<string, Mine>();
  for (const m of server) byId.set(m.id, m);
  for (const m of local) if (!byId.has(m.id)) byId.set(m.id, m);
  return [...byId.values()].sort((a, b) => a.createdAt - b.createdAt);
}

export const LIST_PAGE_SIZE = 10;
export function visibleSlice<T>(items: T[], pages: number): T[] {
  return items.slice(0, Math.max(1, Math.floor(pages)) * LIST_PAGE_SIZE);
}
