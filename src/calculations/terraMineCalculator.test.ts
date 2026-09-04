import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS } from "@/data/defaults";
import {
  applyBoostToHourly,
  calculateGoalTime,
  calculateGrossForNet,
  calculateLevelMultiplier,
  calculateMineDailyIncome,
  calculateMineMonthlyIncome,
  calculatePortfolioIncome,
  calculateProjection,
  calculateTimeToEarn,
  calculateUpgradeImpact,
  calculateWithdrawal,
  clampLevel,
} from "./terraMineCalculator";
import type { Params } from "@/types";

const params: Params = { ...DEFAULT_PARAMS };

describe("levels", () => {
  it("level 1 has multiplier 1", () => {
    expect(calculateLevelMultiplier(1, params)).toBe(1);
  });
  it("each level adds 1%", () => {
    expect(calculateLevelMultiplier(11, params)).toBeCloseTo(1.1, 10);
  });
  it("clamps to max level", () => {
    expect(clampLevel(500, params)).toBe(params.maxLevel);
    expect(clampLevel(0, params)).toBe(1);
  });
});

describe("mine income", () => {
  it("uses the base monthly value at level 1", () => {
    expect(calculateMineMonthlyIncome({ type: "gold", level: 1 }, params)).toBe(params.baseMonthly.gold);
  });
  it("daily is monthly divided by the configured month length", () => {
    const monthly = calculateMineMonthlyIncome({ type: "coal", level: 20 }, params);
    expect(calculateMineDailyIncome({ type: "coal", level: 20 }, params)).toBeCloseTo(
      monthly / params.daysPerMonth,
      12,
    );
  });
});

describe("boost", () => {
  it("only multiplies boosted hours", () => {
    expect(applyBoostToHourly(1, params, 2)).toBe(2 * 20 + 22);
  });
  it("24h boost multiplies the whole day", () => {
    expect(applyBoostToHourly(1, params, 24)).toBe(24 * 20);
  });
  it("no boost hours keeps the base day", () => {
    expect(applyBoostToHourly(1, params, 0)).toBe(24);
  });
});

describe("withdrawal", () => {
  it("keeps fee and tax separate", () => {
    const p = { ...params, withdrawalFee: 0.17, additionalTax: 0.1 };
    const r = calculateWithdrawal(100, p);
    expect(r.platformFee).toBeCloseTo(17, 10);
    expect(r.additionalTax).toBeCloseTo(10, 10);
    expect(r.net).toBeCloseTo(73, 10);
  });
  it("gross for net round-trips", () => {
    const gross = calculateGrossForNet(83, params);
    expect(calculateWithdrawal(gross, params).net).toBeCloseTo(83, 8);
  });
});

describe("portfolio", () => {
  const mines = [
    { type: "diamond" as const, level: 10 },
    { type: "rock" as const, level: 1 },
  ];
  it("sums mines and averages levels", () => {
    const income = calculatePortfolioIncome(mines, params);
    expect(income.totalMines).toBe(2);
    expect(income.averageLevel).toBe(5.5);
    expect(income.withoutBoost.perMonth).toBeCloseTo(
      calculateMineMonthlyIncome(mines[0]!, params) + calculateMineMonthlyIncome(mines[1]!, params),
      10,
    );
  });
  it("year uses the configured days per year", () => {
    const income = calculatePortfolioIncome(mines, params);
    expect(income.withBoost.perYear).toBeCloseTo(income.boostedDaily * params.daysPerYear, 12);
  });
});

describe("goals and projections", () => {
  it("returns reached when balance covers the goal", () => {
    expect(calculateGoalTime(1, 2, 1, params).reached).toBe(true);
  });
  it("computes remaining days", () => {
    const goal = calculateGoalTime(10, 0, 2, params);
    expect(goal.days).toBeCloseTo(5, 10);
  });
  it("projection grows linearly", () => {
    const points = calculateProjection(1, 0, 3, params);
    expect(points[points.length - 1]!.total).toBeCloseTo(3, 10);
  });
  it("time to earn is infinite without income", () => {
    expect(calculateTimeToEarn(5, 0).days).toBe(Infinity);
  });
});

describe("upgrade", () => {
  it("increases income when leveling up", () => {
    const impact = calculateUpgradeImpact({ type: "gold", level: 1 }, 51, params);
    expect(impact.newMonthly).toBeGreaterThan(impact.currentMonthly);
  });
});
