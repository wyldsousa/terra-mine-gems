import { Link, useRouterState } from "@tanstack/react-router";
import { BarChart3, Calculator, Gauge, Pickaxe, Settings } from "lucide-react";
import type { ReactNode } from "react";
import { useAppState } from "@/hooks/useAppState";
import { cn } from "@/lib/utils";

const ICONS = { dashboard: Gauge, mines: Pickaxe, calculator: Calculator, stats: BarChart3, settings: Settings };

export const NAV = [
  { to: "/", key: "dashboard" as const },
  { to: "/minas", key: "mines" as const },
  { to: "/calculadora", key: "calculator" as const },
  { to: "/estatisticas", key: "stats" as const },
  { to: "/configuracoes", key: "settings" as const },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { t, state, setLanguage } = useAppState();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="ember-bg flex h-9 w-9 items-center justify-center rounded-xl text-lg">⛏️</span>
            <span className="hidden flex-col leading-tight sm:flex">
              <span className="font-display text-sm font-semibold">{t.appName}</span>
              <span className="text-[11px] text-muted-foreground">{t.tagline}</span>
            </span>
          </Link>

          <nav className="ml-auto hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const Icon = ICONS[item.key];
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                    active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t.nav[item.key]}
                </Link>
              );
            })}
          </nav>

          <button
            onClick={() => setLanguage(state.language === "pt" ? "en" : "pt")}
            className="ml-auto rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold uppercase text-muted-foreground transition-colors hover:text-foreground md:ml-2"
            aria-label="Language"
          >
            {state.language === "pt" ? "PT" : "EN"}
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-5">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-lg items-stretch">
          {NAV.map((item) => {
            const Icon = ICONS[item.key];
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 px-1 py-2.5 text-[10px] transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="truncate">{t.nav[item.key]}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
