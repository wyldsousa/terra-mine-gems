import { supabase } from "@/integrations/supabase/client";
import { calculatePortfolioIncome } from "@/calculations/terraMineCalculator";
import { calculateLandIncome } from "@/calculations/landGameCalculator";
import type { LandGameId, LandState } from "@/data/landGames";
import type { Mine, Params } from "@/types";

export type RankGame = "terramine" | "atlas" | "fortune";

export function localIncomes(mines: Mine[], params: Params, land: Record<LandGameId, LandState>) {
  const li = (g: LandGameId) => {
    const r = calculateLandIncome(land[g]);
    return { monthly: r.units > 0 ? r.monthly : null, units: r.units };
  };
  return {
    terramine: {
      monthly: mines.length ? calculatePortfolioIncome(mines, params, params.boostHoursPerDay).withBoost.perMonth : null,
      units: mines.length,
    },
    atlas: li("atlas"),
    fortune: li("fortune"),
  };
}

/** Publishes only the authorized public stats (unit count + estimated monthly income). */
export async function syncPublicStats(userId: string, inc: ReturnType<typeof localIncomes>) {
  const rows = (Object.keys(inc) as RankGame[]).map((game) => ({
    user_id: userId,
    game,
    units_count: inc[game].units,
    monthly_income: inc[game].monthly ?? 0,
  }));
  await supabase.from("public_stats").upsert(rows, { onConflict: "user_id,game" });
}

export async function resizeImage(file: File, size = 160): Promise<string> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  await new Promise((r, j) => { img.onload = r; img.onerror = j; img.src = url; });
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const s = Math.min(img.width, img.height);
  c.getContext("2d")!.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
  URL.revokeObjectURL(url);
  return c.toDataURL("image/jpeg", 0.8);
}
