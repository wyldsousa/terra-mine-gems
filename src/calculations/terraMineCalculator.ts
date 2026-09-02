import type { Mine, MineType, Params } from "@/types";
import { MINE_TYPES } from "@/types";

/**
 * TerraMine calculation engine.
 *
 * FORMULAS
 *   levelMultiplier      = 1 + (level - 1) * levelStep
 *   mineMonthlyBase      = baseMonthly[type] * levelMultiplier
 *   mineDaily            = mineMonthly / daysPerMonth
 *   mineHourly           = mineDaily / 24
 *   boostedDaily         = hourly * boostHours * boostMultiplier
 *                        + hourly * (24 - boostHours)
 *
 * No rounding happens inside these functions — rounding is presentation-only.
 */

export const HOURS_PER_DAY = 24;
export const DAYS_PER_WEEK = 7;

export function calculateLevelMultiplier(level: number, params: Params): number {
  const clamped = clampLevel(level, params);
  return 1 + (clamped - 1) * params.levelStep;
}

export function clampLevel(level: number, params: Params): number {
  if (!Number.isFinite(level)) return 1;
  return Math.min(Math.max(Math.floor(level), 1), params.maxLevel);
}

/** Monthly income of one mine, without boost. */
export function calculateMineMonthlyIncome(mine: Pick<Mine, "type" | "level">, params: Params): number {
  return params.baseMonthly[mine.type] * calculateLevelMultiplier(mine.level, params);
}

export function calculateMineDailyIncome(mine: Pick<Mine, "type" | "level">, params: Params): number {
  return calculateMineMonthlyIncome(mine, params) / params.daysPerMonth;
}

export function calculateMineHourlyIncome(mine: Pick<Mine, "type" | "level">, params: Params): number {
  return calculateMineDailyIncome(mine, params) / HOURS_PER_DAY;
}

/**
 * Daily income of one mine given boosted hours.
 * Only the boosted hours are multiplied — never the whole day.
 */
export function calculateMineIncomeWithBoost(
  mine: Pick<Mine, "type" | "level">,
  params: Params,
  boostHours = params.boostHoursPerDay,
): number {
  const hourly = calculateMineHourlyIncome(mine, params);
  return applyBoostToHourly(hourly, params, boostHours);
}

export function applyBoostToHourly(hourly: number, params: Params, boostHours: number): number {
  const boosted = Math.min(Math.max(boostHours, 0), HOURS_PER_DAY);
  const normal = HOURS_PER_DAY - boosted;
  return hourly * boosted * params.boostMultiplier + hourly * normal;
}

export interface IncomeBreakdown {
  perSecond: number;
  perMinute: number;
  perHour: number;
  perDay: number;
  perWeek: number;
  perMonth: number;
  perYear: number;
}

export function buildBreakdownFromDaily(daily: number, params: Params): IncomeBreakdown {
  const perHour = daily / HOURS_PER_DAY;
  return {
    perSecond: daily / 86400,
    perMinute: daily / 1440,
    perHour,
    perDay: daily,
    perWeek: daily * DAYS_PER_WEEK,
    perMonth: daily * params.daysPerMonth,
    perYear: daily * params.daysPerYear,
  };
}

export interface PortfolioIncome {
  /** Daily income with zero boost hours. */
  baseDaily: number;
  /** Daily income with the configured boost hours. */
  boostedDaily: number;
  /** Daily income if boost ran the full 24h. */
  fullBoostDaily: number;
  withoutBoost: IncomeBreakdown;
  withBoost: IncomeBreakdown;
  fullBoost: IncomeBreakdown;
  /** Extra income produced by the configured boost. */
  boostGainDaily: number;
  boostGainMonthly: number;
  boostGainYearly: number;
  /** Percentage increase caused by the configured boost. */
  boostGainPercent: number;
  byType: Record<MineType, { count: number; dailyBase: number; dailyBoosted: number; avgLevel: number }>;
  totalMines: number;
  averageLevel: number;
}

