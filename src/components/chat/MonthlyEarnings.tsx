import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { monthlyEarnings, type EarningRow } from "@/lib/chatActions";

const LABELS = [["AB", "🌎 Atlas Bucks"], ["FC", "🍀 Fortune Coins"], ["TB", "⛏️ Terra Bucks"]] as const;

/** Private monthly report of coins logged via Chat IA (never public, not a wallet balance). */
export function MonthlyEarnings({ userId }: { userId: string }) {
  const { data, isError } = useQuery({
    queryKey: ["coin-earnings", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("coin_earnings").select("game,currency,amount,source,earned_at").eq("user_id", userId).order("earned_at", { ascending: false }).limit(1000);
      if (error) throw error;
      return data as EarningRow[];
    },
  });
  const m = monthlyEarnings(data ?? []);
  return (
    <section className="panel space-y-2 p-5">
      <h2 className="font-semibold">🪙 Ganhos do mês</h2>
      {isError && <p className="text-xs text-muted-foreground">Não foi possível carregar os ganhos.</p>}
      {LABELS.map(([c, l]) => (
        <details key={c} className="text-sm">
          <summary className="flex cursor-pointer justify-between"><span>{l}</span><span className="num">{m.totals[c]} {c}</span></summary>
          {Object.entries(m.sources[c] ?? {}).map(([s, v]) => <p key={s} className="flex justify-between pl-4 text-xs text-muted-foreground"><span>{s}</span><span>{v} {c}</span></p>)}
        </details>
      ))}
      <p className="text-xs text-muted-foreground">Registros feitos pelo Chat IA. Privado — não é o saldo das carteiras.</p>
    </section>
  );
}
