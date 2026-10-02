import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumericInput } from "@/components/common/NumericInput";
import { formatMoney } from "@/lib/format";
import { GAME_META, gameMonthly, gameUnits, useGame, type GameId } from "@/lib/games";

export function GameCalculator({ game }: { game: GameId }) {
  const meta = GAME_META[game];
  const { data, setData, num } = useGame(game);
  const monthly = gameMonthly(data);
  const units = gameUnits(data);
  const update = (id: string, patch: Record<string, unknown>) =>
    setData((d) => ({ ...d, items: d.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));

  const periods = [
    ["Diário", 1 / 30],
    ["Semanal", 7 / 30],
    ["Mensal", 1],
    ["Anual", 365 / 30],
  ] as const;
  const missing = Math.max(0, num(data.goal) - num(data.balance));
  const daysToGoal = monthly && monthly > 0 && num(data.goal) > 0 ? missing / (monthly / 30) : null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">{meta.emoji} {meta.name}</h1>
        <p className="text-sm text-muted-foreground">
          Calculadora independente — dados e fórmula próprios, não usa nada do TerraMine. Os valores por {meta.unit} começam em branco: informe os números do seu jogo.
        </p>
      </div>

      <section className="panel space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Seus {meta.unitPlural} ({units})</h2>
          <Button size="sm" onClick={() => setData((d) => ({ ...d, items: [...d.items, { id: crypto.randomUUID(), name: "", qty: "", monthlyPerUnit: "" }] }))}>
            <Plus className="h-4 w-4" /> Adicionar grupo
          </Button>
        </div>
        {data.items.length === 0 && <p className="text-sm text-muted-foreground">Nenhum grupo ainda. Ex.: raridade "Comum", quantidade 50, US$ por unidade/mês.</p>}
        {data.items.map((i) => (
          <div key={i.id} className="grid grid-cols-[1fr_auto] gap-2 rounded-lg border border-border/70 p-3 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end">
            <div className="col-span-2 space-y-1 sm:col-span-1">
              <Label>Nome / raridade</Label>
              <Input value={i.name} onChange={(e) => update(i.id, { name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Quantidade</Label>
              <NumericInput inputMode="numeric" value={i.qty} onChange={(e) => update(i.id, { qty: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>US$/unid./mês</Label>
              <NumericInput value={i.monthlyPerUnit} onChange={(e) => update(i.id, { monthlyPerUnit: e.target.value })} />
            </div>
            <Button variant="ghost" size="icon" aria-label="Remover" onClick={() => setData((d) => ({ ...d, items: d.items.filter((x) => x.id !== i.id) }))}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1"><Label>Bônus / boost (%)</Label><NumericInput value={data.bonusPercent} onChange={(e) => setData((d) => ({ ...d, bonusPercent: e.target.value }))} /></div>
          <div className="space-y-1"><Label>Saldo atual (US$)</Label><NumericInput value={data.balance} onChange={(e) => setData((d) => ({ ...d, balance: e.target.value }))} /></div>
          <div className="space-y-1"><Label>Meta (US$)</Label><NumericInput value={data.goal} onChange={(e) => setData((d) => ({ ...d, goal: e.target.value }))} /></div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {periods.map(([label, f]) => (
          <div key={label} className="panel p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="num mt-1 text-lg font-semibold">{monthly === null ? "Não configurada" : formatMoney(monthly * f)}</p>
          </div>
        ))}
      </section>
      {daysToGoal !== null && (
        <p className="panel p-4 text-sm">
          Meta: faltam <span className="num font-semibold">{formatMoney(missing)}</span> — cerca de <span className="num font-semibold">{Math.ceil(daysToGoal)}</span> dias.
        </p>
      )}
      <p className="text-xs text-muted-foreground">Estimativa: renda mensal = Σ(quantidade × US$/unidade) × (1 + bônus%). Dados salvos só neste dispositivo.</p>
    </div>
  );
}
