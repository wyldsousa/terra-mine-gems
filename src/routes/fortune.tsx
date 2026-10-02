import { createFileRoute } from "@tanstack/react-router";
import { GameCalculator } from "@/components/games/GameCalculator";

export const Route = createFileRoute("/fortune")({
  head: () => ({
    meta: [
      { title: "Fortune World — Calculadora de renda" },
      { name: "description", content: "Calcule a renda estimada das suas propriedades no Fortune World." },
      { property: "og:title", content: "Fortune World — Calculadora de renda" },
      { property: "og:description", content: "Calcule a renda estimada das suas propriedades no Fortune World." },
    ],
  }),
  component: () => <GameCalculator game="fortune" />,
});
