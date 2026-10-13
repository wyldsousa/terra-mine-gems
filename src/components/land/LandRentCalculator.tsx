import { useMemo, useState } from "react";
import { ArrowLeft, Settings2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { NumericInput, parseDecimal } from "@/components/common/NumericInput";
import { Label } from "@/components/ui/label";
import { StatCard } from "@/components/common/StatCard";
import { useGameMode } from "@/hooks/useGameMode";
import { calculateLandRent } from "@/calculations/landRentCalculator";
import { landRentParamsSchema, type LandRentState } from "@/data/landRent";
import { GAME_INFO } from "@/data/landGames";
import { LandRentIcon } from "./LandRentIcon";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { saveLandRentSummary, loadLandRentSummary } from "@/lib/landRentProfile";
import { toast } from "sonner";
import terrain from "@/assets/land-rent-terrain.jpg";

export function landRentMoney(value: number | null, tiny = false) {
  if (value === null) return "Não disponibilizado";
  return `US$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: tiny ? 16 : value > 0 && value < 0.01 ? 10 : 6 })}`;
}
export function LandRentCalculator() {
  const { landRent: s, setLandRent, previousGame, setMode, hydrated } = useGameMode();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const r = useMemo(() => calculateLandRent(s), [s]);
  const [settings, setSettings] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const change = (patch: Partial<LandRentState>) => { try { setLandRent({ ...s, ...patch }); setError(""); } catch { setError("Informe valores válidos, sem negativos ou quantidades fracionárias."); } };
  const count = (id: "plots" | "badges", label: string) => <div className="space-y-2"><Label htmlFor={`lr-${id}`}>{label}</Label><NumericInput id={`lr-${id}`} value={s[id]} inputMode="numeric" onChange={(e) => change({ [id]: parseDecimal(e.target.value) })} /></div>;
  return <div className="land-rent-page space-y-6">
    <section className="relative isolate overflow-hidden bg-surface">
      <img src={terrain} alt="Lotes verdes com um marcador GPS dourado" width={1536} height={1024} className="absolute inset-0 h-full w-full object-cover object-right" />
      <div className="land-rent-shade absolute inset-0" />
      <div className="relative z-10 flex min-h-48 flex-col justify-center gap-3 p-5 sm:p-8">
        <div className="flex items-center gap-3"><LandRentIcon className="h-10 w-10" /><h1 className="font-display text-3xl font-bold">LAND RENT</h1></div>
        <p className="text-sm font-semibold text-primary">Brasil · Grupo 4 · USD</p>
        <p className="max-w-sm text-sm text-foreground">Simulação com regras fornecidas e hipóteses identificadas.</p>
      </div>
    </section>
    <p className="border-l-2 border-primary pl-4 text-sm text-muted-foreground">Valores simulados: não representam dinheiro real sacável, renda financeira ou garantia de conversão.</p>
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <section className="space-y-5">
        <h2 className="font-display text-lg font-semibold">Seus terrenos</h2>
        {count("plots", "Quantidade de terrenos")}{count("badges", "Quantidade de emblemas")}
        <div className="border-y border-border py-3"><p className="text-sm">Faixa atual: {r.tier ? `${r.tier.min}–${r.tier.max}` : "Sem terrenos"}</p><p className="text-lg font-semibold text-primary">Boost normal automático: {r.multiplier}×</p></div>
        <p className="text-xs text-muted-foreground">0–10.000 terrenos e 0–200 emblemas, somente inteiros. O boost depende exclusivamente da quantidade de terrenos.</p>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button variant="outline" onClick={() => { setDraft(JSON.stringify(s.params, null, 2)); setSettings(!settings); }}><Settings2 /> Parâmetros</Button>
      </section>
      <section className="space-y-4">
        <div className="flex flex-wrap justify-between gap-2 border-b border-border pb-3"><h2 className="font-display text-lg font-semibold">Estimativa normal</h2><span className="text-sm text-primary">{r.multiplier ?? "Pendente"}× · Emblemas {r.badgePercent === null ? "pendentes" : `${r.badgePercent.toLocaleString("pt-BR")}%`}</span></div>
        <div className="grid grid-cols-2 gap-3">
          {([['Por segundo',r.perSecond],['Por hora',r.perHour],['Por dia',r.normal.daily],['Por semana',r.normal.weekly],['Mês médio',r.normal.monthly],['Por ano',r.normal.yearly]] as const).map(([label,value]) => <StatCard key={label} label={label} value={landRentMoney(value, label === "Por segundo")} className="[&_.num]:break-words [&_.num]:text-base" />)}
        </div>
        <p className="text-xs text-muted-foreground">Rendimento normal com boost da faixa, sem anúncios adicionais. Mês médio = ano ÷ 12 ({(s.params.daysPerYear / 12).toLocaleString("pt-BR")} dias). Sem eventos somados.</p>
        {(r.badgePercent === null || r.multiplier === null) && <p role="status" className="text-sm text-destructive">Quantidade fora da tabela fornecida. Não extrapolamos regras desconhecidas.</p>}
        <details className="border-y border-border py-3"><summary className="cursor-pointer font-semibold">Detalhamento do cálculo</summary><div className="mt-3 space-y-2 text-sm text-muted-foreground"><p>Referência relatada: {landRentMoney(s.params.annualAtReference)} / parcela / ano a {s.params.referenceMultiplier}×, sem emblemas.</p><p>Base derivada: {landRentMoney(r.basePerSecond, true)} / segundo. Hipótese: multiplicador proporcional, aplicado uma única vez.</p><p>{s.plots} terrenos × base por segundo × {r.multiplier ?? "?"}× × (1 + {(r.badgePercent ?? 0) / 100}).</p><p>200 emblemas: {r.badgeReferenceCalculated?.toLocaleString("pt-BR")}% · referência {s.params.badgeReferencePercent}%{Math.abs((r.badgeReferenceCalculated ?? 0) - s.params.badgeReferencePercent) > 1e-9 ? " — divergência a confirmar" : " — coincide"}.</p></div></details>
      </section>
    </div>
    <section className="space-y-4 border-t border-border pt-5">
      <div className="flex items-center justify-between gap-3"><h2 className="font-display text-lg font-semibold">Rent Rush semanal</h2><Switch aria-label="Ativar Rent Rush" checked={s.eventEnabled} onCheckedChange={(eventEnabled) => change({ eventEnabled })} /></div>
      <p className="text-sm text-muted-foreground">Uma ocorrência a cada {s.params.eventEveryDays} dias, {s.params.eventHours} horas a {s.params.eventMultiplier}×. Simulação provisória: substitui o boost normal e mantém os emblemas.</p>
      {s.eventEnabled && <div className="space-y-2"><Label htmlFor="lr-start">Data e horário de início</Label><input id="lr-start" type="datetime-local" className="w-full min-w-0 rounded-md border border-input bg-background p-2" value={s.eventStart} onChange={(e) => change({ eventStart: e.target.value })} /><p className="text-xs text-muted-foreground">{s.eventStart ? "Data âncora da recorrência semanal, no horário local." : "Data não informada; projeção média semanal."} Ano médio: 365/7 ocorrências. Mês: ano ÷ 12. A data não altera a média recorrente.</p></div>}
      <div className="grid gap-3 sm:grid-cols-3"><StatCard label="Normal nas mesmas 18h" value={landRentMoney(r.event.normal)} /><StatCard label="Durante Rent Rush" value={landRentMoney(r.event.total)} /><StatCard label="Adicional por ocorrência" value={landRentMoney(r.event.additional)} /></div>
      <h3 className="font-semibold">{s.eventEnabled ? "Projeções com Rent Rush" : "Projeções sem Rent Rush"}</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{([['Diária média',r.daily],['Semanal',r.weekly],['Mensal média',r.monthly],['Anual',r.yearly]] as const).map(([label,value]) => <StatCard key={label} label={label} value={landRentMoney(value)} className="[&_.num]:text-base [&_.num]:break-words" />)}</div>
      <p className="text-xs text-muted-foreground">Somamos somente o adicional do evento; o rendimento normal das mesmas 18 horas nunca é contado novamente.</p>
    </section>
    <section className="space-y-3 border-t border-border pt-5">
      <h2 className="font-display text-lg font-semibold">Referências e regras</h2>
      <p className="text-sm text-muted-foreground">Confirmado por relato do responsável: US$ 0,10/ano a 2×. Derivados: base sem impulso e períodos. Fontes públicas do jogo corroboram Brasil/Grupo 4, progressão de emblemas e sábado/18h; a referência anual e a fórmula de interação do evento ainda exigem confirmação documental.</p>
      <a className="text-sm text-primary underline" href="https://landrentapp.com/guide" target="_blank" rel="noreferrer">Guia do Land Rent</a>
      <h3 className="font-semibold">Boosts por anúncios · pendentes</h3><Label htmlFor="lr-ad">Multiplicador informado (não aplicado)</Label><NumericInput id="lr-ad" value={s.adMultiplier ?? ""} placeholder="Pendente" onChange={(e) => change({ adMultiplier: e.target.value === "" ? null : parseDecimal(e.target.value) })} />
      <p className="text-sm text-muted-foreground">Impulso por anúncio informado: {s.params.adHours} hora. Quantidade de anúncios, limites diários e acumulação: pendentes; nenhum limite presumido.</p>
      <details><summary className="cursor-pointer font-semibold">Tabela de terrenos · dados fornecidos</summary><div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="py-2">Terrenos</th><th>Impulso</th><th>Referência sem significado confirmado</th></tr></thead><tbody>{s.params.plotBands.map((b) => <tr key={b.min} className="border-t border-border"><td className="py-2">{b.min}–{b.max}</td><td>{b.value}×</td><td>{b.referenceUsd == null ? "—" : landRentMoney(b.referenceUsd)}</td></tr>)}</tbody></table></div><p className="mt-2 text-xs text-muted-foreground">Referências não entram no cálculo. Não são tratadas como preço, custo, renda ou limite.</p></details>
      <details><summary className="cursor-pointer font-semibold">Emblemas · bônus progressivo</summary><div className="mt-3 space-y-2 text-sm">{s.params.badgeBands.map((b) => <p key={b.min}>{b.min}–{b.max}: +{b.value}% por emblema da própria faixa</p>)}</div></details>
    </section>
    {settings && <section className="space-y-3 border-t border-border pt-5"><h2 className="font-semibold">Parâmetros da simulação</h2><p className="text-sm text-muted-foreground">Alterações pessoais não tornam regras pendentes oficiais. Faixas precisam permanecer consecutivas.</p><textarea aria-label="Parâmetros Land Rent" className="min-h-72 w-full rounded-md border border-input bg-background p-3 font-mono text-xs" value={draft} onChange={(e) => setDraft(e.target.value)} /><Button onClick={() => { try { const params = landRentParamsSchema.parse(JSON.parse(draft)); change({ params }); setSettings(false); } catch { setError("Parâmetros inválidos. Confira números positivos e faixas consecutivas."); } }}>Salvar parâmetros</Button>{error && <p role="alert" className="text-destructive">{error}</p>}</section>}
    {user && <div className="flex flex-wrap gap-3"><Button disabled={saving || !hydrated} onClick={async () => { setSaving(true); try { await saveLandRentSummary(user.id, s); toast.success("Land Rent salvo no seu perfil"); } catch { toast.error("Não foi possível salvar. Seus dados locais foram preservados."); } finally { setSaving(false); } }}>{saving ? "Salvando…" : "Salvar Land Rent no perfil"}</Button><Button variant="outline" disabled={saving} onClick={async () => { try { const saved = await loadLandRentSummary(user.id); if (saved) { setLandRent(saved); toast.success("Land Rent recuperado"); } else toast.info("Não disponibilizado"); } catch { toast.error("Não foi possível recuperar agora."); } }}>Recuperar Land Rent do perfil</Button></div>}
    <div className="flex flex-wrap gap-3 border-t border-border py-4"><Button variant="outline" asChild><Link to="/" onClick={() => setMode(previousGame)}><ArrowLeft /> Voltar ao {GAME_INFO[previousGame].name}</Link></Button><Button asChild><Link to="/perfil">Perfil e compartilhamento</Link></Button><Button variant="outline" asChild><Link to="/ranking" search={{ game: "land-rents", by: "units" }}>Ranking Land Rent</Link></Button></div>
  </div>;
}
