"use client";

import { ScaleIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useWeightLog, type WeightEntry } from "@/hooks/use-nutri-tracking";
import { cn } from "@/lib/utils";
import type { NutriProfile } from "@/types";

const W = 320;
const H = 96;
const PAD = 10;

function WeightChart({ points }: { points: WeightEntry[] }) {
  const kgs = points.map((p) => p.kg);
  const min = Math.min(...kgs);
  const max = Math.max(...kgs);
  const range = max - min || 1;
  const stepX = points.length > 1 ? (W - PAD * 2) / (points.length - 1) : 0;

  const coords = points.map((p, i) => ({
    x: points.length > 1 ? PAD + i * stepX : W / 2,
    y: PAD + (1 - (p.kg - min) / range) * (H - PAD * 2),
  }));

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

export function WeightCard({ profile }: { profile: NutriProfile }) {
  const { entries, add } = useWeightLog();
  const toast = useToast();
  const [value, setValue] = useState("");

  const baselineDate = (profile.createdAt || "").slice(0, 10) || "0000-00-00";
  const baseline: WeightEntry = { date: baselineDate, kg: profile.weightKg };
  const points: WeightEntry[] = [
    baseline,
    ...entries.filter((e) => e.date !== baseline.date),
  ].sort((a, b) => a.date.localeCompare(b.date));

  const start = points[0].kg;
  const current = points[points.length - 1].kg;
  const delta = Number((current - start).toFixed(1));
  const lost = delta < 0;

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
      <div className="mb-5 flex items-baseline justify-between">
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
        ) : (
          <span className="text-sm text-muted-foreground">
            {entries.length === 0 ? "Registre pra começar" : ""}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="font-display text-3xl font-bold tabular-nums text-foreground">
          {current}
        </span>
        <span className="text-sm text-muted-foreground">kg hoje</span>
      </div>

      <div className="mt-3">
        <WeightChart points={points} />
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
