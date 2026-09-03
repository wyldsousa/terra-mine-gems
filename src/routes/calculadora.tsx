import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SectionTitle, StatCard } from "@/components/common/StatCard";
import { HowWeCalculate } from "@/components/common/HowWeCalculate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  calculateExpansionImpact,
  calculateGoalTime,
  calculateGrossForNet,
  calculatePortfolioIncome,
  calculateProjection,
  calculateTimeToEarn,
  calculateUpgradeImpact,
  calculateWithdrawal,
} from "@/calculations/terraMineCalculator";
import { MINE_META } from "@/data/defaults";
import { useAppState } from "@/hooks/useAppState";
import { formatDate, formatDuration, formatMoney, formatNumber, formatPercent } from "@/lib/format";
import { MINE_TYPES, type MineType } from "@/types";

export const Route = createFileRoute("/calculadora")({
  head: () => ({
    meta: [
      { title: "Calculadora — Boost, saque, metas e simulações | TerraMine" },
      {
        name: "description",
        content: "Simule boost, saques líquidos após taxas, metas de US$1 e US$5, upgrades e novas minas.",
      },
      { property: "og:title", content: "Calculadora TerraMine — boost, saque e simulações" },
      { property: "og:description", content: "Boost, saque líquido, metas, projeções, upgrades e expansão." },
    ],
  }),
  component: CalculatorPage,
});

function CalculatorPage() {
  const { t, tx, mines, params, state, setParams, setBalance, setGoals } = useAppState();
  const [boostHours, setBoostHours] = useState(params.boostHoursPerDay);
  const income = useMemo(
    () => calculatePortfolioIncome(mines, params, boostHours),
    [mines, params, boostHours],
  );
  const daily = income.boostedDaily;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">{t.nav.calculator}</h1>

      {/* BOOST */}
      <section className="panel p-5">
        <SectionTitle>{t.boost.title}</SectionTitle>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t.boost.hoursPerDay}</span>
          <span className="num font-semibold">{formatNumber(boostHours, 1)}h</span>
        </div>
        <Slider
          className="mt-3"
          min={0}
          max={24}
          step={0.5}
          value={[boostHours]}
          onValueChange={([v]) => setBoostHours(v ?? 0)}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setBoostHours(0)}>
            {t.projection.withoutBoost}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setBoostHours(24)}>
            {t.boost.full24}
          </Button>
          <Button size="sm" onClick={() => setParams({ boostHoursPerDay: boostHours })}>
            {t.common.save}
          </Button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <StatCard label={t.dashboard.withoutBoost} value={formatMoney(income.withoutBoost.perMonth)} />
          <StatCard label={t.dashboard.withBoost} value={formatMoney(income.withBoost.perMonth)} accent />
          <StatCard
            label={t.dashboard.boostGain}
            value={formatMoney(income.boostGainMonthly)}
            sub={formatPercent(income.boostGainPercent)}
          />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{t.boost.formula}</p>
      </section>

      {/* WITHDRAWAL */}
      <WithdrawSection balance={state.balance} onBalance={setBalance} />

      {/* GOALS */}
      <GoalsSection daily={daily} onGoals={setGoals} />

      {/* TIME TO EARN */}
      <TimeToEarn daily={daily} />

      {/* PROJECTION */}
      <ProjectionSection daily={daily} />

      {/* EXPANSION */}
      <ExpansionSection boostHours={boostHours} />

      {/* UPGRADE */}
      <UpgradeSection boostHours={boostHours} />

      <p className="text-xs text-muted-foreground">{tx(t.dashboard.per30d, { days: params.daysPerMonth })}</p>
      <HowWeCalculate />
    </div>
  );
}

