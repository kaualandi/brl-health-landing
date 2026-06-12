"use client";

import { DropletIcon, FlameIcon, ScaleIcon } from "lucide-react";
import type { ReactNode } from "react";

import { AnimatedCounter } from "@/components/animations/animated-counter";
import { macroKcal } from "@/lib/nutri-plan";
import { cn } from "@/lib/utils";
import type { NutriPlan } from "@/types";

type MacroRow = {
  key: string;
  label: string;
  grams: number;
  pct: number;
  bar: string;
  dot: string;
};

function MacroBar({ row }: { row: MacroRow }) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="flex items-center gap-2 font-medium text-foreground">
          <span className={cn("size-2.5 rounded-full", row.dot)} />
          {row.label}
        </span>
        <span className="tabular-nums text-muted-foreground">
          <span className="font-semibold text-foreground">{row.grams} g</span> ·{" "}
          {row.pct}%
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
        <div
          className={cn("h-full rounded-full transition-[width] duration-700", row.bar)}
          style={{ width: `${row.pct}%` }}
        />
      </div>
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
      <span className="text-brl-purple">{icon}</span>
      <span className="font-display text-xl font-bold tabular-nums text-foreground">
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function PlanSummary({ plan }: { plan: NutriPlan }) {
  const macros = macroKcal(plan);

  const rows: MacroRow[] = [
    {
      key: "protein",
      label: "Proteína",
      grams: plan.protein,
      pct: macros.proteinPct,
      bar: "bg-brl-purple",
      dot: "bg-brl-purple",
    },
    {
      key: "carbs",
      label: "Carboidrato",
      grams: plan.carbs,
      pct: macros.carbsPct,
      bar: "bg-brl-orange",
      dot: "bg-brl-orange",
    },
    {
      key: "fat",
      label: "Gordura",
      grams: plan.fat,
      pct: macros.fatPct,
      bar: "bg-emerald-400",
      dot: "bg-emerald-400",
    },
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col justify-center rounded-2xl border border-brl-purple/30 bg-gradient-to-br from-brl-purple/15 to-transparent p-6 text-center sm:p-8">
        <p className="text-xs font-medium tracking-wide text-brl-purple uppercase">
          Sua meta diária
        </p>
        <p className="mt-3 font-display text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl">
          <AnimatedCounter to={plan.targetCalories} />
        </p>
        <p className="mt-1 text-sm text-muted-foreground">kcal por dia</p>
        <p className="mt-4 text-xs text-muted-foreground">
          Gasto estimado (TDEE):{" "}
          <span className="font-medium text-foreground">
            {plan.tdee.toLocaleString("pt-BR")} kcal
          </span>
        </p>
      </div>

      <div className="flex flex-col gap-5 rounded-2xl border border-white/5 bg-brl-card p-6 sm:p-8">
        <div className="flex flex-col gap-4">
          {rows.map((row) => (
            <MacroBar key={row.key} row={row} />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Stat
            icon={<DropletIcon className="size-5" />}
            value={`${(plan.waterMl / 1000).toFixed(1)} L`}
            label="Água / dia"
          />
          <Stat
            icon={<ScaleIcon className="size-5" />}
            value={String(plan.bmi)}
            label={plan.bmiLabel}
          />
          <Stat
            icon={<FlameIcon className="size-5" />}
            value={plan.bmr.toLocaleString("pt-BR")}
            label="Metabolismo basal"
          />
        </div>
      </div>
    </div>
  );
}
