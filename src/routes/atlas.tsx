import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useGameMode } from "@/hooks/useGameMode";

export const Route = createFileRoute("/atlas")({
  head: () => ({
    meta: [
      { title: "Atlas Earth — Calculadora de renda" },
      { name: "description", content: "Abra o modo Atlas Earth: terrenos, boost, eventos e metas." },
      { property: "og:title", content: "Atlas Earth — Calculadora de renda" },
      { property: "og:description", content: "Abra o modo Atlas Earth: terrenos, boost, eventos e metas." },
    ],
  }),
  component: OpenMode,
});

function OpenMode() {
  const { setMode } = useGameMode();
  const navigate = useNavigate();
  useEffect(() => {
    setMode("atlas");
    navigate({ to: "/", replace: true });
  }, [setMode, navigate]);
  return null;
}
