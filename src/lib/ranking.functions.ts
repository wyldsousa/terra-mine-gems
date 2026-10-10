import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { PublicRow } from "./publicRanking";
import { rankingFetch } from "./rankingConnection";

/** SQL returns only opted-in, individually permitted public fields. Never use admin. */
export const getRankingSnapshot = createServerFn({ method: "GET" }).handler(async () => {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];
  const url = process.env["SUPABASE_URL"];
  if (!key || !url) {
    console.error("[ranking] Missing server public-read configuration", { hasUrl: Boolean(url), hasKey: Boolean(key) });
    throw new Error("Ranking temporariamente indisponível.");
  }
  const client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey", key);
      return rankingFetch(input, { ...init, headers });
    } },
  });
  const { data, error } = await client.rpc("public_ranking_snapshot");
  if (error) {
    console.error("[ranking] Public snapshot request failed", { code: error.code, message: error.message });
    throw new Error("Ranking temporariamente indisponível.");
  }
  return { rows: (data ?? []) as PublicRow[], fetchedAt: new Date().toISOString() };
});