function WithdrawSection({ balance, onBalance }: { balance: number; onBalance: (v: number) => void }) {
  const { t, tx, params } = useAppState();
  const [wantedNet, setWantedNet] = useState(1);
  const result = calculateWithdrawal(balance, params);
  const grossNeeded = calculateGrossForNet(wantedNet, params);

  return (
    <section className="panel p-5">
      <SectionTitle>{t.withdraw.title}</SectionTitle>
      <div className="space-y-2">
        <Label htmlFor="balance">{t.withdraw.balance}</Label>
        <Input
          id="balance"
          type="number"
          min={0}
          step="0.00000001"
          inputMode="decimal"
          value={balance}
          onChange={(e) => onBalance(Math.max(0, Number(e.target.value) || 0))}
        />
      </div>
      <div className="mt-4 space-y-2 text-sm">
        <Row label={t.withdraw.gross} value={formatMoney(result.gross)} />
        <Row
          label={tx(t.withdraw.fee, { value: formatPercent(params.withdrawalFee * 100) })}
          value={`−${formatMoney(result.platformFee)}`}
        />
        <Row
          label={tx(t.withdraw.tax, { value: formatPercent(params.additionalTax * 100) })}
          value={`−${formatMoney(result.additionalTax)}`}
        />
        <div className="mt-2 rounded-xl border border-border bg-background/40 p-3">
          <p className="text-xs uppercase text-muted-foreground">{t.withdraw.net}</p>
          <p className="ember-text num text-2xl font-bold">{formatMoney(result.net)}</p>
        </div>
      </div>
      <div className="mt-5 border-t border-border pt-4">
        <p className="text-sm font-medium">{t.withdraw.needed}</p>
        <div className="mt-2 flex flex-wrap items-end gap-3">
          <div className="w-40 space-y-1">
            <Label htmlFor="net">{t.withdraw.customNet}</Label>
            <Input
              id="net"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={wantedNet}
              onChange={(e) => setWantedNet(Math.max(0, Number(e.target.value) || 0))}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {tx(t.withdraw.neededFor, { value: formatMoney(wantedNet) })}:{" "}
            <span className="num font-semibold text-foreground">{formatMoney(grossNeeded)}</span>
          </p>
        </div>
      </div>
    </section>
  );
}

function GoalsSection({ daily, onGoals }: { daily: number; onGoals: (g: number[]) => void }) {
  const { t, tx, state, params } = useAppState();
  const [custom, setCustom] = useState("");

  return (
    <section className="panel p-5">
      <SectionTitle>{t.goals.title}</SectionTitle>
      {daily <= 0 && <p className="mb-3 text-xs text-muted-foreground">{t.goals.noIncome}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {state.goals.map((target) => {
          const g = calculateGoalTime(target, state.balance, daily, params);
          return (
            <div key={target} className="rounded-xl border border-border bg-background/40 p-3">
              <div className="flex items-baseline justify-between">
                <p className="num font-semibold">{formatMoney(target)}</p>
                <p className="text-xs text-muted-foreground">
                  {g.reached ? t.common.reached : formatDuration(g.days, state.language)}
                </p>
              </div>
              <Progress value={g.progressPercent} className="mt-2" />
              <p className="mt-2 text-xs text-muted-foreground">
                {t.goals.remaining}: <span className="num">{formatMoney(g.remaining)}</span> ·{" "}
                {formatDate(g.etaDate, state.language)}
              </p>
              {!g.reached && Number.isFinite(g.days) && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {tx(t.goals.willReach, { date: formatDate(g.etaDate, state.language) })}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-end gap-2">
        <div className="w-40 space-y-1">
          <Label htmlFor="goal">{t.goals.addGoal}</Label>
          <Input
            id="goal"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
          />
        </div>
        <Button
          onClick={() => {
            const v = Number(custom);
            if (Number.isFinite(v) && v > 0 && !state.goals.includes(v)) onGoals([...state.goals, v]);
            setCustom("");
          }}
        >
          {t.common.add}
        </Button>
      </div>
    </section>
  );
}

function TimeToEarn({ daily }: { daily: number }) {
  const { t, state } = useAppState();
  const [amount, setAmount] = useState(1);
  const result = calculateTimeToEarn(amount, daily);

  return (
    <section className="panel p-5">
      <SectionTitle>{t.timeCalc.title}</SectionTitle>
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-40 space-y-1">
          <Label htmlFor="amount">{t.timeCalc.amount}</Label>
          <Input
            id="amount"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
          />
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">{t.timeCalc.result}</p>
          <p className="num text-xl font-semibold">{formatDuration(result.days, state.language)}</p>
          <p className="text-xs text-muted-foreground">
            {formatNumber(result.hours, 1)} {t.common.hours} · {formatNumber(result.minutes, 0)}{" "}
            {t.common.minutes}
          </p>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{t.timeCalc.considering}</p>
    </section>
  );
}

const PERIODS = [1, 7, 30, 90, 180, 365];

function ProjectionSection({ daily }: { daily: number }) {
  const { t, state } = useAppState();
  const [days, setDays] = useState(30);
  const data = useMemo(
    () => calculateProjection(days, state.balance, daily),
    [days, state.balance, daily],
  );
  const last = data[data.length - 1]!;

  return (
    <section className="panel p-5">
      <SectionTitle>{t.projection.title}</SectionTitle>
      <div className="mb-4 flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <Button key={p} size="sm" variant={days === p ? "default" : "outline"} onClick={() => setDays(p)}>
            {p}
            {t.common.day.charAt(0)}
          </Button>
        ))}
      </div>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: 4, right: 4, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="proj" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.6} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} />
            <YAxis
              width={60}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickLine={false}
              tickFormatter={(v: number) => formatMoney(v)}
            />
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                fontSize: 12,
              }}
              formatter={(v: number) => formatMoney(v)}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="var(--primary)"
              fill="url(#proj)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <StatCard label={t.projection.balanceAt} value={formatMoney(last.balance)} />
        <StatCard label={t.projection.earned} value={formatMoney(last.earned)} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{formatDate(new Date(Date.now() + days * 86400000), state.language)}</p>
    </section>
  );
}

