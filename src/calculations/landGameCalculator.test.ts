import { describe, expect, it } from "vitest";
import { calculateLandIncome, eventHoursInWindow, tierValue } from "./landGameCalculator";
import { DEFAULT_LAND_PARAMS, defaultLandState } from "@/data/landGames";
import { atlasEventHours, migrateAtlasParams } from "./atlasEvents";

describe("land games", () => {
  it("atlas boost tiers", () => {
    const t = DEFAULT_LAND_PARAMS.atlas.boostTiers;
    expect(tierValue(t, 60)).toBe(20);
    expect(tierValue(t, 61)).toBe(15);
    expect(tierValue(t, 150)).toBe(8);
    expect(tierValue(t, 401)).toBe(2);
  });
  it("fortune bonus comes from badges, not parcels", () => {
    const s = defaultLandState("fortune");
    s.counts = { common: 200 };
    s.badges = 0;
    expect(calculateLandIncome(s).bonusPercent).toBe(0);
    s.badges = 15;
    expect(calculateLandIncome(s).bonusPercent).toBe(10);
    expect(calculateLandIncome(s).multiplier).toBe(10);
  });
  it("atlas official per-second rates", () => {
    const r = Object.fromEntries(DEFAULT_LAND_PARAMS.atlas.rarities.map((x) => [x.id, x.perSecond]));
    expect(r).toEqual({ common: 0.0000000011, rare: 0.0000000016, epic: 0.0000000022, legendary: 0.0000000044 });
  });
  it("fortune boost + badge tiers", () => {
    const p = DEFAULT_LAND_PARAMS.fortune;
    expect(tierValue(p.boostTiers, 50)).toBe(20);
    expect(tierValue(p.boostTiers, 751)).toBe(2);
    expect(tierValue(p.bonusTiers, 0)).toBe(0);
    expect(tierValue(p.bonusTiers, 30)).toBe(10);
  });
  it("atlas income: 10 common, no boost, no badges, events of 0h", () => {
    const s = defaultLandState("atlas");
    s.counts = { common: 10 };
    s.events = s.events.map((e) => ({ ...e, durationHours: 0 }));
    const r = calculateLandIncome(s);
    expect(r.perSecond.noBoost).toBeCloseTo(0.000000011, 15);
    expect(r.monthly).toBeCloseTo(0.000000011 * 86400 * 30, 12);
  });
  it("SRB 50x replaces multiplier during event hours", () => {
    const s = defaultLandState("atlas");
    s.counts = { common: 1 };
    s.events = [{ id: "a", start: "", durationHours: 32 }];
    const r = calculateLandIncome(s);
    const ps = 0.0000000011;
    expect(r.monthly).toBeCloseTo(ps * 3600 * (720 - 32) + ps * 50 * 3600 * 32, 12);
  });
  it("dated events overlap window", () => {
    const now = new Date("2026-01-01T00:00").getTime();
    const h = eventHoursInWindow([{ id: "a", start: "2026-01-10T00:00", durationHours: 24 }], now, now + 30 * 86400000);
    expect(h).toBe(24);
  });
});

describe("atlas audit", () => {
  const mk = (counts: Record<string, number>, badges: number, hours: number, evH: number) => {
    const s = defaultLandState("atlas");
    s.counts = counts; s.badges = badges; s.boostHoursPerDay = hours;
    s.events = s.events.map((e) => ({ ...e, durationHours: evH }));
    return calculateLandIncome(s);
  };
  it("492 lands mixed: sum, boost 2x, SRB replaces boost, breakdown sums", () => {
    const c = { common: 250, rare: 150, epic: 70, legendary: 22 };
    const base = 250 * 0.0000000011 + 150 * 0.0000000016 + 70 * 0.0000000022 + 22 * 0.0000000044;
    const r = mk(c, 40, 6, 32);
    expect(r.units).toBe(492);
    expect(r.multiplier).toBe(2);
    expect(r.bonusPercent).toBe(15);
    expect(r.perSecond.noBoost).toBeCloseTo(base * 1.15, 18);
    expect(r.perSecond.boost).toBeCloseTo(base * 1.15 * 2, 18);
    expect(r.perSecond.event).toBeCloseTo(base * 1.15 * 50, 18);
    const evH = 64, rest = 720 - evH;
    const expected = 3600 * base * 1.15 * (rest * 18 / 24 + rest * 6 / 24 * 2 + evH * 50);
    expect(r.monthly).toBeCloseTo(expected, 10);
    const b = r.breakdown;
    expect(b.plain.income + b.boost.income + b.event.income).toBeCloseTo(r.monthly, 10);
  });
  it("50 commons no badges, boost 20x 2h", () => {
    const r = mk({ common: 50 }, 0, 2, 0);
    const ps = 50 * 0.0000000011;
    expect(r.monthly).toBeCloseTo(3600 * ps * 30 * (22 + 2 * 20), 12);
    expect(r.yearly).toBeCloseTo(3600 * ps * 365 * (22 + 40), 10);
  });
});

