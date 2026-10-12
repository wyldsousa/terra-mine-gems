import { z } from "zod";
import type { GameMode } from "./landGames";
export type CalculatorGameMode = Exclude<GameMode, "land-rents">;
export function landRentReturnGame(value: string | null): CalculatorGameMode {
  return value === "atlas" || value === "fortune" ? value : "terramine";
}
const finite = z.number().finite();
const band = z.object({ min: finite.int().positive(), max: finite.int().positive(), value: finite.nonnegative(), referenceUsd: finite.nonnegative().nullable().optional() });
export const landRentParamsSchema = z.object({
  annualAtReference: finite.positive().max(1000), referenceMultiplier: finite.positive().max(1000), daysPerYear: finite.positive().max(366),
  badgeReferencePercent: finite.nonnegative().max(10000),
  badgeBands: z.array(band).min(1), plotBands: z.array(band).min(1),
  eventHours: finite.positive().max(24), eventMin: finite.positive().max(1000), eventMax: finite.positive().max(1000),
  adHours: finite.positive().max(24),
}).superRefine((p, ctx) => {
  for (const key of ["badgeBands", "plotBands"] as const) {
    let next = 1;
    for (const [i, b] of p[key].entries()) {
      if (b.min !== next || b.max < b.min) ctx.addIssue({ code: "custom", path: [key, i], message: "Faixas devem ser consecutivas, sem lacunas ou sobreposição." });
      next = b.max + 1;
    }
  }
  if (p.eventMin > p.eventMax) ctx.addIssue({ code: "custom", message: "Faixa do evento inválida." });
});
export type LandRentParams = z.infer<typeof landRentParamsSchema>;
export const DEFAULT_LAND_RENT_PARAMS: LandRentParams = {
  annualAtReference: 0.10, referenceMultiplier: 2, daysPerYear: 365, badgeReferencePercent: 41.4,
  badgeBands: [{ min: 1, max: 2, value: 2 }, { min: 3, max: 10, value: 0.8 }, { min: 11, max: 40, value: 0.3 }, { min: 41, max: 100, value: 0.2 }, { min: 101, max: 200, value: 0.1 }],
  plotBands: [
    { min: 1, max: 200, value: 6 }, { min: 201, max: 300, value: 5 }, { min: 301, max: 425, value: 4 },
    { min: 426, max: 550, value: 2 }, { min: 551, max: 700, value: 2 }, { min: 701, max: 875, value: 2 },
    { min: 876, max: 1050, value: 2 }, { min: 1051, max: 1250, value: 2 }, { min: 1251, max: 1450, value: 2 },
    { min: 1451, max: 1725, value: 2, referenceUsd: 172.5 }, { min: 1726, max: 2050, value: 2, referenceUsd: 205 },
    { min: 2051, max: 2450, value: 2, referenceUsd: 245 }, { min: 2451, max: 3000, value: 2, referenceUsd: 300 },
    { min: 3001, max: 10000, value: 2, referenceUsd: 1000 },
  ], eventHours: 18, eventMin: 18, eventMax: 30, adHours: 1,
};
export const landRentStateSchema = z.object({
  plots: finite.int().min(0).max(1000000), badges: finite.int().min(0).max(1000000),
  boost: z.enum(["none", "reference", "regional"]),
  boostHours: finite.min(0).max(24).nullable(),
  eventMultiplier: finite.positive().max(1000).nullable(),
  params: landRentParamsSchema,
});
export type LandRentState = z.infer<typeof landRentStateSchema>;
export const LAND_RENT_KEY = "land-rent-brazil-group4-v1";
export function defaultLandRentState(): LandRentState {
  return { plots: 0, badges: 0, boost: "none", boostHours: null, eventMultiplier: null, params: structuredClone(DEFAULT_LAND_RENT_PARAMS) };
}
export const LAND_RENT_AVAILABILITY = { calculatorEnabled: true, officialRules: null, realMoneyConversionEnabled: false } as const;
