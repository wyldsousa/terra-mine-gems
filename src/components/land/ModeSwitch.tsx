import type { ComponentType } from "react";
import { useGameMode } from "@/hooks/useGameMode";
import { LandCalculator, LandDashboard, LandSettings, LandStats, LandUnits } from "./LandPages";
import { LandRentView } from "./LandRentPages";

const PAGES = { dashboard: LandDashboard, units: LandUnits, calculator: LandCalculator, stats: LandStats, settings: LandSettings };

/** Renders the TerraMine page or the Atlas/Fortune equivalent for the active game. */
export function ModeSwitch({ page, terramine: T }: { page: keyof typeof PAGES; terramine: ComponentType }) {
  const { mode } = useGameMode();
  if (mode === "terramine") return <T />;
  if (mode === "land-rents") return <LandRentView page={page} />;
  const P = PAGES[page];
  return <P key={mode} game={mode} />;
}
