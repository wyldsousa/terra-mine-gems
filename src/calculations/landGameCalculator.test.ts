import { describe, expect, it } from "vitest";
import { calculateLandIncome, eventHoursInWindow, tierValue } from "./landGameCalculator";
import { DEFAULT_LAND_PARAMS, defaultLandState } from "@/data/landGames";

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
    expect(r).toEqual({ common: 0.000000011, rare: 0.000000016, epic: 0.000000022, legendary: 0.000000044 });
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
    expect(r.perSecond.noBoost).toBeCloseTo(0.00000011, 15);
    expect(r.monthly).toBeCloseTo(0.00000011 * 86400 * 30, 12);
  });
  it("SRB 50x replaces multiplier during event hours", () => {
    const s = defaultLandState("atlas");
    s.counts = { common: 1 };
    s.events = [{ id: "a", start: "", durationHours: 32 }];
    const r = calculateLandIncome(s);
    const ps = 0.000000011;
    expect(r.monthly).toBeCloseTo(ps * 3600 * (720 - 32) + ps * 50 * 3600 * 32, 12);
  });
  it("dated events overlap window", () => {
    const now = new Date("2026-01-01T00:00").getTime();
    const h = eventHoursInWindow([{ id: "a", start: "2026-01-10T00:00", durationHours: 24 }], now, now + 30 * 86400000);
    expect(h).toBe(24);
  });
});
