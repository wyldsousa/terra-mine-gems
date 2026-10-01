import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NumericInput } from "@/components/common/NumericInput";
import { calculatePortfolioIncome } from "@/calculations/terraMineCalculator";
import { MINE_META } from "@/data/defaults";
import { useAppState } from "@/hooks/useAppState";
import { formatMoney } from "@/lib/format";
import { MINE_TYPES, type MineType } from "@/types";

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
}) {
  const { t } = useAppState();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.common.cancel}
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** ⚡ Bulk level manager: group by level, move N mines (or all) from level A to level B. */
export function LevelManager({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { mines, params, state, t, setMinesLevel } = useAppState();
  const pt = state.language === "pt";
  const [typeFilter, setTypeFilter] = useState<MineType | "all">("all");
  const [fromLevel, setFromLevel] = useState<number | null>(null);
  const [qty, setQty] = useState<number | string>("");
  const [toLevel, setToLevel] = useState<number | string>("");
  const [reviewing, setReviewing] = useState(false);

  const pool = useMemo(
    () => (typeFilter === "all" ? mines : mines.filter((m) => m.type === typeFilter)),
    [mines, typeFilter],
  );
  const groups = useMemo(() => {
    const map = new Map<number, number>();
    pool.forEach((m) => map.set(m.level, (map.get(m.level) ?? 0) + 1));
    return [...map.entries()].sort((a, b) => b[0] - a[0]);
  }, [pool]);

  const available = fromLevel === null ? 0 : (groups.find(([l]) => l === fromLevel)?.[1] ?? 0);
  const count = Math.min(Math.max(Math.floor(Number(qty) || 0), 0), available);
  const target = Math.min(Math.max(Math.floor(Number(toLevel) || 0), 0), params.maxLevel);
  const valid = fromLevel !== null && count > 0 && target >= 1 && target !== fromLevel;

  // Pick the oldest mines first so the choice is deterministic.
  const ids = useMemo(
    () =>
      fromLevel === null
        ? []
        : pool
            .filter((m) => m.level === fromLevel)
            .sort((a, b) => a.createdAt - b.createdAt)
            .slice(0, count)
            .map((m) => m.id),
    [pool, fromLevel, count],
  );

  const before = calculatePortfolioIncome(mines, params, params.boostHoursPerDay).withBoost.perMonth;
  const idSet = new Set(ids);
  const after = calculatePortfolioIncome(
    mines.map((m) => (idSet.has(m.id) ? { ...m, level: target || m.level } : m)),
    params,
    params.boostHoursPerDay,
  ).withBoost.perMonth;

  const reset = () => {
    setFromLevel(null);
    setQty("");
    setToLevel("");
    setReviewing(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>⚡ {pt ? "Gerenciar níveis" : "Manage levels"}</DialogTitle>
          <DialogDescription>
            {pt ? "Escolha um grupo de nível, a quantidade e o novo nível." : "Pick a level group, quantity and new level."}
          </DialogDescription>
        </DialogHeader>

        {!reviewing ? (
          <div className="space-y-4">
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v as MineType | "all"); setFromLevel(null); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.common.all}</SelectItem>
                {MINE_TYPES.map((ty) => (
                  <SelectItem key={ty} value={ty}>{MINE_META[ty].emoji} {t.mineTypes[ty]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {groups.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.mines.empty}</p>
            ) : (
              <div className="grid gap-2">
                {groups.map(([lvl, n]) => (
                  <button
                    key={lvl}
                    type="button"
                    data-testid={`level-group-${lvl}`}
                    onClick={() => { setFromLevel(lvl); setQty(n); }}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${fromLevel === lvl ? "border-primary bg-secondary" : "border-border"}`}
                  >
                    <span className="font-semibold">LV {lvl}</span>
                    <span className="text-muted-foreground">{n} {pt ? "minas" : "mines"}</span>
                  </button>
                ))}
              </div>
            )}

            {fromLevel !== null && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="lm-qty">{t.common.quantity} (max {available})</Label>
                  <NumericInput id="lm-qty" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lm-to">{pt ? "Novo nível" : "New level"}</Label>
                  <NumericInput id="lm-to" inputMode="numeric" value={toLevel} onChange={(e) => setToLevel(e.target.value)} />
                </div>
                <Button variant="outline" size="sm" className="col-span-2" onClick={() => setQty(available)}>
                  {pt ? `Evoluir todas (${available})` : `Upgrade all (${available})`}
                </Button>
              </div>
            )}
            <DialogFooter>
              <Button disabled={!valid} onClick={() => setReviewing(true)}>
                {pt ? "Revisar alteração" : "Review change"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="rounded-lg border border-border/70 bg-background/40 p-3">
              <p className="font-semibold">
                {count} {pt ? "minas" : "mines"} LV {fromLevel} → LV {target}
              </p>
              <p className="mt-1 text-muted-foreground">
                {pt ? "Renda mensal" : "Monthly income"}: <span className="num">{formatMoney(before)}</span> →{" "}
                <span className="num font-semibold text-foreground">{formatMoney(after)}</span>
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReviewing(false)}>{t.common.cancel}</Button>
              <Button
                onClick={() => {
                  setMinesLevel(ids, target);
                  reset();
                  onOpenChange(false);
                }}
              >
                {t.common.confirm}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
