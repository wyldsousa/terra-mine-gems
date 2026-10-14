import { supabase } from "@/integrations/supabase/client";
import { landRentStateSchema, type LandRentState } from "@/data/landRent";
import { calculateLandRent } from "@/calculations/landRentCalculator";
export async function saveLandRentSummary(userId: string, value: LandRentState) {
  const s = landRentStateSchema.parse(value), r = calculateLandRent(s);
  const { error } = await supabase.from("public_stats").upsert({ user_id: userId, game: "land-rents", configured: s.plots > 0,
    units_count: s.plots, monthly_income: r.monthly, daily_income: r.daily, weekly_income: r.weekly, yearly_income: r.yearly, currency: "USD",
    game_details: { state: s, boost_hours: s.boostHours, badges: s.badges, normal_multiplier: r.multiplier, badge_percent: r.badgePercent, event_total: r.event.total, event_additional: r.event.additional, event_enabled: s.eventEnabled },
  }, { onConflict: "user_id,game" });
  if (error) throw error;
}
export async function loadLandRentSummary(userId: string) {
  const { data, error } = await supabase.from("public_stats").select("game_details").eq("user_id", userId).eq("game", "land-rents").maybeSingle();
  if (error) throw error;
  const details = data?.game_details;
  if (!details || typeof details !== "object" || Array.isArray(details)) return null;
  const parsed = landRentStateSchema.safeParse(details["state"]);
  return parsed.success ? parsed.data : null;
}
