import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { PARAMS_VERSION, defaultLandState, type GameMode, type LandGameId, type LandState } from "@/data/landGames";
import { useAuth } from "@/hooks/useAuth";
import { migrateAtlasParams } from "@/calculations/atlasEvents";
import { landRentReturnGame, defaultLandRentState, landRentStorageKey, landRentStateSchema, type LandRentState, type CalculatorGameMode } from "@/data/landRent";

const MODE_KEY = "active-game-mode";
const PREVIOUS_GAME_KEY = "land-rent-previous-game";
const landKey = (g: LandGameId) => `land-game-${g}-v2`;

function loadLand(g: LandGameId): LandState {
  const def = defaultLandState(g);
  try {
    const raw = localStorage.getItem(landKey(g));
    if (!raw) return def;
    const d = JSON.parse(raw) as Partial<LandState>;
    let params = { ...def.params, ...(d.params ?? {}) };
    if (g === "atlas") {
      params = migrateAtlasParams(params);
    } else if ((d.params?.version ?? 0) < PARAMS_VERSION) {
      // Migration: reset every official value (rates, boost tiers, badge tiers, event multiplier, limits).
      params = { ...def.params, currency: def.params.currency };
    }
    // Sanitize counts (old saves could store strings) and boost hours (cannot exceed the game's max).
    const counts: Record<string, number> = {};
    for (const [k, v] of Object.entries(d.counts ?? {})) counts[k] = Math.max(0, Math.floor(Number(v) || 0));
    const boostHoursPerDay = Math.min(Math.max(Number(d.boostHoursPerDay) || 0, 0), 24);
    return { ...def, ...d, counts, badges: Math.max(0, Number(d.badges) || 0), boostHoursPerDay, params };
  } catch {
    return def;
  }
}

interface Ctx {
  mode: GameMode;
  previousGame: CalculatorGameMode;
  landRent: LandRentState;
  setLandRent: (value: LandRentState) => void;
  setMode: (m: GameMode) => void;
  land: Record<LandGameId, LandState>;
  setLand: (g: LandGameId, fn: (s: LandState) => LandState) => void;
  hydrated: boolean;
}
const GameCtx = createContext<Ctx | null>(null);

export function GameModeProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const ownerKey = landRentStorageKey(user?.id ?? null);
  const rentKeyRef = useRef("");
  const [mode, setModeState] = useState<GameMode>("terramine");
  const currentMode = useRef<GameMode>("terramine");
  const [previousGame, setPreviousGame] = useState<CalculatorGameMode>("terramine");
  const [land, setLandAll] = useState<Record<LandGameId, LandState>>({ atlas: defaultLandState("atlas"), fortune: defaultLandState("fortune") });
  const [hydrated, setHydrated] = useState(false);
  const [landRent, setLandRentState] = useState<LandRentState>(defaultLandRentState);

  useEffect(() => {
    const m = localStorage.getItem(MODE_KEY);
    if (m === "atlas" || m === "fortune" || m === "terramine" || m === "land-rents") {
      currentMode.current = m;
      setModeState(m);
    }
    setPreviousGame(landRentReturnGame(localStorage.getItem(PREVIOUS_GAME_KEY)));
    setLandAll({ atlas: loadLand("atlas"), fortune: loadLand("fortune") });
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    rentKeyRef.current = ownerKey;
    try { const raw = localStorage.getItem(ownerKey); const parsed = raw ? landRentStateSchema.safeParse(JSON.parse(raw)) : null; setLandRentState(parsed?.success ? parsed.data : defaultLandRentState()); }
    catch { setLandRentState(defaultLandRentState()); }
  }, [ownerKey, authLoading]);

  const setMode = useCallback((m: GameMode) => {
    if (m === "land-rents" && currentMode.current !== "land-rents") {
      const previous = landRentReturnGame(currentMode.current);
      setPreviousGame(previous);
      localStorage.setItem(PREVIOUS_GAME_KEY, previous);
    }
    currentMode.current = m;
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

  const setLandRent = useCallback((value: LandRentState) => {
    const parsed = landRentStateSchema.parse(value);
    localStorage.setItem(ownerKey, JSON.stringify(parsed));
    setLandRentState(parsed);
  }, [authLoading, ownerKey]);
  const value = useMemo(() => ({ mode, previousGame, setMode, land, setLand, hydrated, landRent, setLandRent }), [mode, previousGame, setMode, land, setLand, hydrated, landRent, setLandRent]);
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
