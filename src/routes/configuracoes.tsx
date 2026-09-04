import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import { toast } from "sonner";
import { SectionTitle } from "@/components/common/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_PARAMS, MINE_META } from "@/data/defaults";
import { useAppState } from "@/hooks/useAppState";
import { STORAGE_KEY } from "@/hooks/useAppState";
import { formatMoney, formatNumber } from "@/lib/format";
import { MINE_TYPES, type MineType } from "@/types";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações e parâmetros — TerraMine Calculator" },
      {
        name: "description",
        content:
          "Ajuste rendimentos base, boost, taxa de saque, impostos, limites e idioma. Exporte, importe ou apague seus dados.",
      },
      { property: "og:title", content: "Configurações e parâmetros — TerraMine Calculator" },
      {
        property: "og:description",
        content: "Todos os valores da calculadora TerraMine em um só lugar, editáveis a qualquer momento.",
      },
    ],
  }),
  component: SettingsPage,
});

function NumberField({
  label,
  value,
  onChange,
  step = "any",
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => {
          const n = Number(e.target.value);
          onChange(Number.isFinite(n) ? n : 0);
        }}
        className="num"
      />
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function SettingsPage() {
  const { t, state, params, setParams, resetParams, setLanguage, replaceState, eraseAll } = useAppState();
  const fileRef = useRef<HTMLInputElement>(null);

  const setBase = (type: MineType, value: number) =>
    setParams({ baseMonthly: { ...params.baseMonthly, [type]: value } });
  const setMultiplier = (type: MineType, value: number) =>
    setParams({ typeMultiplier: { ...params.typeMultiplier, [type]: value } });

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${STORAGE_KEY}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t.settings.exported);
  };

  const importData = async (file: File) => {
    try {
      replaceState(JSON.parse(await file.text()));
      toast.success(t.settings.imported);
    } catch {
      toast.error(t.settings.importError);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">{t.settings.title}</h1>

      <p className="rounded-xl border border-primary/25 bg-primary/5 p-3 text-xs text-muted-foreground">
        {t.settings.warning}
      </p>

      <section className="panel p-4">
        <SectionTitle
          action={
            <Button variant="ghost" size="sm" onClick={() => {
              if (confirm(t.settings.restoreConfirm)) {
                resetParams();
                toast.success(t.settings.saved);
              }
            }}>
              {t.settings.resetParams}
            </Button>
          }
        >
          {t.settings.incomes}
        </SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MINE_TYPES.map((type) => (
            <NumberField
              key={type}
              label={`${MINE_META[type].emoji} ${t.mineTypes[type]}`}
              value={params.baseMonthly[type]}
              onChange={(v) => setBase(type, v)}
              hint={`${t.settings.referenceValue}: ${formatMoney(DEFAULT_PARAMS.baseMonthly[type])}`}
            />
          ))}
        </div>

        <SectionTitle>{t.settings.typeMultiplier}</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MINE_TYPES.map((type) => (
            <NumberField
              key={type}
              label={`${MINE_META[type].emoji} ${t.mineTypes[type]}`}
              value={params.typeMultiplier[type]}
              onChange={(v) => setMultiplier(type, v)}
              hint={`${t.settings.referenceValue}: ${formatNumber(DEFAULT_PARAMS.typeMultiplier[type], 2)}×`}
            />
          ))}
        </div>
      </section>

      <section className="panel p-4">
        <SectionTitle>{t.settings.boost}</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-3">
          <NumberField
            label={t.boost.multiplier}
            value={params.boostMultiplier}
            onChange={(v) => setParams({ boostMultiplier: v })}
          />
          <NumberField
            label={t.boost.hoursPerDay}
            value={params.boostHoursPerDay}
            onChange={(v) => setParams({ boostHoursPerDay: Math.min(24, Math.max(0, v)) })}
          />
          <NumberField
            label={t.settings.levelStep}
            value={params.levelStep * 100}
            onChange={(v) => setParams({ levelStep: v / 100 })}
            hint={`${t.settings.referenceValue}: 1%`}
          />
        </div>
      </section>

      <section className="panel p-4">
        <SectionTitle>{t.settings.withdrawal}</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField
            label={t.settings.fee}
            value={params.withdrawalFee * 100}
            onChange={(v) => setParams({ withdrawalFee: v / 100 })}
            hint={`${t.settings.referenceValue}: 17%`}
          />
          <NumberField
            label={t.settings.tax}
            value={params.additionalTax * 100}
            onChange={(v) => setParams({ additionalTax: v / 100 })}
            hint={`${t.settings.referenceValue}: 0%`}
          />
        </div>
      </section>

      <section className="panel p-4">
        <SectionTitle>{`${t.settings.limits} · ${t.settings.periods}`}</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-3">
          <NumberField
            label={t.settings.maxLevel}
            value={params.maxLevel}
            onChange={(v) => setParams({ maxLevel: Math.max(1, Math.round(v)) })}
          />
          <NumberField
            label={t.settings.daysPerMonth}
            value={params.daysPerMonth}
            onChange={(v) => setParams({ daysPerMonth: Math.max(1, v) })}
          />
          <NumberField
            label={t.settings.daysPerYear}
            value={params.daysPerYear}
            onChange={(v) => setParams({ daysPerYear: Math.max(1, v) })}
          />
        </div>
      </section>

      <section className="panel p-4">
        <SectionTitle>{t.settings.language}</SectionTitle>
        <div className="flex gap-2">
          {(["pt", "en"] as const).map((lang) => (
            <Button
              key={lang}
              variant={state.language === lang ? "default" : "outline"}
              size="sm"
              onClick={() => setLanguage(lang)}
            >
              {lang === "pt" ? "Português" : "English"}
            </Button>
          ))}
        </div>
      </section>

      <section className="panel p-4">
        <SectionTitle>{t.settings.data}</SectionTitle>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={exportData}>
            {t.settings.export}
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            {t.settings.import}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void importData(file);
              e.target.value = "";
            }}
          />
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm(t.settings.eraseConfirm)) eraseAll();
            }}
          >
            {t.settings.erase}
          </Button>
        </div>
      </section>

      <section className="panel p-4 text-sm">
        <SectionTitle>{t.settings.dataOrigin}</SectionTitle>
        <ul className="space-y-3 text-muted-foreground">
          <li>
            <p className="font-medium text-foreground">{t.settings.officialData}</p>
            <p className="text-xs">{t.settings.officialDataDesc}</p>
          </li>
          <li>
            <p className="font-medium text-foreground">{t.settings.communityData}</p>
            <p className="text-xs">{t.settings.communityDataDesc}</p>
          </li>
          <li>
            <p className="font-medium text-foreground">{t.settings.userData}</p>
            <p className="text-xs">{t.settings.userDataDesc}</p>
          </li>
        </ul>
      </section>

      <p className="text-xs text-muted-foreground">
        {t.disclaimer.estimates} {t.disclaimer.fees} {t.disclaimer.check}
      </p>
    </div>
  );
}
