export type MineType = "rock" | "coal" | "gold" | "diamond";

export const MINE_TYPES: MineType[] = ["rock", "coal", "gold", "diamond"];

export interface Mine {
  id: string;
  type: MineType;
  level: number;
  name?: string;
  externalId?: string;
  note?: string;
  createdAt: number;
}

/**
 * All values that can change in TerraMine live here.
 * Nothing in the calculation engine hardcodes these numbers.
 */
export interface Params {
  /** Monthly USD income of a level-1 mine, without boost, per type. */
  baseMonthly: Record<MineType, number>;
  /** Relative multipliers per type (reference / documentation value). */
  typeMultiplier: Record<MineType, number>;
  /** Income gain per level above level 1 (0.01 = +1%). */
  levelStep: number;
  /** Boost multiplier applied during boosted hours. */
  boostMultiplier: number;
  /** Boosted hours per day (0-24). */
  boostHoursPerDay: number;
  /** TerraMine withdrawal fee, as a fraction (0.17 = 17%). */
  withdrawalFee: number;
  /** Additional tax/fee, as a fraction. Always kept separate from the fee. */
  additionalTax: number;
  maxLevel: number;
  daysPerMonth: number;
  daysPerYear: number;
}

export interface AppState {
  mines: Mine[];
  params: Params;
  balance: number;
  goals: number[];
  language: Language;
  version: number;
}

export type Language = "pt" | "en";