describe("Atlas actual 481-land reference", () => {
  const reference = () => {
    const s = defaultLandState("atlas");
    s.counts = { common: 238, rare: 156, epic: 66, legendary: 21 };
    s.badges = 17;
    s.boostHoursPerDay = 24;
    return s;
  };
  it("sums actual rarities to 481 and $0.000000749/s, ignoring probabilities", () => {
    const s = reference();
    s.params.rarities.forEach((r) => { r.probability = 0; });
    const r = calculateLandIncome(s);
    expect(r.units).toBe(481);
    expect(r.basePerSecond).toBeCloseTo(0.000000749, 18);
    expect(r.baseMonthly).toBeCloseTo(1.941408, 12);
  });
  it("applies 17 badges once and the 481-land normal 2x boost", () => {
    const r = calculateLandIncome(reference());
    expect(r.bonusPercent).toBe(10);
    expect(r.multiplier).toBe(2);
    expect(r.perSecond.noBoost).toBeCloseTo(0.0000008239, 18);
    expect(r.perSecond.boost * 86400 * 30).toBeCloseTo(4.2710976, 10);
  });
  it("SRB replaces 2x: hourly and each 32-hour event", () => {
    const r = calculateLandIncome(reference());
    expect(r.perSecond.event * 3600).toBeCloseTo(0.148302, 12);
    expect(r.breakdown.events.map((e) => e.hours)).toEqual([32, 32]);
    for (const e of r.breakdown.events) expect(e.income).toBeCloseTo(4.745664, 12);
    expect(r.breakdown.event.income).toBeCloseTo(9.491328, 12);
  });
  it("30-day projection counts 656 normal hours and 64 SRB hours exactly once", () => {
    const r = calculateLandIncome(reference());
    expect(r.breakdown.plain.hours).toBe(0);
    expect(r.breakdown.boost.hours).toBe(656);
    expect(r.eventHoursMonth).toBe(64);
    expect(r.monthly).toBeCloseTo(13.38277248, 10);
    expect(r.breakdown.boost.income + r.breakdown.event.income).toBeCloseTo(r.monthly, 12);
  });
  it("365-day projection has 24 SRBs, not 365/30 fractional months", () => {
    const r = calculateLandIncome(reference());
    expect(r.yearly).toBeCloseTo(0.000000749 * 1.1 * 3600 * ((8760 - 768) * 2 + 768 * 50), 10);
    expect(r.yearly).toBeCloseTo(161.30511936, 8);
  });
  it.each([[60,20],[61,15],[75,15],[76,12],[100,12],[101,10],[120,10],[121,8],[150,8],[151,6],[200,6],[201,5],[250,5],[251,4],[300,4],[301,3],[400,3],[401,2],[481,2]])("%i lands gets %ix", (n, expected) => {
    expect(tierValue(DEFAULT_LAND_PARAMS.atlas.boostTiers, n)).toBe(expected);
  });
  it.each([[0,0],[1,5],[10,5],[11,10],[30,10],[31,15],[60,15],[61,20],[100,20],[101,25]])("%i badges gets %i%%", (n, expected) => {
    expect(tierValue(DEFAULT_LAND_PARAMS.atlas.bonusTiers, n)).toBe(expected);
  });
  it("dated overlapping SRBs count the union, with partial edges", () => {
    const from = new Date("2026-01-01T00:00").getTime();
    const events = [
      { id: "one", start: "2025-12-31T16:00", durationHours: 32 },
      { id: "two", start: "2026-01-01T08:00", durationHours: 32 },
    ];
    const periods = atlasEventHours(events, from, from + 2 * 86400000, DEFAULT_LAND_PARAMS.atlas);
    expect(periods.map((e) => e.hours)).toEqual([24, 16]);
  });
  it("dated calendar year has two 32h occurrences each month", () => {
    const s = reference();
    s.events = [{ id: "one", start: "2026-01-05T00:00", durationHours: 32 }, { id: "two", start: "2026-01-20T00:00", durationHours: 32 }];
    const r = calculateLandIncome(s, new Date("2026-01-01T00:00").getTime());
    expect(r.monthly).toBeCloseTo(13.38277248, 10);
    expect(r.yearly).toBeCloseTo(161.30511936, 8);
  });
  it("migrates only Atlas rates and preserves player settings and future custom rates", () => {
    const old = structuredClone(DEFAULT_LAND_PARAMS.atlas);
    old.version = 2;
    old.eventMultiplier = 60;
    old.rarities.forEach((r) => { r.perSecond *= 10; });
    const migrated = migrateAtlasParams(old);
    expect(migrated.rarities.map((r) => r.perSecond)).toEqual([1.1e-9, 1.6e-9, 2.2e-9, 4.4e-9]);
    expect(migrated.eventMultiplier).toBe(60);
    migrated.rarities.forEach((r) => { r.perSecond = 1e-9; });
    expect(migrateAtlasParams(migrated)).toBe(migrated);
  });
  it("Fortune dateless projections retain the existing annual proration", () => {
    const s = defaultLandState("fortune");
    s.counts = { common: 200 }; s.badges = 17; s.boostHoursPerDay = 24;
    const r = calculateLandIncome(s);
    const evH = 48 * 365 / 30;
    expect(r.yearly).toBeCloseTo(200e-9 * 1.1 * 3600 * ((8760 - evH) * 10 + evH * 50), 10);
  });
});
