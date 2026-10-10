import { createFileRoute, Link, type SearchSchemaInput, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useGameMode } from "@/hooks/useGameMode";
import { fmtCur } from "@/components/land/LandPages";
import { rankingQuery } from "@/lib/rankingQueries";
import { orderedRanking } from "@/lib/publicRanking";
import { PublicProfile } from "@/components/ranking/PublicProfile";
import type { RankGame } from "@/lib/profile";
import { rankingPollInterval } from "@/lib/rankingConnection";

export const Route = createFileRoute("/ranking")({
  validateSearch: (search: Record<string, unknown> & SearchSchemaInput) => ({
    game: (["terramine", "fortune", "atlas"].includes(String(search["game"])) ? search["game"] : undefined) as RankGame | undefined,
    by: search["by"] === "units" ? "units" as const : "income" as const,
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(rankingQuery()),
  errorComponent: RankingError,
  notFoundComponent: () => <p>Ranking não encontrado.</p>,
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

const GAMES: { id: RankGame; label: string; unit: string }[] = [
  { id: "terramine", label: "⛏️ TerraMine", unit: "minas" },
  { id: "atlas", label: "🌎 Atlas Earth", unit: "terrenos" },
  { id: "fortune", label: "🍀 Fortune World", unit: "parcelas" },
];
const MEDAL = ["🥇", "🥈", "🥉"];

function RankingError({ reset }: { reset: () => void }) {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const retry = useCallback(async () => {
    if (retrying) return;
    setRetrying(true);
    try {
      // Reset only after the loader has finished, rather than racing its pending request.
      await router.invalidate();
      reset();
    } finally {
      setRetrying(false);
      setAttempt((n) => n + 1);
    }
  }, [router, reset, retrying]);
  useEffect(() => {
    if (retrying) return;
    const timer = setTimeout(() => { if (document.visibilityState === "visible") void retry(); else setAttempt((n) => n + 1); }, rankingPollInterval(attempt));
    const online = () => { void retry(); };
    window.addEventListener("online", online);
    return () => { clearTimeout(timer); window.removeEventListener("online", online); };
  }, [attempt, retry, retrying]);
  return <div className="space-y-3"><p>Não foi possível conectar ao ranking. Nova tentativa automática em instantes.</p><Button disabled={retrying} onClick={() => void retry()}>{retrying ? "Conectando…" : "Tentar novamente"}</Button></div>;
}

function RankingPage() {
  const { user } = useAuth();
  const { mode } = useGameMode();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const game = search.game ?? (mode === "land-rents" ? "terramine" : mode);
  const by = search.by;
  const query = useSuspenseQuery(rankingQuery());
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => { if (mode !== "land-rents") void navigate({ search: (prev) => ({ ...prev, game: mode }), replace: true }); }, [mode]);
  const money = (v: number) => fmtCur(v, game === "fortune" ? "EUR" : "USD");
  const unit = GAMES.find((g) => g.id === game)?.unit ?? "unidades";
  const rows = query.data.rows;
  const sorted = orderedRanking(rows, game, by);
  const myIdx = user ? sorted.findIndex((r) => r.user_id === user.id) : -1;
  const mine = sorted[myIdx];
  const selectedPosition = sorted.findIndex((r) => r.user_id === selected);

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold">🏆 Ranking</h1>
      <p className="text-sm text-muted-foreground">Somente jogadores que ativaram "Participar do ranking" no perfil. Dados enviados pelos próprios usuários.</p>
      <div className="flex flex-wrap gap-2">
        {GAMES.map((g) => <Button key={g.id} size="sm" variant={game === g.id ? "default" : "outline"} onClick={() => navigate({ search: (prev) => ({ ...prev, game: g.id }) })}>{g.label}</Button>)}
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant={by === "income" ? "secondary" : "ghost"} onClick={() => navigate({ search: (prev) => ({ ...prev, by: "income" }) })}>Maior rendimento mensal</Button>
        <Button size="sm" variant={by === "units" ? "secondary" : "ghost"} onClick={() => navigate({ search: (prev) => ({ ...prev, by: "units" }) })}>Maior quantidade de {unit}</Button>
      </div>

      {mine && (
        <section className="panel-glow space-y-1 p-4 text-sm">
          <p className="text-lg font-semibold">Você está em #{myIdx + 1}</p>
          <p>{mine.units_count === null ? "Quantidade não disponibilizada" : `${mine.units_count} ${unit}`} · {mine.monthly_income === null ? "Renda não disponibilizada" : `${money(Number(mine.monthly_income))}/mês`}</p>
        </section>
      )}
      {!user && <p className="text-sm"><Link to="/perfil" className="text-primary">Entre no perfil</Link> para participar.</p>}

      <p className="text-xs text-muted-foreground">Última atualização: {new Date(query.data.fetchedAt).toLocaleTimeString("pt-BR")}{query.isRefetchError ? " · conexão indisponível; mantendo os últimos dados e tentando novamente" : " · atualização automática"}</p>
      <section className="panel divide-y divide-border">
        {sorted.length === 0 && <p className="p-4 text-sm text-muted-foreground">Ainda não há informações disponibilizadas neste ranking.</p>}
        {sorted.map((r, i) => (
          <div key={r.user_id} className={`flex items-center gap-3 p-3 ${r.user_id === user?.id ? "bg-secondary" : ""}`}>
            <span className="w-8 text-center font-semibold">{MEDAL[i] ?? `#${i + 1}`}</span>
            <Button variant="ghost" className="h-auto min-w-0 flex-1 justify-start gap-3 px-0 text-left" aria-label={`Ver perfil de ${r.display_name}`} onClick={() => setSelected(r.user_id)}>
              {r.avatar_url ? <img src={r.avatar_url} alt={`Foto de ${r.display_name}`} width={36} height={36} className="h-9 w-9 shrink-0 rounded-full object-cover" /> : <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary">👤</span>}
              <span className="truncate">{r.display_name}</span>
            </Button>
            <span className="num shrink-0 text-xs font-semibold sm:text-sm">{by === "units" ? `${r.units_count} ${unit}` : `${money(Number(r.monthly_income))}/mês`}</span>
          </div>
        ))}
      </section>
      {selected && <PublicProfile rows={rows} userId={selected} position={selectedPosition < 0 ? null : selectedPosition + 1} onClose={() => setSelected(null)} />}
    </div>
  );
}
