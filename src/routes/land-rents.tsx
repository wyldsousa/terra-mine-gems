import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { LandRents } from "@/components/land/LandRents";
import { useGameMode } from "@/hooks/useGameMode";

export const Route = createFileRoute("/land-rents")({
  head: () => ({ meta: [
    { title: "Land Rent — Calculadora em desenvolvimento | TerraMine Gems" },
    { name: "description", content: "Estamos preparando a calculadora Land Rent para acompanhar as informações dos seus terrenos virtuais. Em breve." },
    { property: "og:title", content: "Land Rent — Calculadora em desenvolvimento" },
    { property: "og:description", content: "Terrenos virtuais, mapas e novas conquistas. A calculadora Land Rent está em desenvolvimento." },
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