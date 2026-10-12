import { describe, expect, it } from "vitest";
import { DEFAULT_LAND_RENT_PARAMS as p, defaultLandRentState, landRentParamsSchema } from "@/data/landRent";
import { calculateLandRent, landRentBadgePercent, landRentTier } from "./landRentCalculator";
describe("Land Rent Brazil Group 4", () => {
  it("one plot at 2x earns exactly the supplied $0.10 annual anchor", () => {
    const r = calculateLandRent({ ...defaultLandRentState(), plots: 1, boost: "reference" });
    expect(r.yearly).toBeCloseTo(0.10, 14); expect(r.basePerSecond).toBeCloseTo(0.05 / 31536000, 20);
  });
  it("one unboosted plot derives $0.05/year, without double-boosting", () => {
    expect(calculateLandRent({ ...defaultLandRentState(), plots: 1 }).yearly).toBeCloseTo(0.05, 14);
  });
  it("three badges add 4.8% progressively", () => { expect(landRentBadgePercent(3, p)).toBeCloseTo(4.8, 12); });
  it("200 badges match supplied cumulative 41.4%", () => { expect(landRentBadgePercent(200, p)).toBeCloseTo(41.4, 12); });
  it("unknown badge counts do not extrapolate", () => { expect(landRentBadgePercent(201, p)).toBeNull(); });
  const bands = [[1,200,6],[201,300,5],[301,425,4],[426,550,2],[551,700,2],[701,875,2],[876,1050,2],[1051,1250,2],[1251,1450,2],[1451,1725,2],[1726,2050,2],[2051,2450,2],[2451,3000,2],[3001,10000,2]];
  for (const [min,max,value] of bands) it(`preserves band ${min}–${max} at ${value}x and both boundaries`, () => {
    expect(landRentTier(min, p)).toMatchObject({ min, max, value }); expect(landRentTier(max, p)).toMatchObject({ min, max, value });
    expect(p.plotBands.filter((b) => max >= b.min && max <= b.max)).toHaveLength(1);
  });
  it("has no gaps/overlaps and no invented tier after 10000", () => {
    expect(p.plotBands).toHaveLength(14); expect(landRentParamsSchema.safeParse(p).success).toBe(true);
    expect(landRentTier(10001, p)).toBeNull();
    expect(landRentParamsSchema.safeParse({ ...p, plotBands: [{ min: 1, max: 200, value: 6 }, { min: 200, max: 300, value: 5 }] }).success).toBe(false);
  });
  it("applies badges once and averages the year over 12 months", () => {
    const r = calculateLandRent({ ...defaultLandRentState(), plots: 1, badges: 3, boost: "reference" });
    expect(r.yearly).toBeCloseTo(0.1048, 12); expect(r.monthly).toBeCloseTo(0.1048 / 12, 12);
  });
  it("event is absent without a selected multiplier, standalone otherwise", () => {
    const s = { ...defaultLandRentState(), plots: 200, boost: "regional" as const };
    const normal = calculateLandRent(s); expect(normal.event).toBeNull();
    const r = calculateLandRent({ ...s, eventMultiplier: 18 });
    expect(r.yearly).toBe(normal.yearly); expect(r.event?.total).toBeCloseTo(200 * (0.05 / 31536000) * 18 * 18 * 3600, 12);
  });
  it("supports explicitly entered boosted hours without inventing ad caps", () => {
    expect(calculateLandRent({ ...defaultLandRentState(), plots: 1, boost: "reference", boostHours: 12 }).yearly).toBeCloseTo(0.075, 12);
  });
  it("ignores unconfirmed monetary references in calculations", () => {
    const s = { ...defaultLandRentState(), plots: 1725, boost: "regional" as const };
    expect(calculateLandRent(s).yearly).toBeCloseTo(172.5, 10);
    expect(calculateLandRent({ ...s, params: { ...p, plotBands: p.plotBands.map((b) => ({ ...b, referenceUsd: 999999 })) } }).yearly).toBeCloseTo(172.5, 10);
  });
});
