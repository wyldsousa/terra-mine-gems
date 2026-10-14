import { z } from "zod";
import type { GameMode } from "./landGames";
export type CalculatorGameMode = Exclude<GameMode, "land-rents">;
export function landRentReturnGame(value: string | null): CalculatorGameMode {
  return value === "atlas" || value === "fortune" ? value : "terramine";
}
const finite = z.number().finite();
const band = z.object({ min: finite.int().positive(), max: finite.int().positive(), value: finite.nonnegative(), referenceUsd: finite.nonnegative().nullable().optional() });
export const landRentParamsSchema = z.object({
  basePerSecond: finite.positive().max(1).nullable().default(null),
  annualAtReference: finite.positive().max(1000), referenceMultiplier: finite.positive().max(1000), daysPerYear: finite.positive().max(366),
  badgeReferencePercent: finite.nonnegative().max(10000),
  badgeBands: z.array(band).min(1), plotBands: z.array(band).min(1),
  eventHours: finite.positive().max(24), eventMultiplier: finite.positive().max(1000).default(30), eventEveryDays: finite.min(1).max(365).default(7),
  adHours: finite.positive().max(24),
}).superRefine((p, ctx) => {
  for (const key of ["badgeBands", "plotBands"] as const) {
    let next = 1;
    for (const [i, b] of p[key].entries()) {
      if (b.min !== next || b.max < b.min) ctx.addIssue({ code: "custom", path: [key, i], message: "Faixas devem ser consecutivas, sem lacunas ou sobreposição." });
      next = b.max + 1;
    }
  }
  if (p.plotBands.at(-1)?.max !== 10000 || p.badgeBands.at(-1)?.max !== 200) ctx.addIssue({ code: "custom", message: "Tabelas devem cobrir 1–10000 terrenos e 1–200 emblemas." });
  if (p.eventHours > p.eventEveryDays * 24) ctx.addIssue({ code: "custom", message: "Eventos não podem se sobrepor." });
  for (const b of p.plotBands) if (b.value <= 0 || b.value > 1000 || [10, 18, 30].includes(b.value)) ctx.addIssue({ code: "custom", message: "Boost normal deve ser positivo e não pode ser 10×, 18× ou 30×." });
});
export type LandRentParams = z.infer<typeof landRentParamsSchema>;
export const DEFAULT_LAND_RENT_PARAMS: LandRentParams = {
  basePerSecond: null, annualAtReference: 0.10, referenceMultiplier: 2, daysPerYear: 365, badgeReferencePercent: 41.4,
  badgeBands: [{ min: 1, max: 2, value: 2 }, { min: 3, max: 10, value: 0.8 }, { min: 11, max: 40, value: 0.3 }, { min: 41, max: 100, value: 0.2 }, { min: 101, max: 200, value: 0.1 }],
  plotBands: [
    { min: 1, max: 200, value: 6 }, { min: 201, max: 300, value: 5 }, { min: 301, max: 425, value: 4 },
    { min: 426, max: 550, value: 2 }, { min: 551, max: 700, value: 2 }, { min: 701, max: 875, value: 2 },
    { min: 876, max: 1050, value: 2 }, { min: 1051, max: 1250, value: 2 }, { min: 1251, max: 1450, value: 2 },
    { min: 1451, max: 1725, value: 2, referenceUsd: 172.5 }, { min: 1726, max: 2050, value: 2, referenceUsd: 205 },
    { min: 2051, max: 2450, value: 2, referenceUsd: 245 }, { min: 2451, max: 3000, value: 2, referenceUsd: 300 },
    { min: 3001, max: 10000, value: 2, referenceUsd: 1000 },
  ], eventHours: 18, eventMultiplier: 30, eventEveryDays: 7, adHours: 1,
};
export const landRentGoalSchema = z.object({ id: z.string().min(1), name: z.string().trim().min(1).max(80), target: finite.positive(), targetDate: z.string().refine(s => s === "" || /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s))), note: z.string().max(500), startedAt: z.string().datetime() });
export type LandRentGoal = z.infer<typeof landRentGoalSchema>;
export function landRentStorageKey(userId: string | null) { return userId ? `${LAND_RENT_KEY}:owner:${userId}` : LAND_RENT_KEY; }
export const landRentStateSchema = z.object({
  boostHours: finite.min(0).max(24).default(0), goals: z.array(landRentGoalSchema).max(100).default([]),
  plots: finite.int().min(0).max(10000), badges: finite.int().min(0).max(200),
  eventEnabled: z.boolean().default(false), eventStart: z.string().max(16).refine((s) => s === "" || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)), "Data inválida").default(""),
  adMultiplier: finite.positive().max(1000).nullable().default(null),
  params: landRentParamsSchema,
});
export type LandRentState = z.infer<typeof landRentStateSchema>;
export const LAND_RENT_KEY = "land-rent-brazil-group4-v1";
export function defaultLandRentState(): LandRentState {
  return { boostHours: 0, goals: [], plots: 0, badges: 0, eventEnabled: false, eventStart: "", adMultiplier: null, params: structuredClone(DEFAULT_LAND_RENT_PARAMS) };
}
export function migrateLandRent(value: unknown): LandRentState {
  const parsed = landRentStateSchema.safeParse(value);
  if (parsed.success) return parsed.data;
  return defaultLandRentState();
}
export const LAND_RENT_AVAILABILITY = { calculatorEnabled: true, officialRules: null, realMoneyConversionEnabled: false } as const;
