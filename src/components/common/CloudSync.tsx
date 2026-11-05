import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Json } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAppState, sanitize } from "@/hooks/useAppState";
import { useGameMode } from "@/hooks/useGameMode";
import { landRentStateSchema } from "@/data/landRent";
import type { LandState } from "@/data/landGames";
import { mergeMines } from "@/lib/cloudSync";
import { localIncomes, syncPublicStats, type RankGame } from "@/lib/profile";
import { saveLandRentSummary } from "@/lib/landRentProfile";

const GAMES: RankGame[] = ["terramine", "atlas", "fortune", "land-rents"];
const unitsOf = (s: LandState) => Object.values(s.counts).reduce((a, b) => a + (Number(b) || 0), 0);

/** Keeps each signed-in user's calculator data in their own account and refreshes ranking summaries after successful saves. */
export function CloudSync() {
  const { user } = useAuth();
  const app = useAppState();
  const game = useGameMode();
  const qc = useQueryClient();
  const readyFor = useRef<string | null>(null);
  const lastSent = useRef<string>("");

  // Pull + merge once per sign-in.
  useEffect(() => {
    if (!user || !app.hydrated || !game.hydrated) { if (!user) readyFor.current = null; return; }
    if (readyFor.current === user.id) return;
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase.from("user_calculator_data").select("game,data").eq("user_id", user.id);
      if (cancelled || error) return;
      const flag = `cloud-synced-${user.id}`;
      const first = localStorage.getItem(flag) !== "yes";
      const row = (g: string) => data?.find((r) => r.game === g)?.data as Record<string, unknown> | undefined;
      const tm = row("terramine");
      if (tm) {
        const server = sanitize(tm);
        const mines = mergeMines(app.state.mines, server.mines, first);
        app.replaceState({ ...app.state, ...(first && app.state.mines.length && !tm["mines"] ? {} : { params: server.params, goals: server.goals, balance: server.balance }), mines });
      }
      for (const g of ["atlas", "fortune"] as const) {
        const s = row(g) as unknown as LandState | undefined;
        if (s && (!first || unitsOf(s) > 0 || unitsOf(game.land[g]) === 0)) game.setLand(g, (prev) => ({ ...prev, ...s, params: { ...prev.params, ...s.params } }));
      }
      const lr = landRentStateSchema.safeParse(row("land-rents"));
      if (lr.success && (!first || lr.data.plots > 0 || game.landRent.plots === 0)) game.setLandRent(lr.data);
      localStorage.setItem(flag, "yes");
      readyFor.current = user.id;
      lastSent.current = "";
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, app.hydrated, game.hydrated]);

  // Push changes (debounced), then update ranking summaries.
  useEffect(() => {
    if (!user || readyFor.current !== user.id) return;
    const payload = { terramine: app.state, atlas: game.land.atlas, fortune: game.land.fortune, "land-rents": game.landRent };
    const json = JSON.stringify(payload);
    if (json === lastSent.current) return;
    const timer = setTimeout(async () => {
      const rows = GAMES.map((g) => ({ user_id: user.id, game: g, data: payload[g] as unknown as Json, updated_at: new Date().toISOString() }));
      const { error } = await supabase.from("user_calculator_data").upsert(rows, { onConflict: "user_id,game" });
      if (error) return; // retried on next change; local copy preserved
      const firstPush = lastSent.current === "";
      lastSent.current = json;
      if (firstPush) return; // nothing changed by the user yet
      try {
        const { data: prof } = await supabase.from("profiles").select("ranking_opt_in").eq("id", user.id).maybeSingle();
        if (prof?.ranking_opt_in) {
          const inc = localIncomes(app.state.mines, app.state.params, game.land, game.landRent);
          const games = (["terramine", "atlas", "fortune"] as const).filter((g) => inc[g].units > 0 || localStorage.getItem(`ranking-owned-${user.id}-${g}`) === "yes");
          await syncPublicStats(user.id, inc, [...games]);
          for (const g of games) localStorage.setItem(`ranking-owned-${user.id}-${g}`, "yes");
          if (game.landRent.plots > 0 || localStorage.getItem(`ranking-owned-${user.id}-land-rents`) === "yes") {
            await saveLandRentSummary(user.id, game.landRent);
            localStorage.setItem(`ranking-owned-${user.id}-land-rents`, "yes");
          }
          await qc.invalidateQueries({ queryKey: ["public-ranking"] });
        }
      } catch { /* ranking summary retried on next change */ }
    }, 1200);
    return () => clearTimeout(timer);
  }, [user, app.state, game.land, game.landRent, qc]);

  return null;
}
