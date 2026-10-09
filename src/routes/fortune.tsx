import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useGameMode } from "@/hooks/useGameMode";

export const Route = createFileRoute("/fortune")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Fortune World — Calculadora de renda" },
      { name: "description", content: "Abra o modo Fortune World: terrenos, boost, eventos e metas." },
      { property: "og:title", content: "Fortune World — Calculadora de renda" },
      { property: "og:description", content: "Abra o modo Fortune World: terrenos, boost, eventos e metas." },
    ],
  }),
  component: OpenMode,
});

function OpenMode() {
  const { setMode } = useGameMode();
  const navigate = useNavigate();
  useEffect(() => {
    setMode("fortune");
    navigate({ to: "/", replace: true });
  }, [setMode, navigate]);
  return null;
}
