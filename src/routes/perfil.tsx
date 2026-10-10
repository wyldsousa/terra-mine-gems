import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useGameMode } from "@/hooks/useGameMode";
import { useEurUsd } from "@/hooks/useEurUsd";
import { fmtCur } from "@/components/land/LandPages";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAppState } from "@/hooks/useAppState";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney } from "@/lib/format";
import { localIncomes, resizeImage, syncPublicStats, type RankGame } from "@/lib/profile";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Meu Perfil — TerraMine Calculator" },
      { name: "description", content: "Seu perfil, calculadoras, renda estimada total e participação no ranking." },
      { property: "og:title", content: "Meu Perfil — TerraMine Calculator" },
      { property: "og:description", content: "Seu perfil, calculadoras, renda estimada total e participação no ranking." },
    ],
  }),
  component: ProfilePage,
});

const CALCS: { id: RankGame; label: string; to: string }[] = [
  { id: "atlas", label: "🌎 Atlas Earth", to: "/atlas" },
  { id: "fortune", label: "🍀 Fortune World", to: "/fortune" },
  { id: "terramine", label: "⛏️ TerraMine", to: "/calculadora" },
];

const FUTURE = ["Histórico de rendimento", "Conquistas", "Comparação entre jogos", "Registro de ganhos reais", "Alertas de metas", "Conversão USD/BRL", "Compartilhar perfil / link público", "Evolução do ranking", "Recordes pessoais"];

