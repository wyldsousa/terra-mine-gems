import { useEffect, useState } from "react";

/** Independent calculators (Atlas Earth / Fortune World). Never mixed with TerraMine data. */
export type GameId = "atlas" | "fortune";

export interface GameItem {
  id: string;
  name: string;
  qty: number | string;
  /** USD per unit per month — entered by the user, blank by default (no invented values). */
  monthlyPerUnit: number | string;
}

export interface GameData {
  items: GameItem[];
  /** Bonus/boost in percent applied over the base income (e.g. badges). Blank = 0. */
  bonusPercent: number | string;
  balance: number | string;
  goal: number | string;
}

export const GAME_META: Record<GameId, { emoji: string; name: string; unit: string; unitPlural: string }> = {
  atlas: { emoji: "🌎", name: "Atlas Earth", unit: "terreno", unitPlural: "terrenos" },
  fortune: { emoji: "🍀", name: "Fortune World", unit: "propriedade", unitPlural: "propriedades" },
};

const EMPTY: GameData = { items: [], bonusPercent: "", balance: "", goal: "" };
const key = (g: GameId) => `game-calc-${g}-v1`;
const num = (v: number | string) => {
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

export function loadGame(g: GameId): GameData {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(key(g));
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

/** Returns null when not configured (no units or no per-unit income informed). */
export function gameMonthly(d: GameData): number | null {
  const configured = d.items.some((i) => num(i.qty) > 0 && String(i.monthlyPerUnit).trim() !== "");
  if (!configured) return null;
  const base = d.items.reduce((s, i) => s + num(i.qty) * num(i.monthlyPerUnit), 0);
  return base * (1 + num(d.bonusPercent) / 100);
}

export function gameUnits(d: GameData): number {
  return d.items.reduce((s, i) => s + Math.max(0, Math.floor(num(i.qty))), 0);
}

export function useGame(g: GameId) {
  const [data, setData] = useState<GameData>(EMPTY);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setData(loadGame(g));
    setReady(true);
  }, [g]);
  useEffect(() => {
    if (ready) localStorage.setItem(key(g), JSON.stringify(data));
  }, [data, ready, g]);
  return { data, setData, num };
}
