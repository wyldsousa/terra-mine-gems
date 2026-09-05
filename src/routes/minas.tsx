import { createFileRoute } from "@tanstack/react-router";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { MineDialog, MineTypePicker } from "@/components/mines/MineDialog";
import { SectionTitle } from "@/components/common/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  calculateMineDailyIncome,
  calculateMineIncomeWithBoost,
  calculateMineMonthlyIncome,
} from "@/calculations/terraMineCalculator";
import { MINE_META } from "@/data/defaults";
import { useAppState } from "@/hooks/useAppState";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { MINE_TYPES, type Mine, type MineType } from "@/types";

export const Route = createFileRoute("/minas")({
  head: () => ({
    meta: [
      { title: "Minhas Minas — TerraMine Calculator" },
      { name: "description", content: "Cadastre cada mina, informe o nível e veja o rendimento individual." },
      { property: "og:title", content: "Minhas Minas — TerraMine Calculator" },
      { property: "og:description", content: "Gerencie suas minas e acompanhe o rendimento de cada uma." },
    ],
  }),
  component: MinesPage,
});

type SortKey = "incomeDesc" | "incomeAsc" | "levelDesc" | "levelAsc" | "type";

function MinesPage() {
  const { t, tx, mines, params, removeMine, duplicateMine, addMines } = useAppState();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Mine | null>(null);
  const [filter, setFilter] = useState<MineType | "all">("all");
  const [sort, setSort] = useState<SortKey>("incomeDesc");

  const list = useMemo(() => {
    const filtered = filter === "all" ? mines : mines.filter((m) => m.type === filter);
    const income = (m: Mine) => calculateMineIncomeWithBoost(m, params);
    return [...filtered].sort((a, b) => {
      switch (sort) {
        case "incomeAsc":
          return income(a) - income(b);
        case "levelDesc":
          return b.level - a.level;
        case "levelAsc":
          return a.level - b.level;
        case "type":
          return MINE_TYPES.indexOf(a.type) - MINE_TYPES.indexOf(b.type);
        default:
          return income(b) - income(a);
      }
    });
  }, [mines, params, filter, sort]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">{t.mines.title}</h1>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="mr-1 h-4 w-4" />
          {t.common.add}
        </Button>
      </div>

      <QuickAdd
        onAdd={(type, quantity, level) => {
          addMines(Array.from({ length: quantity }, () => ({ type, level })));
          toast.success(tx(t.mines.addedQuick, { count: quantity }));
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs",
            filter === "all" ? "border-primary text-foreground" : "border-border text-muted-foreground",
          )}
        >
          {t.common.all} ({mines.length})
        </button>
        {MINE_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs",
              filter === type ? "border-primary text-foreground" : "border-border text-muted-foreground",
            )}
          >
            {MINE_META[type].emoji} {t.mineTypes[type]} ({mines.filter((m) => m.type === type).length})
          </button>
        ))}
        <div className="ml-auto w-44">
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger>
              <SelectValue placeholder={t.mines.sortBy} />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(t.mines.sort) as SortKey[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {t.mines.sort[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="panel p-6 text-center text-sm text-muted-foreground">{t.mines.empty}</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((mine) => (
            <article key={mine.id} className="panel p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{MINE_META[mine.type].emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display font-semibold">
                    {mine.name || t.mineTypes[mine.type]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.mineTypes[mine.type]} · {t.common.level} {mine.level}
                    {mine.externalId ? ` · #${mine.externalId}` : ""}
                  </p>
                </div>
                <div className="flex gap-1">
                  <IconBtn
                    label={t.common.edit}
                    onClick={() => {
                      setEditing(mine);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </IconBtn>
                  <IconBtn label={t.common.duplicate} onClick={() => duplicateMine(mine.id)}>
                    <Copy className="h-4 w-4" />
                  </IconBtn>
                  <IconBtn
                    label={t.common.delete}
                    onClick={() => {
                      if (confirm(t.mines.deleteConfirm)) removeMine(mine.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </IconBtn>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <Cell label={t.mines.daily} value={formatMoney(calculateMineDailyIncome(mine, params))} />
                <Cell label={t.mines.monthly} value={formatMoney(calculateMineMonthlyIncome(mine, params))} />
                <Cell
                  label={t.mines.withBoost}
                  value={formatMoney(calculateMineIncomeWithBoost(mine, params) * params.daysPerMonth)}
                />
              </div>
              {mine.note ? <p className="mt-2 text-xs text-muted-foreground">{mine.note}</p> : null}
            </article>
          ))}
        </div>
      )}

      <MineDialog open={open} onOpenChange={setOpen} editing={editing} />
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:text-foreground"
    >
      {children}
    </button>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/40 p-2">
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
      <p className="num text-xs font-semibold">{value}</p>
    </div>
  );
}

function QuickAdd({ onAdd }: { onAdd: (type: MineType, quantity: number, level: number) => void }) {
  const { t, params } = useAppState();
  const [type, setType] = useState<MineType>("rock");
  const [quantity, setQuantity] = useState(1);
  const [level, setLevel] = useState(1);
  const [confirming, setConfirming] = useState(false);
  const savingRef = useRef(false);

  const qty = Math.max(1, Math.floor(quantity) || 1);
  const lvl = Math.min(Math.max(Math.floor(level) || 1, 1), params.maxLevel);
  const unitMonthly = calculateMineMonthlyIncome({ type, level: lvl }, params);

  const confirm = () => {
    if (savingRef.current) return;
    savingRef.current = true;
    onAdd(type, qty, lvl);
    setConfirming(false);
    window.setTimeout(() => {
      savingRef.current = false;
    }, 400);
  };

  return (
    <section className="panel p-4">
      <SectionTitle>{t.mines.quickAdd}</SectionTitle>
      <p className="mb-3 text-xs text-muted-foreground">{t.mines.quickAddDesc}</p>
      <MineTypePicker value={type} onChange={setType} />
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="qa-qty">{t.common.quantity}</Label>
          <Input
            id="qa-qty"
            type="number"
            min={1}
            inputMode="numeric"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="qa-level">{t.mines.avgLevel}</Label>
          <Input
            id="qa-level"
            type="number"
            min={1}
            max={params.maxLevel}
            inputMode="numeric"
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
          />
        </div>
        <div className="flex items-end">
          <Button
            className="w-full"
            onClick={() => {
              const qty = Math.max(1, Math.floor(quantity) || 1);
              const lvl = Math.min(Math.max(Math.floor(level) || 1, 1), params.maxLevel);
              onAdd(type, qty, lvl);
            }}
          >
            {t.common.add}
          </Button>
        </div>
      </div>
    </section>
  );
}