export function calculatePortfolioIncome(
  mines: Pick<Mine, "type" | "level">[],
  params: Params,
  boostHours = params.boostHoursPerDay,
): PortfolioIncome {
  const byType = {} as PortfolioIncome["byType"];
  for (const t of MINE_TYPES) byType[t] = { count: 0, dailyBase: 0, dailyBoosted: 0, avgLevel: 0 };

  let baseDaily = 0;
  let boostedDaily = 0;
  let fullBoostDaily = 0;
  let levelSum = 0;
  const levelSumByType: Record<MineType, number> = { rock: 0, coal: 0, gold: 0, diamond: 0 };

  for (const mine of mines) {
    const daily = calculateMineDailyIncome(mine, params);
    const hourly = daily / HOURS_PER_DAY;
    const boosted = applyBoostToHourly(hourly, params, boostHours);
    const full = applyBoostToHourly(hourly, params, HOURS_PER_DAY);

    baseDaily += daily;
    boostedDaily += boosted;
    fullBoostDaily += full;

    byType[mine.type].count += 1;
    byType[mine.type].dailyBase += daily;
    byType[mine.type].dailyBoosted += boosted;
    const lvl = clampLevel(mine.level, params);
    levelSumByType[mine.type] += lvl;
    levelSum += lvl;
  }

  for (const t of MINE_TYPES) {
    byType[t].avgLevel = byType[t].count > 0 ? levelSumByType[t] / byType[t].count : 0;
  }

  const boostGainDaily = boostedDaily - baseDaily;

  return {
    baseDaily,
    boostedDaily,
    fullBoostDaily,
    withoutBoost: buildBreakdownFromDaily(baseDaily, params),
    withBoost: buildBreakdownFromDaily(boostedDaily, params),
    fullBoost: buildBreakdownFromDaily(fullBoostDaily, params),
    boostGainDaily,
    boostGainMonthly: boostGainDaily * params.daysPerMonth,
    boostGainYearly: boostGainDaily * params.daysPerYear,
    boostGainPercent: baseDaily > 0 ? (boostGainDaily / baseDaily) * 100 : 0,
    byType,
    totalMines: mines.length,
    averageLevel: mines.length > 0 ? levelSum / mines.length : 0,
  };
}

export interface WithdrawalResult {
  gross: number;
  platformFee: number;
  additionalTax: number;
  net: number;
}

/** Fee and tax are always computed separately, both on the gross amount. */
export function calculateWithdrawal(gross: number, params: Params): WithdrawalResult {
  const g = Math.max(gross || 0, 0);
  const platformFee = g * params.withdrawalFee;
  const additionalTax = g * params.additionalTax;
  return { gross: g, platformFee, additionalTax, net: g - platformFee - additionalTax };
}

export function calculateNetWithdrawal(gross: number, params: Params): number {
  return calculateWithdrawal(gross, params).net;
}

/** Gross balance required to receive `net` after fee + tax. */
export function calculateGrossForNet(net: number, params: Params): number {
  const retained = 1 - params.withdrawalFee - params.additionalTax;
  if (retained <= 0) return Infinity;
  return net / retained;
}

export interface GoalResult {
  target: number;
  current: number;
  remaining: number;
  reached: boolean;
  days: number;
  weeks: number;
  months: number;
  hours: number;
  minutes: number;
  etaDate: Date | null;
  progressPercent: number;
}

export function calculateGoalTime(
  target: number,
  currentBalance: number,
  dailyIncome: number,
  params: Params,
  now: Date = new Date(),
): GoalResult {
  const remaining = target - currentBalance;
  const reached = remaining <= 0;
  const progressPercent = target > 0 ? Math.min((currentBalance / target) * 100, 100) : 100;

  if (reached) {
    return {
      target,
      current: currentBalance,
      remaining: 0,
      reached: true,
      days: 0,
      weeks: 0,
      months: 0,
      hours: 0,
      minutes: 0,
      etaDate: now,
      progressPercent: 100,
    };
  }
  if (!(dailyIncome > 0)) {
    return {
      target,
      current: currentBalance,
      remaining,
      reached: false,
      days: Infinity,
      weeks: Infinity,
      months: Infinity,
      hours: Infinity,
      minutes: Infinity,
      etaDate: null,
      progressPercent,
    };
  }

  const days = remaining / dailyIncome;
  return {
    target,
    current: currentBalance,
    remaining,
    reached: false,
    days,
    weeks: days / DAYS_PER_WEEK,
    months: days / params.daysPerMonth,
    hours: days * HOURS_PER_DAY,
    minutes: days * HOURS_PER_DAY * 60,
    etaDate: new Date(now.getTime() + days * 86400000),
    progressPercent,
  };
}

export interface ProjectionPoint {
  day: number;
  label: string;
  balance: number;
  earned: number;
}

export function calculateProjection(
  days: number,
  startingBalance: number,
  dailyIncome: number,
  steps = 24,
): ProjectionPoint[] {
  const points: ProjectionPoint[] = [];
  const count = Math.max(2, Math.min(steps, Math.ceil(days)));
  for (let i = 0; i <= count; i++) {
    const day = (days * i) / count;
    const earned = dailyIncome * day;
    points.push({
      day,
      label: day < 1 ? `${Math.round(day * 24)}h` : `${Math.round(day)}d`,
      balance: startingBalance + earned,
      earned,
    });
  }
  return points;
}

