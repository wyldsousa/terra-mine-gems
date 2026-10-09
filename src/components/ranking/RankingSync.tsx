import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useAppState } from "@/hooks/useAppState";
import { useGameMode } from "@/hooks/useGameMode";
import { supabase } from "@/integrations/supabase/client";
import { localIncomes, syncPublicStats, type RankGame } from "@/lib/profile";
import { RANK_GAMES, RANK_REFRESH_MS, SYNC_DEBOUNCE_MS } from "@/lib/publicRanking";

/** Background publication is gated by consent; unrelated/empty devices never erase saved summaries. */
export function RankingSync() {
  const { user } = useAuth();
  const { mines, params, hydrated } = useAppState();
  const { land, hydrated: landReady } = useGameMode();
  const queryClient = useQueryClient();
  const incomes = useMemo(() => localIncomes(mines, params, land), [mines, params, land]);
  const [consent, setConsent] = useState<{ userId: string; enabled: boolean } | null>(null);
  const [retry, setRetry] = useState(0);
  const lastPublished = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!user) { setConsent(null); return; }
    let alive = true;
    const read = async () => {
      const { data, error } = await supabase.from("profiles").select("ranking_opt_in").eq("id", user.id).maybeSingle();
      if (alive && !error) setConsent({ userId: user.id, enabled: data?.ranking_opt_in ?? false });
    };
    void read();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void read(); }, RANK_REFRESH_MS);
    window.addEventListener("profile-sharing-changed", read);
    window.addEventListener("online", read);
    return () => { alive = false; clearInterval(timer); window.removeEventListener("profile-sharing-changed", read); window.removeEventListener("online", read); };
  }, [user?.id]);

  useEffect(() => {
    if (!user || !hydrated || !landReady || !consent?.enabled || consent.userId !== user.id) return;
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    const timer = setTimeout(async () => {
      try {
        const games = RANK_GAMES.filter((game) => incomes[game].units > 0 || localStorage.getItem(`ranking-owned-${user.id}-${game}`) === "yes");
        const changed = games.filter((game) => lastPublished.current[`${user.id}-${game}`] !== JSON.stringify(incomes[game]));
        if (!changed.length) return;
        // Compare with the stored snapshot before writing; reconnect/mount doesn't churn timestamps.
        const { data, error } = await supabase.from("public_stats").select("*").eq("user_id", user.id);
        if (error) throw error;
        const updates: RankGame[] = [];
        for (const game of changed) {
          const old = data?.find((r) => r.game === game);
          const inc = incomes[game];
          if (!old || old.units_count !== inc.units || Number(old.monthly_income) !== (inc.monthly ?? 0) || Number(old.yearly_income) !== inc.yearly || Number(old.daily_income) !== inc.daily || Number(old.weekly_income) !== inc.weekly || old.currency !== inc.currency || old.configured !== (inc.monthly !== null)) updates.push(game);
        }
        if (cancelled) return;
        await syncPublicStats(user.id, incomes, updates);
        for (const game of changed) {
          lastPublished.current[`${user.id}-${game}`] = JSON.stringify(incomes[game]);
          localStorage.setItem(`ranking-owned-${user.id}-${game}`, "yes");
        }
        if (updates.length) void queryClient.invalidateQueries({ queryKey: ["public-ranking"] });
      } catch {
        if (!cancelled) retryTimer = setTimeout(() => setRetry((n) => n + 1), RANK_REFRESH_MS);
      }
    }, SYNC_DEBOUNCE_MS);
    return () => { cancelled = true; clearTimeout(timer); clearTimeout(retryTimer); };
  }, [user?.id, incomes, hydrated, landReady, consent, retry, queryClient]);
  return null;
}