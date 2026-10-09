import { Link } from "@tanstack/react-router";
import { ArrowLeft, House } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGameMode } from "@/hooks/useGameMode";
import house from "@/assets/land-rents.jpg";

export function LandRents() {
  const { setMode } = useGameMode();
  return <div className="space-y-6">
    <section className="relative min-h-[440px] overflow-hidden rounded-lg bg-surface sm:min-h-[580px]">
      <img src={house} alt="Casa com jardim — Land Rents" width={1536} height={1024} className="absolute inset-0 h-full w-full object-cover" />
      <div className="relative z-10 flex items-start justify-between gap-4 p-6 sm:p-10">
        <div className="bg-background/90 p-4 rounded-lg">
          <House className="mb-3 h-7 w-7 text-primary" />
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Land Rents</h1>
          <p className="mt-3 text-sm font-semibold tracking-wide text-primary">EM BREVE</p>
        </div>
      </div>
    </section>
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border py-4">
      <p className="text-muted-foreground">🏡 Calculadora Land Rents — em desenvolvimento.</p>
      <Button variant="outline" asChild><Link to="/" onClick={() => setMode("terramine")}><ArrowLeft className="h-4 w-4" /> Voltar ao TerraMine</Link></Button>
    </div>
  </div>;
}