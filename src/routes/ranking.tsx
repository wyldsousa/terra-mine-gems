import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useGameMode } from "@/hooks/useGameMode";
import { fmtCur } from "@/components/land/LandPages";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney } from "@/lib/format";
import type { RankGame } from "@/lib/profile";

export const Route = createFileRoute("/ranking")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "🏆 Ranking — TerraMine Calculator" },
      { name: "description", content: "Ranking dos jogadores que escolheram participar: mais minas e maior renda mensal." },
      { property: "og:title", content: "Ranking — TerraMine Calculator" },
      { property: "og:description", content: "Ranking dos jogadores que escolheram participar." },
    ],
  }),
  component: RankingPage,
});

interface Row { user_id: string; units_count: number; monthly_income: number; profiles: { display_name: string; avatar_url: string | null; ranking_opt_in: boolean } | null }

const GAMES: { id: RankGame; label: string; unit: string }[] = [
  { id: "terramine", label: "⛏️ TerraMine", unit: "minas" },
  { id: "atlas", label: "🌎 Atlas Earth", unit: "terrenos" },
  { id: "fortune", label: "🍀 Fortune World", unit: "parcelas" },
];
const MEDAL = ["🥇", "🥈", "🥉"];

function RankingPage() {
  const { user } = useAuth();
  const { mode } = useGameMode();
  const [game, setGame] = useState<RankGame>(mode);
  useEffect(() => setGame(mode), [mode]);
  const money = (v: number) => fmtCur(v, game === "fortune" ? "EUR" : "USD");
  const [by, setBy] = useState<"units" | "income">("income");
  const [rows, setRows] = useState<Row[] | null>(null);
  const unit = GAMES.find((g) => g.id === game)!.unit;

  useEffect(() => {
    setRows(null);
    supabase
      .from("public_stats")
      .select("user_id, units_count, monthly_income, profiles(display_name, avatar_url, ranking_opt_in)")
      .eq("game", game)
      .then(({ data }) => setRows(((data ?? []) as unknown as Row[]).filter((r) => r.profiles?.ranking_opt_in && (r.units_count > 0 || Number(r.monthly_income) > 0))));
  }, [game, user]);

  const val = (r: Row) => (by === "units" ? r.units_count : Number(r.monthly_income));
  const sorted = [...(rows ?? [])].sort((a, b) => val(b) - val(a));
  const myIdx = user ? sorted.findIndex((r) => r.user_id === user.id) : -1;
  const fmt = (r: Row) => (by === "units" ? `${r.units_count} ${unit}` : `${money(Number(r.monthly_income))}/mês`);
  const diff = (a: Row, b: Row) => (by === "units" ? `${Math.abs(a.units_count - b.units_count)} ${unit}` : money(Math.abs(Number(a.monthly_income) - Number(b.monthly_income))));

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold">🏆 Ranking</h1>
      <p className="text-sm text-muted-foreground">Somente jogadores que ativaram "Participar do ranking" no perfil. Dados enviados pelos próprios usuários.</p>
      <div className="flex flex-wrap gap-2">
        {GAMES.map((g) => <Button key={g.id} size="sm" variant={game === g.id ? "default" : "outline"} onClick={() => setGame(g.id)}>{g.label}</Button>)}
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant={by === "income" ? "secondary" : "ghost"} onClick={() => setBy("income")}>Maior rendimento mensal</Button>
        <Button size="sm" variant={by === "units" ? "secondary" : "ghost"} onClick={() => setBy("units")}>Maior quantidade de {unit}</Button>
      </div>

      {myIdx >= 0 && sorted[myIdx] && (
        <section className="panel-glow space-y-1 p-4 text-sm">
          <p className="text-lg font-semibold">Você está em #{myIdx + 1}</p>
          <p>{sorted[myIdx]!.units_count} {unit} · {money(Number(sorted[myIdx]!.monthly_income))}/mês</p>
          {myIdx > 0 && <p className="text-muted-foreground">Faltam {diff(sorted[myIdx - 1]!, sorted[myIdx]!)} para #{myIdx}</p>}
          {myIdx < sorted.length - 1 && <p className="text-muted-foreground">Vantagem de {diff(sorted[myIdx]!, sorted[myIdx + 1]!)} sobre #{myIdx + 2}</p>}
        </section>
      )}
      {!user && <p className="text-sm"><Link to="/perfil" className="text-primary">Entre no perfil</Link> para participar.</p>}

      <section className="panel divide-y divide-border">
        {rows === null && <p className="p-4 text-sm text-muted-foreground">Carregando…</p>}
        {rows && sorted.length === 0 && <p className="p-4 text-sm text-muted-foreground">Ainda não há participantes neste ranking.</p>}
        {sorted.map((r, i) => (
          <div key={r.user_id} className={`flex items-center gap-3 p-3 ${r.user_id === user?.id ? "bg-secondary" : ""}`}>
            <span className="w-8 text-center font-semibold">{MEDAL[i] ?? `#${i + 1}`}</span>
            {r.profiles?.avatar_url ? <img src={r.profiles.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" /> : <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">👤</span>}
            <span className="flex-1 truncate">{r.profiles?.display_name}</span>
            <span className="num text-sm font-semibold">{fmt(r)}</span>
          </div>
        ))}
      </section>
    </div>
  );
}
