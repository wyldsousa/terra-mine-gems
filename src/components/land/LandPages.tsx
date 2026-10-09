import { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NumericInput, parseDecimal } from "@/components/common/NumericInput";
import { ConfirmDialog } from "@/components/mines/MineBulkTools";
import { calculateLandIncome, daysToGoal, nextEventStart, rarityShares, totalUnits } from "@/calculations/landGameCalculator";
import { DEFAULT_LAND_PARAMS, GAME_INFO, type LandGameId, type LandState, type Tier } from "@/data/landGames";
import { useGameMode } from "@/hooks/useGameMode";
import { formatMoney, formatNumber } from "@/lib/format";

/** Currency format that preserves meaningful tiny per-second values. */
export function fmtCur(v: number, cur: "USD" | "EUR") {
  const sym = cur === "EUR" ? "€" : "$";
  const abs = Math.abs(v);
  if (abs > 0 && abs < 0.0001) {
    const str = abs.toLocaleString("en-US", { maximumSignificantDigits: 10, maximumFractionDigits: 20 });
    return `${v < 0 ? "-" : ""}${sym}${str}`;
  }
  const s = formatMoney(v);
  return cur === "EUR" ? s.replace("$", "€") : s;
}

function useLand(game: LandGameId) {
  const { land, setLand } = useGameMode();
  const s = land[game];
  const inc = useMemo(() => calculateLandIncome(s), [s]);
  const cur = s.params.currency;
  const m = (v: number) => fmtCur(v, cur);
  const update = (fn: (s: LandState) => LandState) => setLand(game, fn);
  return { s, inc, m, update, info: GAME_INFO[game] };
}

