import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { SectionTitle, StatCard } from "@/components/common/StatCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  calculateGoalTime,
  calculateMineIncomeWithBoost,
  calculatePortfolioIncome,
} from "@/calculations/terraMineCalculator";
import { MINE_META } from "@/data/defaults";
import { useAppState } from "@/hooks/useAppState";
import { formatDate, formatDuration, formatMoney, formatNumber, formatPercent } from "@/lib/format";
import { HowWeCalculate } from "@/components/common/HowWeCalculate";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TerraMine Calculator — Rendimentos das suas minas" },
      {
        name: "description",
        content:
          "Calcule rendimentos por hora, dia, mês e ano das suas minas do TerraMine, simule boost, upgrades e saques líquidos.",
      },
      { property: "og:title", content: "TerraMine Calculator — Rendimentos das suas minas" },
      {
        property: "og:description",
        content: "Painel completo de rendimentos, boost, metas e saques para jogadores do TerraMine.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { t, tx, mines, params, state } = useAppState();
  const income = useMemo(() => calculatePortfolioIncome(mines, params), [mines, params]);

  const topMine = useMemo(() => {
    if (mines.length === 0) return null;
    return [...mines].sort(
      (a, b) => calculateMineIncomeWithBoost(b, params) - calculateMineIncomeWithBoost(a, params),
    )[0]!;
  }, [mines, params]);

  const nextGoal = useMemo(
    () => state.goals.find((g) => g > state.balance) ?? state.goals[state.goals.length - 1] ?? 1,
    [state.goals, state.balance],
  );
  const goal = useMemo(
    () => calculateGoalTime(nextGoal, state.balance, income.boostedDaily, params),
    [nextGoal, state.balance, income.boostedDaily, params],
  );

  return (
    <div className="space-y-6">
      <section className="panel-glow p-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{t.dashboard.estimatedIncome}</p>
        <p className="ember-text num mt-1 text-4xl font-bold">{formatMoney(income.withBoost.perMonth)}</p>
        <p className="text-sm text-muted-foreground">{t.dashboard.perMonth}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Mini label={t.dashboard.perDay} value={formatMoney(income.withBoost.perDay)} />
          <Mini label={t.dashboard.perHour} value={formatMoney(income.withBoost.perHour)} />
          <Mini label={t.dashboard.perWeek} value={formatMoney(income.withBoost.perWeek)} />
          <Mini label={t.dashboard.perYear} value={formatMoney(income.withBoost.perYear)} />
        </div>
        {mines.length === 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-background/40 p-3">
            <p className="text-sm text-muted-foreground">{t.dashboard.empty}</p>
            <Button asChild size="sm">
              <Link to="/minas">{t.dashboard.goToMines}</Link>
            </Button>
          </div>
        )}
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t.dashboard.totalMines} value={formatNumber(income.totalMines, 0)} />
        <StatCard label={t.dashboard.avgLevel} value={formatNumber(income.averageLevel, 2)} />
        <StatCard label={t.dashboard.balance} value={formatMoney(state.balance)} />
        <StatCard
          label={t.dashboard.topMine}
          value={topMine ? `${MINE_META[topMine.type].emoji} ${t.mineTypes[topMine.type]}` : "—"}
          sub={topMine ? `${t.common.level} ${topMine.level}` : undefined}
        />
      </section>

      <section>
        <SectionTitle>{t.dashboard.conversions}</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label={t.dashboard.perSecond} value={formatMoney(income.withBoost.perSecond)} />
          <StatCard label={t.dashboard.perMinute} value={formatMoney(income.withBoost.perMinute)} />
          <StatCard label={t.dashboard.per24h} value={formatMoney(income.withBoost.perDay)} />
          <StatCard label={t.dashboard.per7d} value={formatMoney(income.withBoost.perWeek)} />
          <StatCard
            label={tx(t.dashboard.per30d, { days: params.daysPerMonth })}
            value={formatMoney(income.withBoost.perMonth)}
          />
          <StatCard
            label={tx(t.dashboard.per365d, { days: params.daysPerYear })}
            value={formatMoney(income.withBoost.perYear)}
          />
        </div>
      </section>

      <section className="panel p-5">
        <SectionTitle>{t.dashboard.boostImpact}</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-3">
          <Mini label={t.dashboard.withoutBoost} value={`${formatMoney(income.withoutBoost.perMonth)} /${t.common.month}`} />
          <Mini label={t.dashboard.withBoost} value={`${formatMoney(income.withBoost.perMonth)} /${t.common.month}`} />
          <Mini label={t.dashboard.boostGain} value={formatMoney(income.boostGainMonthly)} />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {tx(t.dashboard.boostIncrease, { value: formatPercent(income.boostGainPercent) })}{" "}
          <span className="text-foreground">
            {params.boostHoursPerDay}h × {params.boostMultiplier}×
          </span>
        </p>
      </section>

      <section className="panel p-5">
        <SectionTitle>{t.dashboard.nextGoal}</SectionTitle>
        <div className="flex items-baseline justify-between">
          <p className="num text-2xl font-semibold">{formatMoney(goal.target)}</p>
          <p className="text-sm text-muted-foreground">{formatPercent(goal.progressPercent, 1)}</p>
        </div>
        <Progress value={goal.progressPercent} className="mt-3" />
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
          <p className="text-muted-foreground">
            {t.goals.remaining}: <span className="num text-foreground">{formatMoney(goal.remaining)}</span>
          </p>
          <p className="text-muted-foreground">
            {t.goals.estimatedTime}:{" "}
            <span className="num text-foreground">{formatDuration(goal.days, state.language)}</span>
          </p>
          <p className="text-muted-foreground">
            {t.goals.estimatedDate}:{" "}
            <span className="num text-foreground">{formatDate(goal.etaDate, state.language)}</span>
          </p>
        </div>
      </section>

      <HowWeCalculate />
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/40 p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="num mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  );
}
