"use client";

import { ScaleIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useWeightLog, type WeightEntry } from "@/hooks/use-nutri-tracking";
import { estimateWeeksToGoal } from "@/lib/nutri-plan";
import { cn } from "@/lib/utils";
import type { NutriPlan, NutriProfile } from "@/types";

const W = 320;
const H = 96;
const PAD = 10;

function WeightChart({
  points,
  goalKg,
}: {
  points: WeightEntry[];
  goalKg?: number;
}) {
  const kgs = points.map((p) => p.kg);
  const all = goalKg != null ? [...kgs, goalKg] : kgs;
  const min = Math.min(...all);
  const max = Math.max(...all);
  const range = max - min || 1;
  const stepX = points.length > 1 ? (W - PAD * 2) / (points.length - 1) : 0;

  const coords = points.map((p, i) => ({
    x: points.length > 1 ? PAD + i * stepX : W / 2,
    y: PAD + (1 - (p.kg - min) / range) * (H - PAD * 2),
  }));

  const goalY =
    goalKg != null ? PAD + (1 - (goalKg - min) / range) * (H - PAD * 2) : null;

  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const area = `${line} L ${coords[coords.length - 1].x} ${H} L ${coords[0].x} ${H} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-24 w-full"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(150 86 161 / 0.35)" />
          <stop offset="100%" stopColor="rgb(150 86 161 / 0)" />
        </linearGradient>
      </defs>
      {goalY != null ? (
        <line
          x1={PAD}
          y1={goalY}
          x2={W - PAD}
          y2={goalY}
          stroke="#34d399"
          strokeWidth={1.5}
          strokeDasharray="5 4"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {points.length > 1 ? <path d={area} fill="url(#weightFill)" /> : null}
      {points.length > 1 ? (
        <path
          d={line}
          fill="none"
          stroke="#9656a1"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {coords.map((c, i) => (
        <circle
          key={i}
          cx={c.x}
          cy={c.y}
          r={i === coords.length - 1 ? 4 : 3}
          fill={i === coords.length - 1 ? "#ff8906" : "#9656a1"}
        />
      ))}
    </svg>
  );
}

export function WeightCard({
  profile,
  plan,
}: {
  profile: NutriProfile;
  plan: NutriPlan;
}) {
  const { entries, add } = useWeightLog();
  const toast = useToast();
  const [value, setValue] = useState("");

  // Linha-base (peso do onboarding) + registros. Mesmo dia sobrescreve a base.
  const baselineDate = (profile.createdAt || "").slice(0, 10) || "0000-00-00";
  const byDate = new Map<string, number>();
  byDate.set(baselineDate, profile.weightKg);
  for (const entry of entries) byDate.set(entry.date, entry.kg);
  const points: WeightEntry[] = Array.from(byDate, ([date, kg]) => ({
    date,
    kg,
  })).sort((a, b) => a.date.localeCompare(b.date));

  const start = points[0].kg;
  const current = points[points.length - 1].kg;
  const delta = Number((current - start).toFixed(1));
  const lost = delta < 0;

  const goal = profile.goalWeightKg;
  const hasGoal =
    typeof goal === "number" && goal > 0 && Math.abs(goal - start) >= 0.1;
  const totalToGo = hasGoal ? goal - start : 0;
  const progressPct =
    hasGoal && totalToGo !== 0
      ? Math.round(
          Math.min(100, Math.max(0, ((current - start) / totalToGo) * 100)),
        )
      : 0;
  const reached = hasGoal
    ? totalToGo < 0
      ? current <= goal
      : current >= goal
    : false;
  const remaining = hasGoal ? Math.abs(current - goal) : 0;
  const weeks =
    hasGoal && !reached ? estimateWeeksToGoal(plan, current, goal) : null;

  function handleAdd() {
    const kg = Number(value.replace(",", "."));
    if (!kg || kg < 35 || kg > 250) {
      toast({
        variant: "error",
        title: "Peso inválido",
        description: "Informe um valor entre 35 e 250 kg.",
      });
      return;
    }
    add(kg);
    setValue("");
    toast({ variant: "success", title: "Peso registrado 📈", description: `${kg} kg hoje.` });
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-brl-card p-6 md:p-8">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h3 className="flex items-center gap-2 font-display text-lg font-bold">
          <ScaleIcon className="size-4 text-brl-purple" />
          Seu peso
        </h3>
        {points.length > 1 && delta !== 0 ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-sm font-medium tabular-nums",
              lost ? "text-emerald-400" : "text-brl-orange",
            )}
          >
            {lost ? (
              <TrendingDownIcon className="size-4" />
            ) : (
              <TrendingUpIcon className="size-4" />
            )}
            {lost ? "" : "+"}
            {delta} kg
          </span>
        ) : null}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="font-display text-3xl font-bold tabular-nums text-foreground">
          {current}
        </span>
        <span className="text-sm text-muted-foreground">kg hoje</span>
      </div>

      {/* Meta de peso */}
      {hasGoal ? (
        <div className="mt-4">
          <div className="flex items-baseline justify-between text-xs tabular-nums">
            <span className="text-muted-foreground">Início {start} kg</span>
            <span className="font-semibold text-emerald-400">Meta {goal} kg</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-emerald-400 transition-[width] duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {reached ? (
              "Meta atingida! 🎯"
            ) : (
              <>
                faltam{" "}
                <span className="font-medium text-foreground">
                  {remaining.toFixed(1).replace(/\.0$/, "")} kg
                </span>
                {weeks
                  ? ` · ~${weeks} ${weeks === 1 ? "semana" : "semanas"} no ritmo atual`
                  : ""}
              </>
            )}
          </p>
        </div>
      ) : null}

      <div className="mt-4">
        <WeightChart points={points} goalKg={hasGoal ? goal : undefined} />
        {points.length > 1 ? (
          <div className="mt-1 flex justify-between text-xs text-muted-foreground tabular-nums">
            <span>{start} kg</span>
            <span>{current} kg</span>
          </div>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">
            Registre seu peso alguns dias pra ver a evolução.
          </p>
        )}
      </div>

      <div className="mt-5 flex items-end gap-3">
        <div className="flex-1">
          <label htmlFor="weight-input" className="sr-only">
            Peso de hoje em kg
          </label>
          <div className="relative">
            <Input
              id="weight-input"
              type="number"
              inputMode="decimal"
              step="0.1"
              placeholder={String(current)}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAdd();
                }
              }}
              className="h-11 pr-10"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
              kg
            </span>
          </div>
        </div>
        <Button
          type="button"
          onClick={handleAdd}
          className="h-11 bg-brl-purple px-5 text-white hover:bg-brl-purple/90"
        >
          Registrar
        </Button>
      </div>
    </div>
  );
}
