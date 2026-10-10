import { describe, expect, it } from "vitest";
import { orderedRanking, publicTotal, type PublicRow } from "./publicRanking";

const row = (user_id: string, game: string, monthly_income: number | null, currency = "USD"): PublicRow => ({
  user_id, game, monthly_income, currency, units_count: 481, daily_income: null,
  weekly_income: null, yearly_income: null, display_name: user_id, avatar_url: null,
  profile_updated_at: "2026-10-09T00:00:00Z", stats_updated_at: "2026-10-09T00:00:00Z",
});

describe("public ranking consent and summaries", () => {
  it("excludes hidden income from income ranking, but permits authorized counts", () => {
    const rows = [row("a", "atlas", null), row("b", "atlas", 13.38)];
    expect(orderedRanking(rows, "atlas", "income").map((r) => r.user_id)).toEqual(["b"]);
    expect(orderedRanking(rows, "atlas", "units").map((r) => r.user_id)).toEqual(["a", "b"]);
  });
  it("reorders users after a remote income change", () => {
    const rows = [row("a", "atlas", 1), row("b", "atlas", 2)];
    expect(orderedRanking(rows, "atlas", "income").map((r) => r.user_id)).toEqual(["b", "a"]);
    const changed = rows.map((r) => r.user_id === "a" ? { ...r, monthly_income: 3 } : r);
    expect(orderedRanking(changed, "atlas", "income").map((r) => r.user_id)).toEqual(["a", "b"]);
  });
  it("does not mix users or infer hidden values as zero", () => {
    const rows = [row("a", "atlas", null), row("b", "atlas", 100)];
    expect(publicTotal(rows, "a", "monthly_income", 1.1).value).toBeNull();
    expect(publicTotal(rows, "b", "monthly_income", 1.1).value).toBe(100);
  });
  it("converts authorized Fortune EUR and adds three public calculators only", () => {
    const rows = [row("a", "atlas", 13.38), row("a", "fortune", 10, "EUR"), row("a", "terramine", 2), row("b", "atlas", 999)];
    expect(publicTotal(rows, "a", "monthly_income", 1.1)).toEqual({ value: 26.38, available: 3, conversionMissing: false });
  });
  it("marks incomplete totals when conversion is missing", () => {
    const rows = [row("a", "atlas", 13.38), row("a", "fortune", 10, "EUR")];
    expect(publicTotal(rows, "a", "monthly_income", null)).toEqual({ value: 13.38, available: 1, conversionMissing: true });
  });
  it("uses actual annual projections rather than monthly times 365/30", () => {
    const atlas = { ...row("a", "atlas", 13.38277248), yearly_income: 161.30511936 };
    expect(publicTotal([atlas], "a", "yearly_income", null).value).toBe(161.30511936);
  });
  it("keeps unavailable annual summaries unavailable", () => {
    expect(publicTotal([row("a", "atlas", 13.38)], "a", "yearly_income", null).value).toBeNull();
  });
  it("does not include Land Rents in rankings or totals", () => {
    const rents = row("a", "land-rents", 999);
    expect(publicTotal([rents], "a", "monthly_income", null).value).toBeNull();
    expect(orderedRanking([rents], "atlas", "income")).toEqual([]);
  });
});