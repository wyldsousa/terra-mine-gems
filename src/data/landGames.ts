/**
 * Central configuration for the Atlas Earth and Fortune World modes.
 * Every value that may change lives here as a DEFAULT and is editable in each game's Settings.
 */
export type LandGameId = "atlas" | "fortune";
export type GameMode = "terramine" | LandGameId;

export interface Tier {
  /** Applies from this unit/badge count upward (until the next tier). */
  min: number;
  value: number;
}
export interface Rarity {
  id: string;
  label: string;
  emoji: string;
  /** Currency per second, per unit, without boost. */
  perSecond: number;
  /** Drop probability in percent (reference). */
  probability: number | null;
}
export interface LandEvent {
  id: string;
  /** datetime-local string "YYYY-MM-DDTHH:mm"; "" = date not set yet. */
  start: string;
  durationHours: number;
}
export interface LandParams {
  /** Schema version of the params; older stored params get migrated. */
  version?: number;
  currency: "USD" | "EUR";
  rarities: Rarity[];
  boostTiers: Tier[];
  bonusTiers: Tier[];
  /** Both games: permanent bonus by badges (emblemas). Unit count only drives the boost multiplier. */
  bonusSource: "badges" | "units";
  eventMultiplier: number;
  eventName: string;
  maxBoostHours: number;
  daysPerMonth: number;
  daysPerYear: number;
}
export interface LandState {
  counts: Record<string, number>;
  badges: number;
  boostHoursPerDay: number;
  events: LandEvent[];
  goals: number[];
  balance: number;
  params: LandParams;
}

export const GAME_INFO: Record<GameMode, { emoji: string; name: string; unit: string; units: string; unitsTitle: string }> = {
  terramine: { emoji: "⛏️", name: "TerraMine", unit: "mina", units: "minas", unitsTitle: "Minhas Minas" },
  atlas: { emoji: "🌎", name: "Atlas Earth", unit: "terreno", units: "terrenos", unitsTitle: "Meus Terrenos" },
  fortune: { emoji: "🍀", name: "Fortune World", unit: "parcela", units: "parcelas", unitsTitle: "Minhas Parcelas" },
};

export const PARAMS_VERSION = 3;
const BADGE_OR_QTY_BONUS: Tier[] = [
  { min: 1, value: 5 },
  { min: 11, value: 10 },
  { min: 31, value: 15 },
  { min: 61, value: 20 },
  { min: 101, value: 25 },
];

export const DEFAULT_LAND_PARAMS: Record<LandGameId, LandParams> = {
  atlas: {
    version: 4,
    currency: "USD",
    rarities: [
      { id: "common", label: "Common", emoji: "🟩", perSecond: 0.0000000011, probability: 49.5 },
      { id: "rare", label: "Rare", emoji: "🟦", perSecond: 0.0000000016, probability: 32.4 },
      { id: "epic", label: "Epic", emoji: "🟪", perSecond: 0.0000000022, probability: 13.7 },
      { id: "legendary", label: "Legendary", emoji: "🟨", perSecond: 0.0000000044, probability: 4.4 },
    ],
    boostTiers: [
      { min: 0, value: 20 },
      { min: 61, value: 15 },
      { min: 76, value: 12 },
      { min: 101, value: 10 },
      { min: 121, value: 8 },
      { min: 151, value: 6 },
      { min: 201, value: 5 },
      { min: 251, value: 4 },
      { min: 301, value: 3 },
      { min: 401, value: 2 },
    ],
    bonusTiers: BADGE_OR_QTY_BONUS,
    bonusSource: "badges",
    eventMultiplier: 50,
    eventName: "SRB (Super Rent Boost)",
    maxBoostHours: 6,
    daysPerMonth: 30,
    daysPerYear: 365,
  },
  fortune: {
    version: 2,
    currency: "EUR",
    rarities: [
      { id: "common", label: "Common", emoji: "⚪", perSecond: 0.000000001, probability: null },
      { id: "uncommon", label: "Uncommon", emoji: "🟢", perSecond: 0.000000002, probability: null },
      { id: "rare", label: "Rare", emoji: "🔵", perSecond: 0.000000003, probability: null },
      { id: "epic", label: "Epic", emoji: "🟣", perSecond: 0.000000004, probability: null },
      { id: "legendary", label: "Legendary", emoji: "🟡", perSecond: 0.000000005, probability: null },
    ],
    boostTiers: [
      { min: 0, value: 20 },
      { min: 51, value: 15 },
      { min: 101, value: 10 },
      { min: 201, value: 8 },
      { min: 301, value: 5 },
      { min: 501, value: 3 },
      { min: 751, value: 2 },
    ],
    bonusTiers: BADGE_OR_QTY_BONUS,
    bonusSource: "badges",
    eventMultiplier: 50,
    eventName: "Evento 50×",
    maxBoostHours: 24,
    daysPerMonth: 30,
    daysPerYear: 365,
  },
};

const DEFAULT_EVENT_HOURS: Record<LandGameId, number> = { atlas: 32, fortune: 24 };

export function defaultLandState(g: LandGameId): LandState {
  return {
    counts: {},
    badges: 0,
    boostHoursPerDay: 0,
    events: [1, 2].map((n) => ({ id: `ev${n}`, start: "", durationHours: DEFAULT_EVENT_HOURS[g] })),
    goals: [1, 5, 10, 25, 50, 100],
    balance: 0,
    params: structuredClone(DEFAULT_LAND_PARAMS[g]),
  };
}
