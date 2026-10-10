import type { RankGame } from "./profile";

export const RANK_GAMES: RankGame[] = ["terramine", "fortune", "atlas"];
export interface PublicRow {
  user_id: string; display_name: string; avatar_url: string | null;
  profile_updated_at: string; game: string; units_count: number | null;
  monthly_income: number | null; daily_income: number | null;
  weekly_income: number | null; yearly_income: number | null;
  currency: string; stats_updated_at: string;
}
export type PublicPeriod = "daily_income" | "weekly_income" | "monthly_income" | "yearly_income";

export function orderedRanking(rows: PublicRow[], game: RankGame, by: "units" | "income") {
  const key = by === "units" ? "units_count" : "monthly_income";
  return rows.filter((r) => r.game === game && r[key] !== null)
    .sort((a, b) => Number(b[key]) - Number(a[key]) || a.user_id.localeCompare(b.user_id));
}

/** Only available, authorized values; never substitute zero for a hidden calculator. */
export function publicTotal(rows: PublicRow[], userId: string, period: PublicPeriod, eurUsd: number | null) {
  let value = 0;
  let available = 0;
  let conversionMissing = false;
  for (const row of rows) {
    if (row.user_id !== userId || !RANK_GAMES.includes(row.game as RankGame)) continue;
    const amount = row[period];
    if (amount === null) continue;
    if (row.currency === "EUR" && !eurUsd) { conversionMissing = true; continue; }
    value += Number(amount) * (row.currency === "EUR" ? (eurUsd ?? 1) : 1);
    available++;
  }
  return { value: available ? value : null, available, conversionMissing };
}