import type { Language } from "@/types";

/**
 * Money formatting: never collapse tiny values to $0.00.
 * Falls back to up to 8 decimals for very small amounts.
 */
export function formatMoney(value: number, opts: { minDecimals?: number; maxDecimals?: number } = {}): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  let decimals = opts.maxDecimals;
  if (decimals === undefined) {
    if (abs === 0) decimals = 2;
    else if (abs >= 1) decimals = 2;
    else if (abs >= 0.01) decimals = 4;
    else if (abs >= 0.0001) decimals = 6;
    else decimals = 8;
  }
  const min = opts.minDecimals ?? Math.min(2, decimals);
  const sign = value < 0 ? "-" : "";
  return `${sign}$${abs.toLocaleString("en-US", {
    minimumFractionDigits: min,
    maximumFractionDigits: decimals,
  })}`;
}

export function formatSigned(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `${value >= 0 ? "+" : ""}${formatMoney(value)}`;
}

export function formatNumber(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

export function formatPercent(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return "—";
  return `${formatNumber(value, decimals)}%`;
}

export function formatDate(date: Date | null, lang: Language): string {
  if (!date || Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(lang === "pt" ? "pt-BR" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDuration(days: number, lang: Language): string {
  if (!Number.isFinite(days)) return "∞";
  if (days <= 0) return lang === "pt" ? "agora" : "now";
  if (days < 1 / 24) {
    const minutes = days * 1440;
    return `${formatNumber(minutes, 0)} min`;
  }
  if (days < 1) {
    const hours = days * 24;
    return `${formatNumber(hours, 1)} h`;
  }
  if (days < 60) return `${formatNumber(days, 2)} ${lang === "pt" ? "dias" : "days"}`;
  if (days < 730) return `${formatNumber(days / 30, 2)} ${lang === "pt" ? "meses" : "months"}`;
  return `${formatNumber(days / 365, 2)} ${lang === "pt" ? "anos" : "years"}`;
}