export interface UpgradeImpact {
  fromLevel: number;
  toLevel: number;
  currentDaily: number;
  newDaily: number;
  diffDaily: number;
  diffMonthly: number;
  diffYearly: number;
  percentIncrease: number;
}

export function calculateUpgradeImpact(
  mine: Pick<Mine, "type" | "level">,
  targetLevel: number,
  params: Params,
  boostHours = params.boostHoursPerDay,
): UpgradeImpact {
  const from = clampLevel(mine.level, params);
  const to = clampLevel(targetLevel, params);
  const currentDaily = calculateMineIncomeWithBoost({ type: mine.type, level: from }, params, boostHours);
  const newDaily = calculateMineIncomeWithBoost({ type: mine.type, level: to }, params, boostHours);
  const diffDaily = newDaily - currentDaily;
  return {
    fromLevel: from,
    toLevel: to,
    currentDaily,
    newDaily,
    diffDaily,
    diffMonthly: diffDaily * params.daysPerMonth,
    diffYearly: diffDaily * params.daysPerYear,
    percentIncrease: currentDaily > 0 ? (diffDaily / currentDaily) * 100 : 0,
  };
}

export interface ExpansionImpact {
  currentDaily: number;
  addedDaily: number;
  newDaily: number;
  currentMonthly: number;
  addedMonthly: number;
  newMonthly: number;
  currentYearly: number;
  addedYearly: number;
  newYearly: number;
  percentIncrease: number;
}

export function calculateExpansionImpact(
  mines: Pick<Mine, "type" | "level">[],
  additions: { type: MineType; quantity: number; level: number }[],
  params: Params,
  boostHours = params.boostHoursPerDay,
): ExpansionImpact {
  const current = calculatePortfolioIncome(mines, params, boostHours).boostedDaily;
  let addedDaily = 0;
  for (const add of additions) {
    const qty = Math.max(0, Math.floor(add.quantity || 0));
    if (qty === 0) continue;
    addedDaily += qty * calculateMineIncomeWithBoost({ type: add.type, level: add.level }, params, boostHours);
  }
  const newDaily = current + addedDaily;
  return {
    currentDaily: current,
    addedDaily,
    newDaily,
    currentMonthly: current * params.daysPerMonth,
    addedMonthly: addedDaily * params.daysPerMonth,
    newMonthly: newDaily * params.daysPerMonth,
    currentYearly: current * params.daysPerYear,
    addedYearly: addedDaily * params.daysPerYear,
    newYearly: newDaily * params.daysPerYear,
    percentIncrease: current > 0 ? (addedDaily / current) * 100 : addedDaily > 0 ? 100 : 0,
  };
}

export function calculateAverageMineLevel(
  mines: Pick<Mine, "type" | "level">[],
  params: Params,
  type?: MineType,
): number {
  const list = type ? mines.filter((m) => m.type === type) : mines;
  if (list.length === 0) return 0;
  return list.reduce((sum, m) => sum + clampLevel(m.level, params), 0) / list.length;
}

export interface DistributionEntry {
  type: MineType;
  count: number;
  countPercent: number;
  dailyIncome: number;
  monthlyIncome: number;
  incomePercent: number;
  avgLevel: number;
}

export function calculateMineDistribution(
  mines: Pick<Mine, "type" | "level">[],
  params: Params,
  boostHours = params.boostHoursPerDay,
): DistributionEntry[] {
  const portfolio = calculatePortfolioIncome(mines, params, boostHours);
  const totalDaily = portfolio.boostedDaily;
  return MINE_TYPES.map((type) => {
    const t = portfolio.byType[type];
    return {
      type,
      count: t.count,
      countPercent: mines.length > 0 ? (t.count / mines.length) * 100 : 0,
      dailyIncome: t.dailyBoosted,
      monthlyIncome: t.dailyBoosted * params.daysPerMonth,
      incomePercent: totalDaily > 0 ? (t.dailyBoosted / totalDaily) * 100 : 0,
      avgLevel: t.avgLevel,
    };
  });
}

/** Time needed to earn `amount` more (ignores current balance). */
export function calculateTimeToEarn(amount: number, dailyIncome: number) {
  if (!(dailyIncome > 0) || amount <= 0) {
    return { days: amount <= 0 ? 0 : Infinity, hours: amount <= 0 ? 0 : Infinity, minutes: amount <= 0 ? 0 : Infinity };
  }
  const days = amount / dailyIncome;
  return { days, hours: days * 24, minutes: days * 1440 };
}
