import type { GameMode } from "./landGames";

export type CalculatorGameMode = Exclude<GameMode, "land-rents">;

export function landRentReturnGame(value: string | null): CalculatorGameMode {
  return value === "atlas" || value === "fortune" ? value : "terramine";
}

/** Future-only domain contracts. No rates, engines, seeded data or financial conversions. */
export interface LandRentPlot {
  id: string;
  categoryId: string;
  name?: string;
}

export interface LandRentCategory {
  id: string;
  label: string;
}

export interface LandRentOfficialRules {
  sourceUrl: string;
  verifiedAt: string;
  categories: LandRentCategory[];
  bonuses: { id: string; label: string; multiplier: number }[];
  /** Must name an official virtual unit; never assume a real currency. */
  virtualUnit: string;
}

export const LAND_RENT_AVAILABILITY = {
  calculatorEnabled: false,
  officialRules: null as LandRentOfficialRules | null,
  realMoneyConversionEnabled: false,
} as const;