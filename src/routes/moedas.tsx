import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/common/NumericInput";
import { COIN_LABELS } from "@/components/chat/MonthlyEarnings";
import { CURRENCY_BY_GAME, coinBalances, monthlyEarnings, type CoinGame } from "@/lib/chatActions";

export const Route = createFileRoute("/moedas")({
  head: () => ({
    meta: [
      { title: "Minhas moedas — entradas e saídas" },
      { name: "description", content: "Saldos e histórico de Atlas Bucks, Fortune Coins e Terra Bucks." },
      { property: "og:title", content: "Minhas moedas — entradas e saídas" },
      { property: "og:description", content: "Saldos e histórico de Atlas Bucks, Fortune Coins e Terra Bucks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CoinsPage,
});

const GAMES: { id: CoinGame; label: string }[] = [{ id: "atlas", label: "🌎 Atlas Earth (AB)" }, { id: "fortune", label: "🍀 Fortune World (FC)" }, { id: "terramine", label: "⛏️ Terra Mine (TB)" }];
const PAGE = 10;

function CoinsPage() {
  const { user } = useAuth();
  if (!user) return <div className="panel p-5 text-sm">Entre na sua conta para ver suas moedas. <Link to="/auth" className="text-primary">Entrar</Link></div>;
  return <Wallet userId={user.id} />;
}

function Wallet({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const [game, setGame] = useState<CoinGame>("atlas");
  const [amount, setAmount] = useState<number | null>(null);
  const [source, setSource] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const all = useQuery({
    queryKey: ["coin-earnings", userId, "all-full"],
    queryFn: async () => {
      const { data, error } = await supabase.from("coin_earnings").select("game,currency,amount,source,earned_at,kind").eq("user_id", userId).limit(10000);
      if (error) throw error;
      return data;
    },
  });
  const hist = useInfiniteQuery({
    queryKey: ["coin-earnings", userId, "history"],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase.from("coin_earnings").select("id,game,currency,amount,source,earned_at,kind").eq("user_id", userId).order("earned_at", { ascending: false }).order("id").range(pageParam, pageParam + PAGE - 1);
      if (error) throw error;
      return data;
    },
    getNextPageParam: (last, pages) => (last.length === PAGE ? pages.length * PAGE : undefined),
  });
  const rows = all.data ?? [];
  const bal = coinBalances(rows);
  const month = monthlyEarnings(rows);
  const monthOut: Record<string, number> = { AB: 0, FC: 0, TB: 0 };
  const now = new Date();
  for (const r of rows) { const d = new Date(r.earned_at); if (r.kind === "saida" && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) monthOut[r.currency] = (monthOut[r.currency] ?? 0) + Number(r.amount); }

  const move = async (kind: "entrada" | "saida") => {
    if (busy || !amount || amount <= 0) { setMsg("Informe uma quantidade maior que zero."); return; }
    const cur = CURRENCY_BY_GAME[game];
    if (kind === "saida" && amount > (bal[cur] ?? 0)) { setMsg("Saldo insuficiente."); return; }
    setBusy(true); setMsg("");
    const { error } = await supabase.from("coin_earnings").insert({ user_id: userId, game, currency: cur, amount, kind, source: source.trim().toLowerCase() || "manual", dedupe_key: crypto.randomUUID() });
    setBusy(false);
    if (error) { setMsg("Não foi possível salvar. Tente novamente."); return; }
    setAmount(null); setSource("");
    await qc.invalidateQueries({ queryKey: ["coin-earnings"] });
  };

  const list = hist.data?.pages.flat() ?? [];
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">🏦 Minhas moedas</h1>
      <section className="grid gap-3 sm:grid-cols-3">
        {COIN_LABELS.map(([c, l]) => (
          <div key={c} className="panel p-4">
            <p className="text-xs text-muted-foreground">{l}</p>
            <p className="num text-lg font-semibold">{bal[c]} {c}</p>
            <p className="text-xs text-muted-foreground">Mês: +{month.totals[c]} / −{monthOut[c]}</p>
          </div>
        ))}
      </section>
      <section className="panel space-y-3 p-5">
        <h2 className="font-semibold">Nova movimentação</h2>
        <select className="w-full rounded-md border border-border bg-background p-2 text-sm" value={game} onChange={(e) => setGame(e.target.value as CoinGame)} aria-label="Jogo">
          {GAMES.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
        </select>
        <NumericInput value={amount} onChange={(v) => setAmount(v)} placeholder="Quantidade" aria-label="Quantidade" />
        <Input value={source} maxLength={60} onChange={(e) => setSource(e.target.value)} placeholder="Origem / motivo (opcional)" aria-label="Origem" />
        <div className="grid grid-cols-2 gap-2">
          <Button disabled={busy} onClick={() => move("entrada")}>+ Adicionar</Button>
          <Button disabled={busy} variant="outline" onClick={() => move("saida")}>− Remover</Button>
        </div>
        {msg && <p className="text-xs text-destructive">{msg}</p>}
      </section>
      <section className="panel space-y-2 p-5">
        <h2 className="font-semibold">Histórico</h2>
        {!list.length && <p className="text-sm text-muted-foreground">Nenhuma movimentação ainda.</p>}
        {list.map((r) => (
          <div key={r.id} className="flex items-center justify-between border-b border-border py-1 text-sm last:border-0">
            <div><p>{r.kind === "saida" ? "Saída" : "Entrada"} · {r.source}</p><p className="text-xs text-muted-foreground">{new Date(r.earned_at).toLocaleString("pt-BR")}</p></div>
            <span className="num">{r.kind === "saida" ? "−" : "+"}{Number(r.amount)} {r.currency}</span>
          </div>
        ))}
        {hist.hasNextPage && <Button variant="outline" size="sm" className="w-full" disabled={hist.isFetchingNextPage} onClick={() => hist.fetchNextPage()}>Ver mais</Button>}
      </section>
    </div>
  );
}
