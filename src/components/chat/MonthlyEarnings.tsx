import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { coinBalances } from "@/lib/chatActions";

export const COIN_LABELS = [["AB", "🌎 Atlas Bucks"], ["FC", "🍀 Fortune Coins"], ["TB", "⛏️ Terra Bucks"]] as const;

/** Private coin balances summary with a link to the full movements page. */
export function MonthlyEarnings({ userId }: { userId: string }) {
  const { data } = useQuery({
    queryKey: ["coin-earnings", userId, "all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("coin_earnings").select("currency,amount,kind").eq("user_id", userId).limit(10000);
      if (error) throw error;
      return data;
    },
  });
  const b = coinBalances(data ?? []);
  return (
    <section className="panel space-y-2 p-5">
      <h2 className="font-semibold">🏦 Minhas moedas</h2>
      {COIN_LABELS.map(([c, l]) => <p key={c} className="flex justify-between text-sm"><span>{l}</span><span className="num">{b[c]} {c}</span></p>)}
      <Button asChild size="sm" className="w-full"><Link to="/moedas">Abrir movimentações</Link></Button>
    </section>
  );
}
