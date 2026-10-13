import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { LandRents } from "@/components/land/LandRents";
import { useGameMode } from "@/hooks/useGameMode";

export const Route = createFileRoute("/land-rents")({
  head: () => ({ meta: [
    { title: "Land Rent Brasil Grupo 4 — Calculadora | TerraMine Gems" },
    { name: "description", content: "Simule terrenos, emblemas progressivos e Rent Rush semanal do Land Rent no Brasil, Grupo 4." },
    { property: "og:title", content: "Land Rent Brasil Grupo 4 — Calculadora" },
    { property: "og:description", content: "Estimativas de terrenos, boost automático e evento Rent Rush, com hipóteses identificadas." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ], links: [{ rel: "icon", type: "image/svg+xml", href: "/land-rent-icon.svg" }] }),
  component: LandRentsPage,
});
function LandRentsPage() {
  const { setMode, hydrated } = useGameMode();
  useEffect(() => { if (hydrated) setMode("land-rents"); }, [setMode, hydrated]);
  return <LandRents />;
}