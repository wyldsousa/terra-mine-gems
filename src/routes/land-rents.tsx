import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { LandRents } from "@/components/land/LandRents";
import { useGameMode } from "@/hooks/useGameMode";

export const Route = createFileRoute("/land-rents")({
  head: () => ({ meta: [
    { title: "Land Rents — Em breve | TerraMine Gems" },
    { name: "description", content: "Land Rents: a próxima calculadora do TerraMine Gems. Em breve." },
    { property: "og:title", content: "Land Rents — Em breve" },
    { property: "og:description", content: "Uma nova calculadora para sua coleção. Land Rents, em breve." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: LandRentsPage,
});
function LandRentsPage() {
  const { setMode } = useGameMode();
  useEffect(() => setMode("land-rents"), [setMode]);
  return <LandRents />;
}