import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_PARAMS, DEFAULT_STATE, DEFAULT_GOALS } from "@/data/defaults";
import { getDict, interpolate, type Dict } from "@/i18n/translations";
import type { AppState, Mine, MineType, Params } from "@/types";

const STORAGE_KEY = "terramine-calculator-v1";

function sanitize(raw: unknown): AppState {
  const data = (raw ?? {}) as Partial<AppState>;
  const params: Params = {
    ...DEFAULT_PARAMS,
    ...(data.params ?? {}),
    baseMonthly: { ...DEFAULT_PARAMS.baseMonthly, ...(data.params?.baseMonthly ?? {}) },
    typeMultiplier: { ...DEFAULT_PARAMS.typeMultiplier, ...(data.params?.typeMultiplier ?? {}) },
  };
  return {
    mines: Array.isArray(data.mines)
      ? data.mines
          .filter((m): m is Mine => !!m && typeof m === "object")
          .map((m) => ({
            id: String(m.id ?? crypto.randomUUID()),
            type: (["rock", "coal", "gold", "diamond"] as MineType[]).includes(m.type) ? m.type : "rock",
            level: Number.isFinite(m.level) ? Number(m.level) : 1,
            name: m.name,
            externalId: m.externalId,
            note: m.note,
            createdAt: Number(m.createdAt) || Date.now(),
          }))
      : [],
    params,
    balance: Number.isFinite(data.balance) ? Number(data.balance) : 0,
    goals:
      Array.isArray(data.goals) && data.goals.length > 0
        ? data.goals.filter((g) => Number.isFinite(g)).sort((a, b) => a - b)
        : DEFAULT_GOALS,
    language: data.language === "en" ? "en" : "pt",
    version: 1,
  };
}

interface AppContextValue {
  state: AppState;
  hydrated: boolean;
  params: Params;
  mines: Mine[];
  t: Dict;
  tx: (template: string, vars: Record<string, string | number>) => string;
  addMine: (mine: Omit<Mine, "id" | "createdAt">) => void;
  addMines: (mines: Omit<Mine, "id" | "createdAt">[]) => void;
  updateMine: (id: string, patch: Partial<Mine>) => void;
  removeMine: (id: string) => void;
  duplicateMine: (id: string) => void;
  setParams: (patch: Partial<Params>) => void;
  resetParams: () => void;
  setBalance: (value: number) => void;
  setGoals: (goals: number[]) => void;
  setLanguage: (lang: AppState["language"]) => void;
  replaceState: (state: AppState) => void;
  eraseAll: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setState(sanitize(JSON.parse(stored)));
    } catch {
      /* corrupted storage -> keep defaults */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* quota / private mode */
    }
  }, [state, hydrated]);

  const addMines = useCallback((list: Omit<Mine, "id" | "createdAt">[]) => {
    setState((prev) => ({
      ...prev,
      mines: [
        ...prev.mines,
        ...list.map((m, i) => ({
          ...m,
          id: crypto.randomUUID(),
          createdAt: Date.now() + i,
        })),
      ],
    }));
  }, []);

  const value = useMemo<AppContextValue>(() => {
    const t = getDict(state.language);
    return {
      state,
      hydrated,
      params: state.params,
      mines: state.mines,
      t,
      tx: (template, vars) => interpolate(template, vars),
      addMine: (mine) => addMines([mine]),
      addMines,
      updateMine: (id, patch) =>
        setState((prev) => ({
          ...prev,
          mines: prev.mines.map((m) => (m.id === id ? { ...m, ...patch, id: m.id } : m)),
        })),
      removeMine: (id) => setState((prev) => ({ ...prev, mines: prev.mines.filter((m) => m.id !== id) })),
      duplicateMine: (id) =>
        setState((prev) => {
          const found = prev.mines.find((m) => m.id === id);
          if (!found) return prev;
          return {
            ...prev,
            mines: [...prev.mines, { ...found, id: crypto.randomUUID(), createdAt: Date.now() }],
          };
        }),
      setParams: (patch) => setState((prev) => ({ ...prev, params: { ...prev.params, ...patch } })),
      resetParams: () => setState((prev) => ({ ...prev, params: DEFAULT_PARAMS })),
      setBalance: (balance) => setState((prev) => ({ ...prev, balance })),
      setGoals: (goals) => setState((prev) => ({ ...prev, goals: [...goals].sort((a, b) => a - b) })),
      setLanguage: (language) => setState((prev) => ({ ...prev, language })),
      replaceState: (next) => setState(sanitize(next)),
      eraseAll: () => setState({ ...DEFAULT_STATE, language: state.language }),
    };
  }, [state, hydrated, addMines]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}

export { STORAGE_KEY, sanitize };
