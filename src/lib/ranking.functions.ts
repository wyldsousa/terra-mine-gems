import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { PublicRow } from "./publicRanking";
import { rankingFetch } from "./rankingConnection";
import { rankingPublicConfig } from "./rankingConfig";

/** SQL returns only opted-in, individually permitted public fields. Never use admin. */
export const getRankingSnapshot = createServerFn({ method: "GET" }).handler(async () => {
  // External hosts may have only Vite's bundled public settings, not runtime env.
  // Both pairs contain public-only credentials; never use a service/admin key.
  const { url, key } = rankingPublicConfig({
    url: process.env["SUPABASE_URL"],
    key: process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"],
  }, {
    url: import.meta.env["VITE_SUPABASE_URL"],
    key: import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ?? import.meta.env["VITE_SUPABASE_ANON_KEY"],
  });
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
    console.error("[ranking] Public snapshot request failed", { code: /^[A-Za-z0-9_]{1,32}$/.test(error.code) ? error.code : "RANKING_REQUEST_FAILED" });
    throw new Error("Ranking temporariamente indisponível.");
  }
  return { rows: (data ?? []) as PublicRow[], fetchedAt: new Date().toISOString() };
});