function ExpansionSection({ boostHours }: { boostHours: number }) {
  const { t, mines, params } = useAppState();
  const [quantities, setQuantities] = useState<Record<MineType, number>>({
    rock: 0,
    coal: 0,
    gold: 0,
    diamond: 0,
  });
  const [level, setLevel] = useState(1);

  const impact = useMemo(
    () =>
      calculateExpansionImpact(
        mines,
        MINE_TYPES.map((type) => ({ type, quantity: quantities[type], level })),
        params,
        boostHours,
      ),
    [mines, quantities, level, params, boostHours],
  );

  return (
    <section className="panel p-5">
      <SectionTitle>{t.expansion.title}</SectionTitle>
      <p className="mb-3 text-sm text-muted-foreground">{t.expansion.question}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {MINE_TYPES.map((type) => (
          <div key={type} className="space-y-1">
            <Label htmlFor={`exp-${type}`}>
              {MINE_META[type].emoji} {t.mineTypes[type]}
            </Label>
            <Input
              id={`exp-${type}`}
              type="number"
              min={0}
              inputMode="numeric"
              value={quantities[type]}
              onChange={(e) =>
                setQuantities((q) => ({ ...q, [type]: Math.max(0, Number(e.target.value) || 0) }))
              }
            />
          </div>
        ))}
      </div>
      <div className="mt-3 w-40 space-y-1">
        <Label htmlFor="exp-level">{t.expansion.newLevel}</Label>
        <Input
          id="exp-level"
          type="number"
          min={1}
          max={params.maxLevel}
          inputMode="numeric"
          value={level}
          onChange={(e) => setLevel(Number(e.target.value) || 1)}
        />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <StatCard label={t.expansion.currentIncome} value={formatMoney(impact.currentMonthly)} />
        <StatCard label={t.expansion.afterIncome} value={formatMoney(impact.newMonthly)} accent />
        <StatCard
          label={t.expansion.increase}
          value={`+${formatMoney(impact.addedMonthly)}`}
          sub={formatPercent(impact.percentIncrease)}
        />
      </div>
    </section>
  );
}

function UpgradeSection({ boostHours }: { boostHours: number }) {
  const { t, mines, params } = useAppState();
  const [mineId, setMineId] = useState<string>("");
  const [target, setTarget] = useState(2);
  const selected = mines.find((m) => m.id === mineId) ?? mines[0];

  const impact = useMemo(
    () => (selected ? calculateUpgradeImpact(selected, target, params, boostHours) : null),
    [selected, target, params, boostHours],
  );

  if (mines.length === 0) {
    return (
      <section className="panel p-5">
        <SectionTitle>{t.upgrade.title}</SectionTitle>
        <p className="text-sm text-muted-foreground">{t.upgrade.noMines}</p>
      </section>
    );
  }

  return (
    <section className="panel p-5">
      <SectionTitle>{t.upgrade.title}</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>{t.upgrade.selectMine}</Label>
          <Select value={selected?.id ?? ""} onValueChange={setMineId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {mines.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {MINE_META[m.type].emoji} {m.name || t.mineTypes[m.type]} · {t.common.level} {m.level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="target-level">{t.upgrade.targetLevel}</Label>
          <Input
            id="target-level"
            type="number"
            min={1}
            max={params.maxLevel}
            inputMode="numeric"
            value={target}
            onChange={(e) => setTarget(Number(e.target.value) || 1)}
          />
        </div>
      </div>
      {impact && (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <StatCard
            label={t.upgrade.incomeNow}
            value={formatMoney(impact.currentDaily * params.daysPerMonth)}
            sub={`${t.upgrade.currentLevel}: ${impact.fromLevel}`}
          />
          <StatCard
            label={t.upgrade.incomeAfter}
            value={formatMoney(impact.newDaily * params.daysPerMonth)}
            sub={`${t.common.level} ${impact.toLevel}`}
            accent
          />
          <StatCard
            label={t.common.difference}
            value={`+${formatMoney(impact.diffMonthly)}`}
            sub={formatPercent(impact.percentIncrease)}
          />
        </div>
      )}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="num font-medium">{value}</span>
    </div>
  );
}
