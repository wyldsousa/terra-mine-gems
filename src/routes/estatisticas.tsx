import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SectionTitle, StatCard } from "@/components/common/StatCard";
import {
  calculateMineDistribution,
  calculateMineIncomeWithBoost,
  calculatePortfolioIncome,
} from "@/calculations/terraMineCalculator";
import { MINE_META } from "@/data/defaults";
import { useAppState } from "@/hooks/useAppState";
import { formatMoney, formatNumber, formatPercent } from "@/lib/format";

export const Route = createFileRoute("/estatisticas")({
  head: () => ({
    meta: [
      { title: "Estatísticas das minas — TerraMine Calculator" },
      {
        name: "description",
        content:
          "Veja a distribuição das suas minas por tipo, quais geram mais dinheiro, nível médio e o ranking das mais lucrativas.",
      },
      { property: "og:title", content: "Estatísticas das minas — TerraMine Calculator" },
      {
        property: "og:description",
        content: "Distribuição por tipo, ranking de minas e níveis médios da sua carteira TerraMine.",
      },
    ],
  }),
  component: StatsPage,
});

function StatsPage() {
  const { t, mines, params } = useAppState();
  const income = useMemo(() => calculatePortfolioIncome(mines, params), [mines, params]);
  const distribution = useMemo(() => calculateMineDistribution(mines, params), [mines, params]);
  const active = distribution.filter((d) => d.count > 0);

  const ranking = useMemo(
    () =>
      [...mines]
        .map((m) => ({ mine: m, daily: calculateMineIncomeWithBoost(m, params) }))
        .sort((a, b) => b.daily - a.daily)
        .slice(0, 10),
    [mines, params],
  );

  if (mines.length === 0) {
    return (
      <div className="panel p-8 text-center text-sm text-muted-foreground">{t.stats.empty}</div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">{t.stats.title}</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t.dashboard.totalMines ?? "Minas"} value={formatNumber(income.totalMines, 0)} />
        <StatCard label={t.common.average + " · " + t.common.level} value={formatNumber(income.averageLevel, 2)} />
        <StatCard
          label={t.stats.avgPerMine}
          value={formatMoney(income.totalMines > 0 ? income.withBoost.perMonth / income.totalMines : 0)}
          sub={t.dashboard.perMonth}
        />
        <StatCard label={t.dashboard.perMonth} value={formatMoney(income.withBoost.perMonth)} accent />
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-4">
          <SectionTitle>{t.stats.distribution}</SectionTitle>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={active} dataKey="count" nameKey="type" innerRadius={50} outerRadius={85} paddingAngle={2}>
                  {active.map((d) => (
                    <Cell key={d.type} fill={MINE_META[d.type].color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, _n, item) => [
                    `${formatNumber(value, 0)} (${formatPercent((item?.payload as { countPercent: number }).countPercent)})`,
                    t.mineTypes[(item?.payload as { type: keyof typeof MINE_META }).type],
                  ]}
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-1.5">
            {active.map((d) => (
              <li key={d.type} className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: MINE_META[d.type].color }} />
                <span>{MINE_META[d.type].emoji} {t.mineTypes[d.type]}</span>
                <span className="num ml-auto text-muted-foreground">
                  {formatNumber(d.count, 0)} · {formatPercent(d.countPercent)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel p-4">
          <SectionTitle>{t.stats.whoEarns}</SectionTitle>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={active} margin={{ left: 4, right: 4, top: 8, bottom: 4 }}>
                <XAxis
                  dataKey="type"
                  tickFormatter={(v: keyof typeof MINE_META) => t.mineTypes[v]}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  formatter={(value: number) => formatMoney(value)}
                  labelFormatter={(v: keyof typeof MINE_META) => t.mineTypes[v]}
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))" }}
                />
                <Bar dataKey="monthlyIncome" radius={[6, 6, 0, 0]}>
                  {active.map((d) => (
                    <Cell key={d.type} fill={MINE_META[d.type].color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-1.5">
            {active.map((d) => (
              <li key={d.type} className="flex items-center gap-2 text-sm">
                <span>{MINE_META[d.type].emoji} {t.mineTypes[d.type]}</span>
                <span className="num ml-auto text-muted-foreground">
                  {formatMoney(d.monthlyIncome)} · {formatPercent(d.incomePercent)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="panel p-4">
        <SectionTitle>{t.stats.ranking}</SectionTitle>
        <ol className="space-y-2">
          {ranking.map((row, i) => (
            <li key={row.mine.id} className="flex items-center gap-3 rounded-lg bg-secondary/40 px-3 py-2">
              <span className="num w-6 text-sm text-muted-foreground">{i + 1}</span>
              <span>{MINE_META[row.mine.type].emoji}</span>
              <span className="truncate text-sm">
                {row.mine.name || t.mineTypes[row.mine.type]}
                <span className="ml-2 text-xs text-muted-foreground">
                  {t.common.level} {formatNumber(row.mine.level, 0)}
                </span>
              </span>
              <span className="num ml-auto text-sm font-semibold">
                {formatMoney(row.daily * params.daysPerMonth)}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="panel p-4">
        <SectionTitle>{t.stats.avgLevelByType}</SectionTitle>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {active.map((d) => (
            <StatCard
              key={d.type}
              label={`${MINE_META[d.type].emoji} ${t.mineTypes[d.type]}`}
              value={formatNumber(d.avgLevel, 2)}
              sub={`${formatNumber(d.count, 0)} · ${formatMoney(d.monthlyIncome)}`}
            />
          ))}
        </div>
      </section>

      <p className="text-xs text-muted-foreground">{t.disclaimer.estimates}</p>
    </div>
  );
}
