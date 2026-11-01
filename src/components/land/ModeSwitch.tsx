import type { ComponentType } from "react";
import { useGameMode } from "@/hooks/useGameMode";
import { LandCalculator, LandDashboard, LandSettings, LandStats, LandUnits } from "./LandPages";
import { LandRentView } from "./LandRentPages";
import { ThemeSettings } from '@/components/common/ThemeSettings';

const PAGES = { dashboard: LandDashboard, units: LandUnits, calculator: LandCalculator, stats: LandStats, settings: LandSettings };

/** Renders the TerraMine page or the Atlas/Fortune equivalent for the active game. */
export function ModeSwitch({ page, terramine: T }: { page: keyof typeof PAGES; terramine: ComponentType }) {
  const { mode } = useGameMode();
  const appearance = page === 'settings' ? <ThemeSettings /> : null;
  if (mode === "terramine") return <div className="space-y-5">{appearance}<T /></div>;
  if (mode === "land-rents") return <div className="space-y-5">{appearance}<LandRentView page={page} /></div>;
  const P = PAGES[page];
  return <div className="space-y-5">{appearance}<P key={mode} game={mode} /></div>;
}
