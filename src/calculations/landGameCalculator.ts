import type { LandEvent, LandState, Tier } from "@/data/landGames";

/** Formulas for Atlas Earth / Fortune World. No internal rounding. */
const H = 3600;
const DAY_MS = 86_400_000;

export function tierValue(tiers: Tier[], n: number): number {
  let v = 0;
  for (const t of [...tiers].sort((a, b) => a.min - b.min)) if (n >= t.min) v = t.value;
  return v;
}

export function totalUnits(s: Pick<LandState, "counts">): number {
  return Object.values(s.counts).reduce((a, b) => a + (Number(b) || 0), 0);
}

function parseStart(e: LandEvent): number | null {
  if (!e.start) return null;
  const t = new Date(e.start).getTime();
  return Number.isFinite(t) ? t : null;
}

/**
 * Event hours overlapping [from, to). Events repeat monthly from their configured date.
 * An event without a date counts as one full occurrence per `daysPerMonth` window (estimate).
 */
export function eventHoursInWindow(events: LandEvent[], from: number, to: number, daysPerMonth = 30): number {
  let ms = 0;
  for (const e of events) {
    const dur = Math.max(0, e.durationHours) * H * 1000;
    const start = parseStart(e);
    if (start === null) {
      ms += dur * ((to - from) / (daysPerMonth * DAY_MS));
      continue;
    }
    const base = new Date(start);
    for (let k = -2; k < 200; k++) {
      const s = new Date(base);
      s.setMonth(base.getMonth() + k);
      const a = s.getTime();
      if (a >= to) break;
      ms += Math.max(0, Math.min(a + dur, to) - Math.max(a, from));
    }
  }
  return Math.min(ms, to - from) / (H * 1000);
}

export function nextEventStart(e: LandEvent, now = Date.now()): number | null {
  const start = parseStart(e);
  if (start === null) return null;
  const base = new Date(start);
  for (let k = -2; k < 200; k++) {
    const s = new Date(base);
    s.setMonth(base.getMonth() + k);
    if (s.getTime() + e.durationHours * H * 1000 > now) return s.getTime();
  }
  return null;
}

export function calculateLandIncome(s: LandState, now = Date.now()) {
  const p = s.params;
  const units = totalUnits(s);
  const basePS = p.rarities.reduce((sum, r) => sum + (Number(s.counts[r.id]) || 0) * r.perSecond, 0);
  const multiplier = tierValue(p.boostTiers, units);
  const bonusPercent = tierValue(p.bonusTiers, p.bonusSource === "badges" ? s.badges : units);
  const f = 1 + bonusPercent / 100;
  const noBoostPS = basePS * f;
  const boostPS = basePS * multiplier * f;
  const eventPS = basePS * p.eventMultiplier * f;
  const h = Math.min(Math.max(Number(s.boostHoursPerDay) || 0, 0), 24);
  const normalDaily = H * (noBoostPS * (24 - h) + boostPS * h);
  const windowIncome = (days: number) => {
    const ev = eventHoursInWindow(s.events, now, now + days * DAY_MS, p.daysPerMonth);
    return (normalDaily / 24) * (days * 24 - ev) + eventPS * H * ev;
  };
  const monthly = windowIncome(p.daysPerMonth);
  const yearly = windowIncome(p.daysPerYear);
  const avgDaily = monthly / p.daysPerMonth;
  const bonusGainMonthly = monthly - monthly / f;
  // Explicit monthly breakdown: hours in each regime and their income (sums exactly to `monthly`).
  const evH = eventHoursInWindow(s.events, now, now + p.daysPerMonth * DAY_MS, p.daysPerMonth);
  const restH = p.daysPerMonth * 24 - evH;
  const boostH = (restH * h) / 24;
  const plainH = restH - boostH;
  const breakdown = {
    plain: { hours: plainH, income: noBoostPS * H * plainH },
    boost: { hours: boostH, income: boostPS * H * boostH },
    event: { hours: evH, income: eventPS * H * evH },
  };
  return {
    breakdown,
    basePerSecond: basePS,
    units,
    multiplier,
    bonusPercent,
    perSecond: { noBoost: noBoostPS, boost: boostPS, event: eventPS },
    normalDaily,
    noBoostDaily: noBoostPS * H * 24,
    eventDaily: eventPS * H * 24,
    avgDaily,
    weekly: avgDaily * 7,
    monthly,
    yearly,
    bonusGainMonthly,
    eventHoursMonth: eventHoursInWindow(s.events, now, now + p.daysPerMonth * DAY_MS, p.daysPerMonth),
    windowIncome,
  };
}

/** Per-rarity monthly income (normal day, without events) — for distribution charts. */
export function rarityShares(s: LandState) {
  const inc = calculateLandIncome(s);
  const f = 1 + inc.bonusPercent / 100;
  const h = Math.min(Math.max(Number(s.boostHoursPerDay) || 0, 0), 24);
  const factor = f * H * ((24 - h) + inc.multiplier * h) * s.params.daysPerMonth;
  return s.params.rarities.map((r) => ({ ...r, count: Number(s.counts[r.id]) || 0, monthly: (Number(s.counts[r.id]) || 0) * r.perSecond * factor }));
}

export function daysToGoal(goal: number, balance: number, avgDaily: number): number | null {
  if (balance >= goal) return 0;
  if (avgDaily <= 0) return null;
  return (goal - balance) / avgDaily;
}