function ProfilePage() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const { mines, params } = useAppState();
  const [inc, setInc] = useState<ReturnType<typeof localIncomes> | null>(null);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [optIn, setOptIn] = useState(false);
  const [calcs, setCalcs] = useState<string[]>(["atlas", "fortune", "terramine"]);
  const [saving, setSaving] = useState(false);
  const [incomeGames, setIncomeGames] = useState<string[]>([]);
  const [unitsGames, setUnitsGames] = useState<string[]>([]);
  const [publicAvatar, setPublicAvatar] = useState(true);
  const [profileReady, setProfileReady] = useState(false);

  const { land, mode, setMode } = useGameMode();
  const navigate = useNavigate();
  const fx = useEurUsd();
  const eurUsd = fx.rate;
  useEffect(() => setInc(localIncomes(mines, params, land)), [mines, params, land]);
  const usd = (id: RankGame, v: number | null) => (v === null ? null : id === "fortune" ? (eurUsd ? v * eurUsd : null) : v);
  const show = (id: RankGame, v: number) => fmtCur(v, id === "fortune" ? "EUR" : "USD");

  useEffect(() => {
    setProfileReady(false);
    if (!user) return;
    let active = true;
    (async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (!active) return;
      if (error) { toast.error("Não foi possível carregar seu perfil. Tente novamente ao reconectar."); return; }
      if (data) {
        setName(data.display_name); setAvatar(data.avatar_url); setOptIn(data.ranking_opt_in); setCalcs(data.calculators);
        setIncomeGames(data.public_income_games); setUnitsGames(data.public_units_games); setPublicAvatar(data.public_avatar);
      } else {
        const display = (user.user_metadata?.["full_name"] as string | undefined)?.slice(0, 40) || "Jogador";
        const { error: insertError } = await supabase.from("profiles").insert({ id: user.id, display_name: display, public_income_games: [], public_units_games: [] });
        if (insertError) { toast.error("Não foi possível criar seu perfil."); return; }
        setName(display);
        setIncomeGames([]); setUnitsGames([]); setOptIn(false);
      }
      setProfileReady(true);
    })();
    return () => { active = false; };
  }, [user]);

  const total = useMemo(() => {
    if (!inc) return null;
    const vals = CALCS.filter((c) => calcs.includes(c.id)).map((c) => usd(c.id, inc[c.id].monthly)).filter((v): v is number => v !== null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) : null;
  }, [inc, calcs, eurUsd]);

  const save = async () => {
    if (!user || !inc || !profileReady || saving) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({ display_name: name.trim().slice(0, 40) || "Jogador", avatar_url: avatar, ranking_opt_in: optIn, calculators: calcs, public_income_games: incomeGames, public_units_games: unitsGames, public_avatar: publicAvatar }).eq("id", user.id);
      if (error) throw error;
      window.dispatchEvent(new Event("profile-sharing-changed"));
      void queryClient.invalidateQueries({ queryKey: ["public-ranking"] });
      if (optIn) {
        const games = CALCS.filter((c) => inc[c.id].units > 0 || localStorage.getItem(`ranking-owned-${user.id}-${c.id}`) === "yes").map((c) => c.id);
        await syncPublicStats(user.id, inc, games);
        for (const game of games) localStorage.setItem(`ranking-owned-${user.id}-${game}`, "yes");
      }
      toast.success("Perfil e privacidade salvos");
    } catch { toast.error("Não foi possível salvar tudo. Seus dados locais foram preservados; tente novamente."); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold">👤 Meu Perfil</h1>

      {!loading && !user && (
        <section className="panel space-y-3 p-5">
          <p className="text-sm text-muted-foreground">As calculadoras funcionam sem conta. Entre apenas para criar seu perfil público e participar do ranking — sua carteira continua só neste dispositivo.</p>
          <Button asChild><Link to="/auth">Entrar ou criar conta</Link></Button>
        </section>
      )}

      {user && (
        <section className="panel space-y-4 p-5">
          <div className="flex items-center gap-4">
            <label className="cursor-pointer">
              {avatar ? <img src={avatar} alt="Foto" className="h-20 w-20 rounded-full object-cover" /> : <span className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-3xl">👤</span>}
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setAvatar(await resizeImage(f)); }} />
              <span className="mt-1 block text-center text-xs text-primary">Alterar foto</span>
            </label>
            <div className="flex-1 space-y-1">
              <Label htmlFor="pname">Nome do jogador</Label>
              <Input id="pname" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/70 p-3">
            <div>
              <p className="font-medium">Participar do ranking</p>
              <p className="text-xs text-muted-foreground">Seu nome e somente as informações autorizadas abaixo.</p>
            </div>
            <Switch checked={optIn} onCheckedChange={setOptIn} />
          </div>
          <div className="space-y-3 border-t border-border pt-4">
            <h2 className="font-semibold">Privacidade do perfil público</h2>
            <div className="flex items-center justify-between gap-3"><Label htmlFor="public-photo">Compartilhar foto</Label><Switch id="public-photo" checked={publicAvatar} onCheckedChange={setPublicAvatar} /></div>
            {CALCS.map((c) => <div key={c.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-border py-2">
              <span className="text-sm">{c.label}</span>
              <label className="flex flex-col items-center gap-1 text-xs text-muted-foreground">Quantidade<Switch aria-label={`Compartilhar quantidade ${c.id}`} checked={unitsGames.includes(c.id)} onCheckedChange={(value) => setUnitsGames((prev) => value ? [...new Set([...prev, c.id])] : prev.filter((id) => id !== c.id))} /></label>
              <label className="flex flex-col items-center gap-1 text-xs text-muted-foreground">Rendimentos<Switch aria-label={`Compartilhar rendimentos ${c.id}`} checked={incomeGames.includes(c.id)} onCheckedChange={(value) => setIncomeGames((prev) => value ? [...new Set([...prev, c.id])] : prev.filter((id) => id !== c.id))} /></label>
            </div>)}
            <p className="text-xs text-muted-foreground">E-mail, saldo, minas individuais e detalhes da carteira nunca são divulgados. Valores ocultos aparecem como “Não disponibilizado”.</p>
          </div>
          <div>
            <p className="mb-2 font-medium">Minhas Calculadoras</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {CALCS.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-border/70 p-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={calcs.includes(c.id)} onChange={(e) => setCalcs((p) => (e.target.checked ? [...p, c.id] : p.filter((x) => x !== c.id)))} />
                    {c.label}
                  </label>
                  <button type="button" className="text-xs text-primary" onClick={() => { setMode(c.id); navigate({ to: "/" }); }}>{mode === c.id ? "Ativa" : "Usar"}</button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled={saving || !profileReady} onClick={save}>{saving ? "Salvando..." : "Salvar perfil e privacidade"}</Button>
            <Button variant="outline" asChild><Link to="/ranking">🏆 Analisar Ranking</Link></Button>
            <Button variant="ghost" onClick={() => supabase.auth.signOut()}>Sair</Button>
          </div>
        </section>
      )}

      {inc && (
        <section className="panel space-y-3 p-5">
          <h2 className="font-semibold">💰 Minha renda estimada</h2>
          {CALCS.map((c) => (
            <div key={c.id} className="flex justify-between text-sm">
              <span>{c.label}</span>
              <span className="num">{inc[c.id].monthly === null ? "Não configurada" : `${show(c.id, inc[c.id].monthly ?? 0)}/mês`}</span>
            </div>
          ))}
          <p className="text-xs text-muted-foreground" data-testid="fx">
            {eurUsd ? `Cotação automática: 1 € = US$ ${eurUsd.toFixed(4)} · atualizada em ${fx.updatedAt ? new Date(fx.updatedAt).toLocaleString("pt-BR") : "—"}` : "Buscando cotação EUR→USD…"}
            {fx.stale && eurUsd && " · dados temporariamente desatualizados (usando a última cotação válida)"}
            {fx.stale && !eurUsd && " Não foi possível obter a cotação agora; o Fortune World fica fora do total."}
          </p>
          <div className="flex justify-between border-t border-border pt-2 font-semibold">
            <span>Total estimado</span><span className="num">{total === null ? "Não configurada" : `${formatMoney(total)}/mês`}</span>
          </div>
          <h2 className="pt-3 font-semibold">📊 Meu painel</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {([["Diária", "daily"], ["Semanal", "weekly"], ["Mensal", "monthly"], ["Anual", "yearly"]] as const).map(([l, key]) => (
              <div key={l} className="rounded-lg border border-border/70 p-3">
                <p className="text-xs text-muted-foreground">{l} total</p>
                <p className="num font-semibold">{(() => {
                  const values = CALCS.filter((c) => calcs.includes(c.id) && inc[c.id].monthly !== null).map((c) => usd(c.id, inc[c.id][key])).filter((v): v is number => v !== null);
                  return values.length ? formatMoney(values.reduce((a, b) => a + b, 0)) : "—";
                })()}</p>
              </div>
            ))}
          </div>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={CALCS.map((c) => ({ name: c.label, v: usd(c.id, inc[c.id].monthly) ?? 0 }))}>
                <XAxis dataKey="name" fontSize={11} stroke="currentColor" />
                <YAxis fontSize={11} stroke="currentColor" width={60} />
                <Tooltip formatter={(v: number) => formatMoney(v)} />
                <Bar dataKey="v" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <section className="panel p-5">
        <h2 className="mb-2 font-semibold">🚀 Em breve</h2>
        <div className="flex flex-wrap gap-2">
          {FUTURE.map((f) => <span key={f} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">{f}</span>)}
        </div>
      </section>
    </div>
  );
}
