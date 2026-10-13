import { landRentStateSchema, type LandRentParams, type LandRentState } from "@/data/landRent";
export function landRentBadgePercent(count: number, params: LandRentParams): number | null {
  if (!Number.isInteger(count) || count < 0 || count > 200) return null;
  return params.badgeBands.reduce((sum, b) => sum + Math.max(0, Math.min(count, b.max) - b.min + 1) * b.value, 0);
}
export function landRentTier(count: number, params: LandRentParams) {
  return params.plotBands.find((b) => count >= b.min && count <= b.max) ?? null;
}
export function landRentReferenceAnnual(plots: number, multiplier: number, params: LandRentParams) {
  return plots * params.annualAtReference / params.referenceMultiplier * multiplier;
}
export function calculateLandRent(input: LandRentState) {
  const s = landRentStateSchema.parse(input), p = s.params;
  const basePerSecond = p.annualAtReference / p.referenceMultiplier / (p.daysPerYear * 86400);
  const badgePercent = landRentBadgePercent(s.badges, p) ?? 0;
  const tier = landRentTier(s.plots, p);
  const multiplier = tier?.value ?? 1;
  const parcelRate = s.plots * basePerSecond * (1 + badgePercent / 100);
  const perSecond = parcelRate * multiplier;
  const normal = { daily: perSecond * 86400, weekly: perSecond * 7 * 86400, monthly: perSecond * p.daysPerYear * 86400 / 12, yearly: perSecond * p.daysPerYear * 86400 };
  const eventPerSecond = parcelRate * p.eventMultiplier;
  const eventNormal = perSecond * p.eventHours * 3600;
  const eventTotal = eventPerSecond * p.eventHours * 3600;
  const eventAdditional = eventTotal - eventNormal;
  // Average recurring projection: one occurrence / configured interval. Add only incremental rent.
  // A supplied start is the phase of the recurring schedule; average periods are phase-independent.
  const annualOccurrences = p.daysPerYear / p.eventEveryDays;
  const extraYear = s.eventEnabled ? eventAdditional * annualOccurrences : 0;
  return { basePerSecond, badgePercent, tier, multiplier, perSecond, perHour: perSecond * 3600, normal,
    daily: normal.daily + extraYear / p.daysPerYear,
    weekly: normal.weekly + (s.eventEnabled ? eventAdditional * 7 / p.eventEveryDays : 0),
    monthly: normal.monthly + extraYear / 12, yearly: normal.yearly + extraYear,
    event: { perSecond: eventPerSecond, total: eventTotal, normal: eventNormal, additional: eventAdditional, annualOccurrences },
    badgeReferenceCalculated: landRentBadgePercent(200, p),
  };
}
