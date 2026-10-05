import { useEffect, useState } from "react";

const KEY = "eur-usd-auto-v1";
interface Stored { rate: number; at: number }

/** Fetches EUR→USD automatically; keeps the last valid rate when offline. */
export function useEurUsd() {
  const [data, setData] = useState<Stored | null>(null);
  const [stale, setStale] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setData(JSON.parse(raw));
    } catch { /* ignore */ }
    const get = (url: string) => fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(new Error("http")))) as Promise<{ rates?: { USD?: number } }>;
    get("https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD")
      .catch(() => get("https://open.er-api.com/v6/latest/EUR"))
      .then((j) => {
        const rate = j.rates?.USD;
        if (!rate || !Number.isFinite(rate)) throw new Error("bad");
        const next = { rate, at: Date.now() };
        localStorage.setItem(KEY, JSON.stringify(next));
        setData(next);
        setStale(false);
      })
      .catch(() => setStale(true));
  }, []);
  return { rate: data?.rate ?? null, updatedAt: data?.at ?? null, stale };
}
