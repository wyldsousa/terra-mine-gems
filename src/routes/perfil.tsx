import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAppState } from "@/hooks/useAppState";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { formatMoney } from "@/lib/format";
import { localIncomes, resizeImage, syncPublicStats, type RankGame } from "@/lib/profile";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Meu Perfil — TerraMine Calculator" },
      { name: "description", content: "Seu perfil, calculadoras, renda estimada total e participação no ranking." },
      { property: "og:title", content: "Meu Perfil — TerraMine Calculator" },
      { property: "og:description", content: "Seu perfil, calculadoras, renda estimada total e participação no ranking." },
    ],
  }),
  component: ProfilePage,
});

const CALCS: { id: RankGame; label: string; to: "/calculadora" | "/atlas" | "/fortune" }[] = [
  { id: "atlas", label: "🌎 Atlas Earth", to: "/atlas" },
  { id: "fortune", label: "🍀 Fortune World", to: "/fortune" },
  { id: "terramine", label: "⛏️ TerraMine", to: "/calculadora" },
];

const FUTURE = ["Histórico de rendimento", "Conquistas", "Comparação entre jogos", "Registro de ganhos reais", "Alertas de metas", "Conversão USD/BRL", "Compartilhar perfil / link público", "Evolução do ranking", "Recordes pessoais"];

function ProfilePage() {
  const { user, loading } = useAuth();
  const { mines, params } = useAppState();
  const [inc, setInc] = useState<ReturnType<typeof localIncomes> | null>(null);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [optIn, setOptIn] = useState(false);
  const [calcs, setCalcs] = useState<string[]>(["terramine"]);
  const [saving, setSaving] = useState(false);

  useEffect(() => setInc(localIncomes(mines, params)), [mines, params]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (data) {
        setName(data.display_name); setAvatar(data.avatar_url); setOptIn(data.ranking_opt_in); setCalcs(data.calculators);
      } else {
        const display = (user.user_metadata?.["full_name"] as string | undefined)?.slice(0, 40) || "Jogador";
        await supabase.from("profiles").insert({ id: user.id, display_name: display });
        setName(display);
      }
    })();
  }, [user]);

  const total = useMemo(() => {
    if (!inc) return null;
    const vals = CALCS.filter((c) => calcs.includes(c.id)).map((c) => inc[c.id].monthly).filter((v): v is number => v !== null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) : null;
  }, [inc, calcs]);

  const save = async () => {
    if (!user || !inc) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ display_name: name.trim().slice(0, 40) || "Jogador", avatar_url: avatar, ranking_opt_in: optIn, calculators: calcs }).eq("id", user.id);
    if (!error) await syncPublicStats(user.id, inc);
    setSaving(false);
    error ? toast.error("Erro ao salvar") : toast.success("Perfil salvo");
  };

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold">👤 Meu Perfil</h1>

      {!loading && !user && (
        <section className="panel space-y-3 p-5">
          <p className="text-sm text-muted-foreground">As calculadoras funcionam sem conta. Entre apenas para criar seu perfil público e participar do ranking — sua carteira continua só neste dispositivo.</p>
          <Button onClick={async () => { const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/perfil" }); if (r.error) toast.error("Não foi possível entrar"); }}>
            Entrar com Google
          </Button>
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
              <p className="text-xs text-muted-foreground">Mostra só nome, foto, quantidade e renda estimada mensal.</p>
            </div>
            <Switch checked={optIn} onCheckedChange={setOptIn} />
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
                  <Link to={c.to} className="text-xs text-primary">Abrir</Link>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled={saving} onClick={save}>{saving ? "Salvando..." : "Salvar e publicar estatísticas"}</Button>
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
              <span className="num">{inc[c.id].monthly === null ? "Não configurada" : `${formatMoney(inc[c.id].monthly!)}/mês`}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-border pt-2 font-semibold">
            <span>Total estimado</span><span className="num">{total === null ? "Não configurada" : `${formatMoney(total)}/mês`}</span>
          </div>
          <h2 className="pt-3 font-semibold">📊 Meu painel</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {([["Diária", 1 / 30], ["Semanal", 7 / 30], ["Mensal", 1], ["Anual", 365 / 30]] as const).map(([l, f]) => (
              <div key={l} className="rounded-lg border border-border/70 p-3">
                <p className="text-xs text-muted-foreground">{l} total</p>
                <p className="num font-semibold">{total === null ? "—" : formatMoney(total * f)}</p>
              </div>
            ))}
          </div>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={CALCS.map((c) => ({ name: c.label, v: inc[c.id].monthly ?? 0 }))}>
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
