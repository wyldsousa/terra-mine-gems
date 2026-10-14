import { LandRentView } from "./LandRentPages";
export const landRentMoney = (value: number | null) => value === null ? "Não disponibilizado" : `US$ ${value.toLocaleString("pt-BR", { maximumFractionDigits: 12 })}`;
export function LandRentCalculator() { return <LandRentView page="calculator" />; }