function Header({ game, title }: { game: LandGameId; title: string }) {
  const i = GAME_INFO[game];
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{i.emoji} {i.name}</p>
      <h1 className="font-display text-2xl font-bold">{title}</h1>
    </div>
  );
}
function Card({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="panel p-4">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="num mt-1 text-lg font-semibold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
const fmtDate = (t: number) => new Date(t).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

/* ---------------- Dashboard ---------------- */
export function LandDashboard({ game }: { game: LandGameId }) {
  const { s, inc, m, info } = useLand(game);
  const now = Date.now();
  const chart = useMemo(() => Array.from({ length: 31 }, (_, d) => ({ d, v: s.balance + inc.windowIncome(d) })), [inc, s.balance]);
  const nextGoal = s.goals.find((g) => g > s.balance) ?? s.goals[s.goals.length - 1] ?? 1;
  const eta = daysToGoal(nextGoal, s.balance, inc.avgDaily);
  const nextEvents = s.events.map((e) => nextEventStart(e, now)).filter((x): x is number => x !== null).sort((a, b) => a - b);
  return (
    <div className="space-y-5">
      <Header game={game} title="Painel" />
      <section className="panel-glow p-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Rendimento mensal estimado</p>
        <p className="ember-text num mt-1 text-4xl font-bold">{m(inc.monthly)}</p>
        <p className="text-sm text-muted-foreground">inclui boost diário e {formatNumber(inc.eventHoursMonth, 1)}h de {s.params.eventName} nos próximos {s.params.daysPerMonth} dias</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card label="Diário (média)" value={m(inc.avgDaily)} />
          <Card label="Semanal" value={m(inc.weekly)} />
          <Card label="Anual" value={m(inc.yearly)} />
          <Card label="Por segundo (sem boost)" value={m(inc.perSecond.noBoost)} />
        </div>
      </section>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card label={info.units} value={formatNumber(inc.units, 0)} />
        <Card label="Boost atual" value={`${inc.multiplier}×`} sub={`${s.boostHoursPerDay}h/dia`} />
        <Card label={`Emblemas (${s.badges})`} value={`+${inc.bonusPercent}%`} />
        <Card label={s.params.eventName} value={nextEvents[0] ? fmtDate(nextEvents[0]) : "Data não definida"} sub={`${s.params.eventMultiplier}× · ${s.events.length} por mês`} />
      </section>
      <section className="panel space-y-2 p-5 text-sm">
        <p className="font-semibold">🧮 Como chegamos ao valor mensal</p>
        <div className="flex justify-between"><span>Base (soma dos {info.units}, por segundo)</span><span className="num">{m(inc.basePerSecond)}</span></div>
        {game === "atlas" && <div className="flex justify-between"><span>Base mensal (sem emblemas, boost ou SRB)</span><span className="num">{m(inc.baseMonthly)}</span></div>}
        <div className="flex justify-between"><span>+ Emblemas (+{inc.bonusPercent}%) = sem boost/s</span><span className="num">{m(inc.perSecond.noBoost)}</span></div>
        <div className="flex justify-between"><span>Sem boost: {formatNumber(inc.breakdown.plain.hours, 1)}h × 1×</span><span className="num">{m(inc.breakdown.plain.income)}</span></div>
        <div className="flex justify-between"><span>Boost: {formatNumber(inc.breakdown.boost.hours, 1)}h × {inc.multiplier}×</span><span className="num">{m(inc.breakdown.boost.income)}</span></div>
        {game === "atlas" ? inc.breakdown.events.map((e, i) => <div key={e.id} className="flex justify-between gap-3"><span>SRB {i + 1}: {formatNumber(e.hours, 1)}h × {s.params.eventMultiplier}×{e.estimated ? " (estimativa sem data)" : ""}</span><span className="num">{m(e.income)}</span></div>) : <div className="flex justify-between"><span>{s.params.eventName}: {formatNumber(inc.breakdown.event.hours, 1)}h × {s.params.eventMultiplier}× (substitui o boost)</span><span className="num">{m(inc.breakdown.event.income)}</span></div>}
        <div className="flex justify-between border-t border-border pt-2 font-semibold"><span>Total do mês</span><span className="num">{m(inc.monthly)}</span></div>
      </section>
      <section className="panel p-5">
        <p className="font-semibold">🎯 Próxima meta: {m(nextGoal)}</p>
        <Progress className="mt-3" value={Math.min(100, (s.balance / nextGoal) * 100)} />
        <p className="mt-2 text-sm text-muted-foreground">{eta === null ? "Cadastre " + info.units + " para estimar" : `≈ ${Math.ceil(eta)} dias`}</p>
      </section>
      <section className="panel p-5">
        <p className="mb-3 font-semibold">📈 Saldo projetado (30 dias)</p>
        <div className="h-56">
          <ResponsiveContainer>
            <AreaChart data={chart}>
              <CartesianGrid strokeOpacity={0.1} />
              <XAxis dataKey="d" fontSize={11} stroke="currentColor" />
              <YAxis fontSize={11} stroke="currentColor" width={70} tickFormatter={(v) => m(v)} />
              <Tooltip formatter={(v: number) => m(v)} labelFormatter={(d) => `Dia ${d}`} />
              <Area dataKey="v" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

/* ---------------- Units (lands / parcels) ---------------- */
export function LandUnits({ game }: { game: LandGameId }) {
  const { s, m, update, info } = useLand(game);
  const [rarity, setRarity] = useState(s.params.rarities[0]?.id ?? "");
  const [qty, setQty] = useState<number | string>("");
  const [pending, setPending] = useState<{ id: string; n: number } | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const shares = rarityShares(s);
  const label = (id: string) => s.params.rarities.find((r) => r.id === id);
  const apply = (id: string, n: number) => update((p) => ({ ...p, counts: { ...p.counts, [id]: Math.max(0, (p.counts[id] ?? 0) + n) } }));
  const n = Math.floor(parseDecimal(String(qty)));
  return (
    <div className="space-y-5">
      <Header game={game} title={info.unitsTitle} />
      <section className="panel space-y-3 p-4">
        <p className="font-semibold">Adicionar por quantidade</p>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="space-y-1">
            <Label>Raridade</Label>
            <Select value={rarity} onValueChange={setRarity}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{s.params.rarities.map((r) => <SelectItem key={r.id} value={r.id}>{r.emoji} {r.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label htmlFor="land-qty">Quantidade</Label><NumericInput id="land-qty" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} /></div>
          <Button disabled={n <= 0} onClick={() => setPending({ id: rarity, n })}>Adicionar</Button>
        </div>
      </section>
      <section className="panel divide-y divide-border">
        {shares.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center gap-3 p-3">
            <span className="text-xl">{r.emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{r.label}</p>
              <p className="text-xs text-muted-foreground">{m(r.perSecond)}/s por {info.unit} · {m(r.monthly)}/mês</p>
            </div>
            <span className="num w-14 text-right text-lg font-semibold" data-testid={`count-${r.id}`}>{r.count}</span>
            <Button size="sm" variant="outline" aria-label={`Remover 1 ${r.label}`} disabled={r.count === 0} onClick={() => apply(r.id, -1)}>−1</Button>
            <Button size="sm" aria-label={`Adicionar 1 ${r.label}`} onClick={() => setPending({ id: r.id, n: 1 })}>+1</Button>
          </div>
        ))}
      </section>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Total: <span className="num font-semibold text-foreground">{totalUnits(s)}</span> {info.units}</p>
        <Button variant="destructive" size="sm" onClick={() => setResetOpen(true)}>Zerar {info.units}</Button>
      </div>
      <ConfirmDialog
        open={!!pending}
        onOpenChange={(v) => !v && setPending(null)}
        title="Confirmar adição"
        description={pending ? `${label(pending.id)?.emoji} ${label(pending.id)?.label} — quantidade: ${pending.n}. Deseja realmente adicionar?` : ""}
        confirmLabel="Confirmar"
        onConfirm={() => { if (pending) { apply(pending.id, pending.n); setQty(""); } }}
      />
      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title={`Zerar ${info.units}?`}
        description={`Essa ação irá excluir todos os seus ${info.units} e não poderá ser desfeita.`}
        confirmLabel="Zerar"
        destructive
        onConfirm={() => update((p) => ({ ...p, counts: {} }))}
      />
    </div>
  );
}

/* ---------------- Calculator ---------------- */
export function LandCalculator({ game }: { game: LandGameId }) {
  const { s, inc, m, update, info } = useLand(game);
  const p = s.params;
  const rows: [string, number][] = [["Segundo", 1], ["Minuto", 60], ["Hora", 3600], ["Dia", 86400], ["Semana", 604800], ["Mês", 86400 * p.daysPerMonth], ["Ano", 86400 * p.daysPerYear]];
  return (
    <div className="space-y-5">
      <Header game={game} title="Calculadora" />
      {game === "atlas" && <section className="panel space-y-3 p-4">
        <p className="font-semibold">Distribuição real dos terrenos</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {p.rarities.map((r) => <div key={r.id} className="space-y-1">
            <Label htmlFor={`actual-${r.id}`}>{r.emoji} {r.label}</Label>
            <NumericInput id={`actual-${r.id}`} inputMode="numeric" value={s.counts[r.id] ?? 0} onChange={(e) => update((x) => ({ ...x, counts: { ...x.counts, [r.id]: Math.max(0, Math.floor(parseDecimal(e.target.value))) } }))} />
          </div>)}
        </div>
        <p className="text-sm">Total: <span className="num font-semibold">{inc.units}</span> terrenos · Base: <span className="num">{m(inc.basePerSecond)}/s</span> · <span className="num">{m(inc.baseMonthly)}/mês</span> antes dos emblemas</p>
      </section>}
      <section className="panel grid gap-3 p-4 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="bh">Horas de boost por dia{game === "atlas" ? " (1 anúncio = 1h, acumula até " + p.maxBoostHours + "h)" : ""}</Label>
          <NumericInput id="bh" value={s.boostHoursPerDay} onChange={(e) => update((x) => ({ ...x, boostHoursPerDay: Math.min(24, Math.max(0, parseDecimal(e.target.value))) }))} />
        </div>
          <div className="space-y-1">
            <Label htmlFor="badges">Emblemas</Label>
            <NumericInput id="badges" inputMode="numeric" value={s.badges} onChange={(e) => update((x) => ({ ...x, badges: Math.max(0, Math.floor(parseDecimal(e.target.value))) }))} />
            <p className="text-xs text-muted-foreground" data-testid="badge-bonus">Bônus por emblemas: +{inc.bonusPercent}%</p>
          </div>
        <div className="space-y-1">
          <Label htmlFor="bal">Saldo atual</Label>
          <NumericInput id="bal" value={s.balance} onChange={(e) => update((x) => ({ ...x, balance: Math.max(0, parseDecimal(e.target.value)) }))} />
        </div>
      </section>

      <section className="panel overflow-x-auto p-4">
        <p className="mb-2 font-semibold">Rendimento por período · boost {inc.multiplier}×</p>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-muted-foreground"><th className="py-1">Período</th><th>Sem boost</th><th>Com boost</th><th>{p.eventName}</th></tr></thead>
          <tbody>
            {rows.map(([l, sec]) => (
              <tr key={l} className="border-t border-border/60">
                <td className="py-1.5">{l}</td>
                <td className="num">{m(inc.perSecond.noBoost * sec)}</td>
                <td className="num">{m(inc.perSecond.boost * sec)}</td>
                <td className="num">{m(inc.perSecond.event * sec)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card label="Média diária" value={m(inc.avgDaily)} />
        <Card label="Média mensal" value={m(inc.monthly)} />
        <Card label="Anual" value={m(inc.yearly)} />
        <Card label="Ganho do bônus/mês" value={m(inc.bonusGainMonthly)} />
      </section>

      <section className="panel space-y-3 p-4">
        <p className="font-semibold">📅 {p.eventName} — {p.eventMultiplier}× (substitui o boost normal)</p>
        {s.events.map((e, i) => (
          <div key={e.id} className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor={`ev-${i}`}>Evento {i + 1} — data e hora de início</Label>
              <Input id={`ev-${i}`} type="datetime-local" value={e.start} onChange={(ev) => update((x) => ({ ...x, events: x.events.map((y) => (y.id === e.id ? { ...y, start: ev.target.value } : y)) }))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`evd-${i}`}>Duração (horas)</Label>
              <NumericInput id={`evd-${i}`} value={e.durationHours} onChange={(ev) => update((x) => ({ ...x, events: x.events.map((y) => (y.id === e.id ? { ...y, durationHours: Math.max(0, parseDecimal(ev.target.value)) } : y)) }))} />
            </div>
          </div>
        ))}
        <p className="text-xs text-muted-foreground">{game === "atlas" ? "Eventos com data: horas reais dentro da projeção, sem contar sobreposições duas vezes. Sem data: estimativa de 1 ocorrência mensal por evento, 12 por ano. A referência considera boost normal ativo 24h por dia; menos horas reduzem a renda fora do SRB." : "Os eventos se repetem mensalmente a partir da data escolhida. Sem data, contam como 1 ocorrência por mês (estimativa)."}</p>
      </section>

      <section className="panel space-y-2 p-4">
        <p className="font-semibold">🎯 Metas</p>
        {s.goals.map((g) => {
          const d = daysToGoal(g, s.balance, inc.avgDaily);
          return (
            <div key={g} className="flex items-center justify-between text-sm">
              <span className="num">{m(g)}</span>
              <span className="text-muted-foreground">{d === 0 ? "✅ atingida" : d === null ? "—" : `≈ ${Math.ceil(d)} dias`}</span>
            </div>
          );
        })}
      </section>
      <p className="text-xs text-muted-foreground">Estimativa: base/s × multiplicador × (1 + bônus%). Durante eventos o {p.eventMultiplier}× substitui o multiplicador normal. Valores editáveis em Configurações.</p>
    </div>
  );
}

/* ---------------- Stats ---------------- */
export function LandStats({ game }: { game: LandGameId }) {
  const { s, m, info } = useLand(game);
  const shares = rarityShares(s);
  const total = totalUnits(s);
  return (
    <div className="space-y-5">
      <Header game={game} title="Estatísticas" />
      <section className="panel p-4">
        <p className="mb-3 font-semibold">Renda mensal por raridade (sem eventos)</p>
        <div className="h-56">
          <ResponsiveContainer>
            <BarChart data={shares.map((r) => ({ name: r.label, v: r.monthly }))}>
              <XAxis dataKey="name" fontSize={11} stroke="currentColor" />
              <YAxis fontSize={11} stroke="currentColor" width={70} tickFormatter={(v) => m(v)} />
              <Tooltip formatter={(v: number) => m(v)} />
              <Bar dataKey="v" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="panel overflow-x-auto p-4">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-muted-foreground"><th className="py-1">Raridade</th><th>{info.units}</th><th>% real</th><th>% esperado</th><th>Renda/mês</th></tr></thead>
          <tbody>
            {shares.map((r) => (
              <tr key={r.id} className="border-t border-border/60">
                <td className="py-1.5">{r.emoji} {r.label}</td>
                <td className="num">{r.count}</td>
                <td className="num">{total ? formatNumber((r.count / total) * 100, 1) + "%" : "—"}</td>
                <td className="num">{r.probability === null ? "—" : r.probability + "%"}</td>
                <td className="num">{m(r.monthly)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

/* ---------------- Settings ---------------- */
function TierEditor({ title, tiers, suffix, onChange }: { title: string; tiers: Tier[]; suffix: string; onChange: (t: Tier[]) => void }) {
  return (
    <div className="space-y-2">
      <p className="font-semibold">{title}</p>
      {tiers.map((t, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr] gap-2">
          <NumericInput aria-label={`${title} a partir de`} inputMode="numeric" value={t.min} onChange={(e) => onChange(tiers.map((x, j) => (j === i ? { ...x, min: Math.floor(parseDecimal(e.target.value)) } : x)))} />
          <div className="flex items-center gap-1">
            <NumericInput aria-label={`${title} valor`} value={t.value} onChange={(e) => onChange(tiers.map((x, j) => (j === i ? { ...x, value: parseDecimal(e.target.value) } : x)))} />
            <span className="text-xs text-muted-foreground">{suffix}</span>
          </div>
        </div>
      ))}
      <p className="text-xs text-muted-foreground">Coluna 1: a partir de (quantidade). Coluna 2: valor.</p>
    </div>
  );
}

export function LandSettings({ game }: { game: LandGameId }) {
  const { s, update } = useLand(game);
  const p = s.params;
  const [confirm, setConfirm] = useState(false);
  const setP = (patch: Partial<typeof p>) => update((x) => ({ ...x, params: { ...x.params, ...patch } }));
  return (
    <div className="space-y-5">
      <Header game={game} title="Configurações" />
      <p className="text-sm text-muted-foreground">Todos os valores são estimativas editáveis. Alterações valem só para este jogo.</p>
      <section className="panel space-y-2 p-4">
        <p className="font-semibold">Rendimento base por segundo ({p.currency === "EUR" ? "€" : "US$"})</p>
        {p.rarities.map((r, i) => (
          <div key={r.id} className="grid grid-cols-[7rem_1fr_1fr] items-center gap-2">
            <span className="text-sm">{r.emoji} {r.label}</span>
            <NumericInput aria-label={`${r.label} por segundo`} value={r.perSecond} onChange={(e) => setP({ rarities: p.rarities.map((x, j) => (j === i ? { ...x, perSecond: parseDecimal(e.target.value) } : x)) })} />
            <NumericInput aria-label={`${r.label} probabilidade`} placeholder="prob. %" value={r.probability ?? ""} onChange={(e) => setP({ rarities: p.rarities.map((x, j) => (j === i ? { ...x, probability: e.target.value === "" ? null : parseDecimal(e.target.value) } : x)) })} />
          </div>
        ))}
      </section>
      <section className="panel grid gap-6 p-4 md:grid-cols-2">
        <TierEditor title="Boost por quantidade" suffix="×" tiers={p.boostTiers} onChange={(t) => setP({ boostTiers: t })} />
        <TierEditor title="Bônus por emblemas" suffix="%" tiers={p.bonusTiers} onChange={(t) => setP({ bonusTiers: t })} />
      </section>
      <section className="panel grid gap-3 p-4 sm:grid-cols-3">
        <div className="space-y-1"><Label htmlFor="evm">Multiplicador do evento</Label><NumericInput id="evm" value={p.eventMultiplier} onChange={(e) => setP({ eventMultiplier: parseDecimal(e.target.value) })} /></div>
        <div className="space-y-1"><Label htmlFor="mbh">Máx. horas de boost acumuladas</Label><NumericInput id="mbh" value={p.maxBoostHours} onChange={(e) => setP({ maxBoostHours: parseDecimal(e.target.value) })} /></div>
        <div className="space-y-1"><Label htmlFor="goals">Metas (separadas por espaço)</Label><Input id="goals" defaultValue={s.goals.join(" ")} onBlur={(e) => update((x) => ({ ...x, goals: e.target.value.split(/\s+/).map((v) => parseDecimal(v)).filter((v) => v > 0).sort((a, b) => a - b) }))} /></div>
      </section>
      <Button variant="outline" onClick={() => setConfirm(true)}>Restaurar valores padrão</Button>
      <ConfirmDialog open={confirm} onOpenChange={setConfirm} title="Restaurar padrões?" description="Os parâmetros deste jogo voltam aos valores padrão. Seus dados não são apagados." confirmLabel="Restaurar" onConfirm={() => setP(structuredClone(DEFAULT_LAND_PARAMS[game]))} />
    </div>
  );
}
