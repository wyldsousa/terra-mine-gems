import { describe, expect, it } from "vitest";
import { DEFAULT_LAND_RENT_PARAMS as p, defaultLandRentState, landRentParamsSchema, landRentStateSchema } from "@/data/landRent";
import { calculateLandRent, landRentBadgePercent, landRentTier, landRentReferenceAnnual } from "./landRentCalculator";
describe("Land Rent Brazil Group 4", () => {
  it("reference one plot at 2x is $0.10/year (not selectable normal tier)", () => { expect(landRentReferenceAnnual(1,2,p)).toBeCloseTo(0.10,14); });
  it("reference without boost is $0.05/year", () => { expect(landRentReferenceAnnual(1,1,p)).toBeCloseTo(0.05,14); });
  for (const [badges,percent] of [[0,0],[1,2],[2,4],[3,4.8],[10,10.4],[200,41.4]] as const) it(`${badges} badges gives ${percent}%`, () => { expect(landRentBadgePercent(badges,p)).toBeCloseTo(percent,12); });
  const bands = [[1,200,6],[201,300,5],[301,425,4],[426,550,2],[551,700,2],[701,875,2],[876,1050,2],[1051,1250,2],[1251,1450,2],[1451,1725,2],[1726,2050,2],[2051,2450,2],[2451,3000,2],[3001,10000,2]] as const;
  for (const [min,max,value] of bands) it(`preserves ${min}–${max} at ${value}x`, () => {
    expect(landRentTier(min,p)).toMatchObject({min,max,value}); expect(landRentTier(max,p)).toMatchObject({min,max,value});
    expect(calculateLandRent({...defaultLandRentState(),plots:min}).multiplier).toBe(value);
    expect(calculateLandRent({...defaultLandRentState(),plots:max}).multiplier).toBe(value);
  });
  it("rejects 10001 plots, negatives, fractional counts and >200 badges", () => {
    for (const patch of [{plots:10001},{plots:-1},{plots:1.5},{badges:201},{badges:-1},{badges:1.1}]) expect(landRentStateSchema.safeParse({...defaultLandRentState(),...patch}).success).toBe(false);
    expect(calculateLandRent({...defaultLandRentState(),plots:10000}).yearly).toBeCloseTo(1000,10);
  });
  it("has no gaps/overlaps and never permits 30x/18x/10x normal tiers", () => {
    expect(p.plotBands).toHaveLength(14);
    for (let count=1;count<=10000;count++) expect(p.plotBands.filter(b=>count>=b.min && count<=b.max)).toHaveLength(1);
    for (const value of [30,18,10]) expect(landRentParamsSchema.safeParse({...p,plotBands:[{min:1,max:10000,value}]}).success).toBe(false);
  });
  it("event replaces normal boost at 30x for 18h and keeps badges once", () => {
    const r=calculateLandRent({...defaultLandRentState(),plots:200,badges:3,eventEnabled:true});
    const base=200*(0.05/31536000)*1.048;
    expect(r.event.total).toBeCloseTo(base*30*18*3600,12);
    expect(r.event.normal).toBeCloseTo(base*6*18*3600,12);
    expect(r.event.additional).toBeCloseTo(base*24*18*3600,12);
  });
  it("weekly/monthly/yearly use only incremental event rent once", () => {
    const r=calculateLandRent({...defaultLandRentState(),plots:426,eventEnabled:true,eventStart:"2026-10-17T09:00"});
    expect(r.weekly).toBeCloseTo(r.normal.weekly+r.event.additional,12);
    expect(r.yearly).toBeCloseTo(r.normal.yearly+r.event.additional*365/7,12);
    expect(r.monthly).toBeCloseTo(r.yearly/12,12);
    expect(r.weekly).toBeCloseTo(r.perSecond*(168-18)*3600+r.event.total,12);
    expect(calculateLandRent({...defaultLandRentState(),plots:426,eventEnabled:false}).yearly).toBeCloseTo(42.6,12);
  });
  it("ads excluded even with a configured pending multiplier",()=>{ const s={...defaultLandRentState(),plots:200}; expect(calculateLandRent({...s,adMultiplier:99}).yearly).toBe(calculateLandRent(s).yearly); });
});
