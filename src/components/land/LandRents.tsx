import { Link } from "@tanstack/react-router";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGameMode } from "@/hooks/useGameMode";
import terrain from "@/assets/land-rent-terrain.jpg";
import { LandRentIcon } from "./LandRentIcon";
import { GAME_INFO } from "@/data/landGames";
import { LAND_RENT_AVAILABILITY } from "@/data/landRent";

export function LandRents() {
  const { setMode, previousGame } = useGameMode();
  return <div className="land-rent-page">
    <section className="land-rent-world relative isolate overflow-hidden bg-surface">
      <img src={terrain} alt="Terrenos virtuais verdes delimitados por linhas douradas, com um grande marcador de localização GPS" width={1536} height={1024} className="land-rent-terrain absolute inset-0 h-full w-full object-cover" />
      <div className="land-rent-shade absolute inset-0" />
      <div className="land-rent-intro relative z-10 flex h-full flex-col items-start justify-center">
        <div className="mb-7 flex items-center gap-3 text-primary">
          <LandRentIcon className="h-12 w-12" />
          <span className="text-xs font-semibold">TERRENOS VIRTUAIS</span>
        </div>
        <h1 className="font-display text-4xl font-bold sm:text-5xl">LAND RENT</h1>
        <p className="mt-5 max-w-xs text-xs font-bold leading-relaxed text-primary sm:text-sm">CALCULADORA EM DESENVOLVIMENTO</p>
        <p className="mt-5 max-w-sm text-sm leading-7 text-foreground/85 sm:text-base">Estamos preparando a calculadora Land Rent. Em breve, você poderá acompanhar e calcular as informações dos seus terrenos virtuais.</p>
      </div>
    </section>
    <div className="flex flex-wrap items-center justify-between gap-5 border-t border-border py-6">
      <div className="flex items-center gap-3 text-sm text-muted-foreground"><LockKeyhole className="h-4 w-4 text-primary" /><span>EM BREVE</span></div>
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" asChild><Link to="/" onClick={() => setMode(previousGame)}><ArrowLeft className="h-4 w-4" /> Voltar ao {GAME_INFO[previousGame].name}</Link></Button>
        <Button disabled={!LAND_RENT_AVAILABILITY.calculatorEnabled}><LockKeyhole className="h-4 w-4" /> Calculadora</Button>
      </div>
    </div>
  </div>;
}