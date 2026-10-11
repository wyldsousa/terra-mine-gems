import { describe, expect, it } from "vitest";
import { LAND_RENT_AVAILABILITY, landRentReturnGame } from "./landRent";

describe("Land Rent remains a separate development mode", () => {
  it("keeps calculations disabled until official rules are verified", () => {
    expect(LAND_RENT_AVAILABILITY.calculatorEnabled).toBe(false);
    expect(LAND_RENT_AVAILABILITY.officialRules).toBeNull();
  });
  it("does not enable conversion of simulated values into real money", () => {
    expect(LAND_RENT_AVAILABILITY.realMoneyConversionEnabled).toBe(false);
  });
  it("returns to each previous calculator without selecting the placeholder", () => {
    expect(landRentReturnGame("atlas")).toBe("atlas");
    expect(landRentReturnGame("fortune")).toBe("fortune");
    expect(landRentReturnGame("terramine")).toBe("terramine");
    expect(landRentReturnGame("land-rents")).toBe("terramine");
    expect(landRentReturnGame(null)).toBe("terramine");
  });
});