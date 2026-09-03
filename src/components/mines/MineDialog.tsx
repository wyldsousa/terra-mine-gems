import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MINE_META } from "@/data/defaults";
import { useAppState } from "@/hooks/useAppState";
import { cn } from "@/lib/utils";
import { MINE_TYPES, type Mine, type MineType } from "@/types";

export interface MineDraft {
  type: MineType;
  level: number;
  name: string;
  externalId: string;
  note: string;
}

const EMPTY: MineDraft = { type: "rock", level: 1, name: "", externalId: "", note: "" };

export function MineTypePicker({
  value,
  onChange,
}: {
  value: MineType;
  onChange: (t: MineType) => void;
}) {
  const { t } = useAppState();
  return (
    <div className="grid grid-cols-4 gap-2">
      {MINE_TYPES.map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          className={cn(
            "flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs transition-colors",
            value === type
              ? "border-primary bg-secondary text-foreground"
              : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          <span className="text-xl">{MINE_META[type].emoji}</span>
          {t.mineTypes[type]}
        </button>
      ))}
    </div>
  );
}

export function MineDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing?: Mine | null;
}) {
  const { t, params, addMine, updateMine } = useAppState();
  const [draft, setDraft] = useState<MineDraft>(EMPTY);

  useEffect(() => {
    if (!open) return;
    setDraft(
      editing
        ? {
            type: editing.type,
            level: editing.level,
            name: editing.name ?? "",
            externalId: editing.externalId ?? "",
            note: editing.note ?? "",
          }
        : EMPTY,
    );
  }, [open, editing]);

  const submit = () => {
    const payload = {
      type: draft.type,
      level: Math.min(Math.max(Math.floor(draft.level) || 1, 1), params.maxLevel),
      name: draft.name.trim() || undefined,
      externalId: draft.externalId.trim() || undefined,
      note: draft.note.trim() || undefined,
    };
    if (editing) updateMine(editing.id, payload);
    else addMine(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? t.mines.editMine : t.mines.newMine}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t.common.type}</Label>
            <MineTypePicker value={draft.type} onChange={(type) => setDraft((d) => ({ ...d, type }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="level">
              {t.common.level} (1–{params.maxLevel})
            </Label>
            <Input
              id="level"
              type="number"
              min={1}
              max={params.maxLevel}
              inputMode="numeric"
              value={draft.level}
              onChange={(e) => setDraft((d) => ({ ...d, level: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">
              {t.common.name} <span className="text-muted-foreground">({t.common.optional})</span>
            </Label>
            <Input
              id="name"
              placeholder={t.mines.nameHint}
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="extid">{t.mines.externalId}</Label>
              <Input
                id="extid"
                value={draft.externalId}
                onChange={(e) => setDraft((d) => ({ ...d, externalId: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">{t.mines.note}</Label>
              <Input
                id="note"
                value={draft.note}
                onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.common.cancel}
          </Button>
          <Button onClick={submit}>{t.common.save}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
