import { z } from "zod";

export const CURRENCY_BY_GAME = { atlas: "AB", fortune: "FC", terramine: "TB" } as const;
export type CoinGame = keyof typeof CURRENCY_BY_GAME;

export const RARITIES: Record<"atlas" | "fortune", string[]> = {
  atlas: ["common", "rare", "epic", "legendary"],
  fortune: ["common", "uncommon", "rare", "epic", "legendary"],
};
export const MINE_TYPES = ["rock", "coal", "gold", "diamond"] as const;

const itemAction = z.object({
  kind: z.literal("items"),
  game: z.enum(["atlas", "fortune", "terramine", "land-rents"]),
  op: z.enum(["add", "remove", "set"]),
  quantity: z.number().int().min(0).max(10000),
  rarity: z.string().nullable().optional(),
  mineType: z.enum(MINE_TYPES).nullable().optional(),
  level: z.number().int().min(1).max(1000).nullable().optional(),
});
const earningAction = z.object({
  kind: z.literal("earning"),
  game: z.enum(["atlas", "fortune", "terramine"]),
  amount: z.number().positive().max(100000000),
  source: z.string().min(1).max(60),
});
export const chatActionSchema = z.discriminatedUnion("kind", [itemAction, earningAction]);
export type ChatAction = z.infer<typeof chatActionSchema>;

export const chatResultSchema = z.object({
  reply: z.string().max(1000),
  question: z.string().max(500).nullable().optional(),
  actions: z.array(z.unknown()).max(10).default([]),
});

/** Validates model output: keeps only actions that respect each game's rules. */
export function validateActions(raw: unknown[]): ChatAction[] {
  const out: ChatAction[] = [];
  for (const r of raw) {
    const p = chatActionSchema.safeParse(r);
    if (!p.success) continue;
    const a = p.data;
    if (a.kind === "items") {
      if ((a.game === "atlas" || a.game === "fortune") && !RARITIES[a.game].includes(a.rarity ?? "")) continue;
      if (a.game === "terramine" && a.op === "add" && !a.mineType) continue;
      if (a.op !== "set" && a.quantity < 1) continue;
    }
    out.push(a);
  }
  return out;
}

export interface EarningRow { game: string; currency: string; amount: number; source: string; earned_at: string }

/** Sums earnings of the given calendar month (local time), per currency and per source. */
export function monthlyEarnings(rows: EarningRow[], now = new Date()) {
  const totals: Record<string, number> = { AB: 0, FC: 0, TB: 0 };
  const sources: Record<string, Record<string, number>> = { AB: {}, FC: {}, TB: {} };
  for (const r of rows) {
    const d = new Date(r.earned_at);
    if (d.getFullYear() !== now.getFullYear() || d.getMonth() !== now.getMonth()) continue;
    const c = r.currency;
    if (!(c in totals)) continue;
    totals[c] = (totals[c] ?? 0) + Number(r.amount);
    const src = sources[c]!;
    src[r.source] = (src[r.source] ?? 0) + Number(r.amount);
  }
  return { totals, sources };
}
