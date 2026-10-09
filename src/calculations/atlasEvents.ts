import { DEFAULT_LAND_PARAMS, type LandEvent, type LandParams } from "@/data/landGames";

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

/** Upgrade Atlas rates once, retaining the player's counts and other settings. */
export function migrateAtlasParams(params: LandParams): LandParams {
  if ((params.version ?? 0) >= 4) return params;
  const official = DEFAULT_LAND_PARAMS.atlas;
  return {
    ...params,
    gameId: "atlas",
    version: official.version ?? 4,
    rarities: official.rarities.map((rarity) => ({
      ...rarity,
      ...params.rarities.find((r) => r.id === rarity.id),
      perSecond: rarity.perSecond,
    })),
  };
}

/** Calendar occurrences clipped to the window; overlapping events are credited only once. */
export function atlasEventHours(events: LandEvent[], from: number, to: number, params: LandParams) {
  const credited = events.map((event) => ({ id: event.id, hours: 0, estimated: !event.start }));
  if (to <= from) return credited;
  const intervals: { from: number; to: number; index: number }[] = [];
  events.forEach((event, index) => {
    const credit = credited[index];
    if (!credit) return;
    const start = new Date(event.start).getTime();
    if (!Number.isFinite(start)) return;
    credit.estimated = false;
    const base = new Date(start);
    const first = new Date(from - Math.max(0, event.durationHours) * HOUR_MS);
    const last = new Date(to);
    const offset = (first.getFullYear() - base.getFullYear()) * 12 + first.getMonth() - base.getMonth();
    const end = (last.getFullYear() - base.getFullYear()) * 12 + last.getMonth() - base.getMonth();
    for (let month = offset; month <= end; month++) {
      // Clamp to the last day of the target month instead of overflowing February.
      const occurrence = new Date(base);
      occurrence.setDate(1);
      occurrence.setMonth(base.getMonth() + month);
      const maxDay = new Date(occurrence.getFullYear(), occurrence.getMonth() + 1, 0).getDate();
      occurrence.setDate(Math.min(base.getDate(), maxDay));
      const a = Math.max(from, occurrence.getTime());
      const b = Math.min(to, occurrence.getTime() + Math.max(0, event.durationHours) * HOUR_MS);
      if (b > a) intervals.push({ from: a, to: b, index });
    }
  });
  intervals.sort((a, b) => a.from - b.from || a.index - b.index);
  let coveredUntil = from;
  for (const interval of intervals) {
    const start = Math.max(coveredUntil, interval.from);
    const credit = credited[interval.index];
    if (credit && interval.to > start) credit.hours += (interval.to - start) / HOUR_MS;
    coveredUntil = Math.max(coveredUntil, interval.to);
  }
  // Dates missing: explicitly estimated, 12 monthly occurrences per configured year.
  // Extra days in a 365-day year earn normal income, not a thirteenth SRB.
  const days = (to - from) / DAY_MS;
  const years = Math.floor(days / params.daysPerYear);
  const months = years * 12 + Math.min(12, (days - years * params.daysPerYear) / params.daysPerMonth);
  let remaining = (to - from) / HOUR_MS - credited.reduce((sum, e) => sum + e.hours, 0);
  events.forEach((event, index) => {
    const credit = credited[index];
    if (!credit?.estimated) return;
    const hours = Math.min(remaining, Math.max(0, event.durationHours) * months);
    credit.hours = hours;
    remaining -= hours;
  });
  return credited;
}