import type { AppState, Params } from "@/types";

/**
 * REFERENCE VALUES — community sourced, not officially confirmed by TerraMine.
 * Editable at runtime in Settings; nothing else in the app hardcodes them.
 */
export const DEFAULT_PARAMS: Params = {
  baseMonthly: {
    rock: 0.002851,
    coal: 0.004147,
    gold: 0.005702,
    diamond: 0.011405,
  },
  typeMultiplier: {
    rock: 1,
    coal: 1.5,
    gold: 2,
    diamond: 4,
  },
  levelStep: 0.01,
  boostMultiplier: 20,
  boostHoursPerDay: 0,
  withdrawalFee: 0.17,
  additionalTax: 0.101,
  maxLevel: 100,
  daysPerMonth: 30,
  daysPerYear: 365,
};

export const DEFAULT_GOALS = [1, 5, 10, 25, 50, 100, 500, 1000];

export const DEFAULT_STATE: AppState = {
  mines: [],
  params: DEFAULT_PARAMS,
  balance: 0,
  goals: DEFAULT_GOALS,
  language: "pt",
  version: 1,
};

export const MINE_META = {
  rock: { emoji: "🪨", color: "var(--ore-rock)", chart: "var(--ore-rock)" },
  coal: { emoji: "⚫", color: "var(--ore-coal)", chart: "var(--ore-coal)" },
  gold: { emoji: "🟡", color: "var(--ore-gold)", chart: "var(--ore-gold)" },
  diamond: { emoji: "💎", color: "var(--ore-diamond)", chart: "var(--ore-diamond)" },
} as const;
