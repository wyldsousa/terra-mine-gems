import { createFileRoute } from "@tanstack/react-router";
import { GameCalculator } from "@/components/games/GameCalculator";

export const Route = createFileRoute("/atlas")({
  head: () => ({
    meta: [
      { title: "Atlas Earth — Calculadora de renda" },
      { name: "description", content: "Calcule a renda estimada dos seus terrenos no Atlas Earth." },
      { property: "og:title", content: "Atlas Earth — Calculadora de renda" },
      { property: "og:description", content: "Calcule a renda estimada dos seus terrenos no Atlas Earth." },
    ],
  }),
  component: () => <GameCalculator game="atlas" />,
});
