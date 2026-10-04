import type { ComponentType } from "react";
import { useGameMode } from "@/hooks/useGameMode";
import { LandCalculator, LandDashboard, LandSettings, LandStats, LandUnits } from "./LandPages";

const PAGES = { dashboard: LandDashboard, units: LandUnits, calculator: LandCalculator, stats: LandStats, settings: LandSettings };

/** Renders the TerraMine page or the Atlas/Fortune equivalent for the active game. */
export function ModeSwitch({ page, terramine: T }: { page: keyof typeof PAGES; terramine: ComponentType }) {
  const { mode } = useGameMode();
  if (mode === "terramine") return <T />;
  const P = PAGES[page];
  return <P key={mode} game={mode} />;
}
