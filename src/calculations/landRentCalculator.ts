import { landRentStateSchema, type LandRentParams, type LandRentState } from "@/data/landRent";
export function landRentBadgePercent(count: number, params: LandRentParams): number | null {
  if (!Number.isInteger(count) || count < 0 || count > (params.badgeBands.at(-1)?.max ?? 0)) return null;
  return params.badgeBands.reduce((sum, b) => sum + Math.max(0, Math.min(count, b.max) - b.min + 1) * b.value, 0);
}
export function landRentTier(count: number, params: LandRentParams) {
  return params.plotBands.find((b) => count >= b.min && count <= b.max) ?? null;
}
export function calculateLandRent(input: LandRentState) {
  const s = landRentStateSchema.parse(input);
  const p = s.params;
  const secondsPerYear = p.daysPerYear * 24 * 3600;
  const basePerSecond = p.annualAtReference / p.referenceMultiplier / secondsPerYear;
  const badgePercent = landRentBadgePercent(s.badges, p);
  const tier = landRentTier(s.plots, p);
  const multiplier = s.boost === "none" ? 1 : s.boost === "reference" ? p.referenceMultiplier : tier?.value ?? (s.plots === 0 ? 1 : null);
  const boostedHours = s.boostHours ?? 24;
  const effectiveMultiplier = multiplier === null ? null : (boostedHours * multiplier + (24 - boostedHours)) / 24;
  const parcelRate = badgePercent === null ? null : s.plots * basePerSecond * (1 + badgePercent / 100);
  const perSecond = parcelRate === null || multiplier === null ? null : parcelRate * multiplier;
  const daily = parcelRate === null || effectiveMultiplier === null ? null : parcelRate * effectiveMultiplier * 86400;
  const yearly = daily === null ? null : daily * p.daysPerYear;
  // Standalone event scenario: ONLY the explicitly entered event multiplier. No normal boost or annual aggregation.
  const event = s.eventMultiplier === null || parcelRate === null ? null : {
    perHour: parcelRate * s.eventMultiplier * 3600,
    total: parcelRate * s.eventMultiplier * 3600 * p.eventHours,
  };
  return { basePerSecond, badgePercent, tier, multiplier, effectiveMultiplier, perSecond, perHour: perSecond === null ? null : perSecond * 3600,
    daily, weekly: daily === null ? null : daily * 7, monthly: yearly === null ? null : yearly / 12, yearly, event,
    badgeReferenceCalculated: landRentBadgePercent(200, p),
  };
}
