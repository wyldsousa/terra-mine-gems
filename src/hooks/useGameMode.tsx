import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { PARAMS_VERSION, defaultLandState, type GameMode, type LandGameId, type LandState } from "@/data/landGames";

const MODE_KEY = "active-game-mode";
const landKey = (g: LandGameId) => `land-game-${g}-v2`;

function loadLand(g: LandGameId): LandState {
  const def = defaultLandState(g);
  try {
    const raw = localStorage.getItem(landKey(g));
    if (!raw) return def;
    const d = JSON.parse(raw) as Partial<LandState>;
    let params = { ...def.params, ...(d.params ?? {}) };
    if ((d.params?.version ?? 0) < PARAMS_VERSION) {
      // Migration: reset every official value (rates, boost tiers, badge tiers, event multiplier, limits).
      params = { ...def.params, currency: def.params.currency };
    }
    // Sanitize counts (old saves could store strings) and boost hours (cannot exceed the game's max).
    const counts: Record<string, number> = {};
    for (const [k, v] of Object.entries(d.counts ?? {})) counts[k] = Math.max(0, Math.floor(Number(v) || 0));
    const boostHoursPerDay = Math.min(Math.max(Number(d.boostHoursPerDay) || 0, 0), params.maxBoostHours);
    return { ...def, ...d, counts, badges: Math.max(0, Number(d.badges) || 0), boostHoursPerDay, params };
  } catch {
    return def;
  }
}

interface Ctx {
  mode: GameMode;
  setMode: (m: GameMode) => void;
  land: Record<LandGameId, LandState>;
  setLand: (g: LandGameId, fn: (s: LandState) => LandState) => void;
  hydrated: boolean;
}
const GameCtx = createContext<Ctx | null>(null);

export function GameModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<GameMode>("terramine");
  const [land, setLandAll] = useState<Record<LandGameId, LandState>>({ atlas: defaultLandState("atlas"), fortune: defaultLandState("fortune") });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const m = localStorage.getItem(MODE_KEY);
    if (m === "atlas" || m === "fortune" || m === "terramine") setModeState(m);
    setLandAll({ atlas: loadLand("atlas"), fortune: loadLand("fortune") });
    setHydrated(true);
  }, []);

  const setMode = useCallback((m: GameMode) => {
    setModeState(m);
    localStorage.setItem(MODE_KEY, m);
  }, []);

  const setLand = useCallback((g: LandGameId, fn: (s: LandState) => LandState) => {
    setLandAll((prev) => {
      const next = { ...prev, [g]: fn(prev[g]) };
      localStorage.setItem(landKey(g), JSON.stringify(next[g]));
      return next;
    });
  }, []);

  const value = useMemo(() => ({ mode, setMode, land, setLand, hydrated }), [mode, setMode, land, setLand, hydrated]);
  return (
    <GameCtx.Provider value={value}>
      <div data-game={mode}>{children}</div>
    </GameCtx.Provider>
  );
}

export function useGameMode() {
  const c = useContext(GameCtx);
  if (!c) throw new Error("useGameMode outside provider");
  return c;
}
