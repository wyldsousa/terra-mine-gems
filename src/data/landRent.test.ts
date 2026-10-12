import { describe, expect, it } from "vitest";
import { LAND_RENT_AVAILABILITY, landRentReturnGame, landRentStateSchema, defaultLandRentState } from "./landRent";
describe("Land Rent remains isolated", () => {
  it("enables supplied-rule calculations but does not claim verified official rules", () => { expect(LAND_RENT_AVAILABILITY.calculatorEnabled).toBe(true); expect(LAND_RENT_AVAILABILITY.officialRules).toBeNull(); });
  it("does not enable real money conversion", () => { expect(LAND_RENT_AVAILABILITY.realMoneyConversionEnabled).toBe(false); });
  it("returns to the previous calculator", () => { for (const g of ["atlas", "fortune", "terramine"]) expect(landRentReturnGame(g)).toBe(g); expect(landRentReturnGame(null)).toBe("terramine"); });
  it("rejects invalid local input", () => { expect(landRentStateSchema.safeParse({ ...defaultLandRentState(), plots: -1 }).success).toBe(false); expect(landRentStateSchema.safeParse({ ...defaultLandRentState(), badges: 1.5 }).success).toBe(false); });
});
