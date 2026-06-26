"use client";

import { FootprintsIcon, MoonIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useSleep, useSteps } from "@/hooks/use-health";
import { lastNDays, todayKey } from "@/lib/health-store";
import { cn } from "@/lib/utils";

const WEEKDAY_INITIAL = ["D", "S", "T", "Q", "Q", "S", "S"];

function WeekBars({
  values,
  color,
}: {
  values: { date: string; value: number }[];
  color: string;
}) {
  const max = Math.max(1, ...values.map((v) => v.value));
  const today = todayKey();

  return (
    <div className="flex items-end justify-between gap-1.5">
      {values.map((v) => {
        const pct = v.value > 0 ? Math.max(8, (v.value / max) * 100) : 0;
        const isToday = v.date === today;
        const weekday = new Date(`${v.date}T00:00:00`).getDay();
        return (
          <div key={v.date} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex h-16 w-full items-end overflow-hidden rounded-md bg-white/5">
              <div
                className={cn(
                  "w-full rounded-md transition-[height] duration-500",
                  isToday ? color : "bg-white/15",
                )}
                style={{ height: `${pct}%` }}
              />
            </div>
            <span
              className={cn(
                "text-[0.65rem] tabular-nums",
                isToday
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {WEEKDAY_INITIAL[weekday]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const SLEEP_GOAL = 8;

export function SleepCard() {
  const { entries, record } = useSleep();
  const toast = useToast();
  const [value, setValue] = useState("");

  const today = entries.find((e) => e.date === todayKey());
  const week = lastNDays(7).map((date) => ({
    date,
    value: entries.find((e) => e.date === date)?.hours ?? 0,
  }));

  function save(hours: number) {
    if (!hours || hours <= 0 || hours > 16) {
      toast({
        variant: "error",
        title: "Horas inválidas",
        description: "Informe entre 0 e 16 h.",
      });
      return;
    }
    record(hours);
    setValue("");
    toast({
      variant: "success",
      title: "Sono registrado 😴",
      description: `${hours} h na última noite.`,
    });
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-brl-card p-6 md:p-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-display text-lg font-bold">
          <MoonIcon className="size-4 text-indigo-400" />
          Sono
        </h3>
        <span className="text-xs text-muted-foreground">Meta {SLEEP_GOAL}h</span>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="font-display text-3xl font-bold tabular-nums text-foreground">
          {today ? today.hours : "—"}
        </span>
        <span className="text-sm text-muted-foreground">
          {today ? "h na última noite" : "sem registro hoje"}
        </span>
      </div>

      <div className="mt-5">
        <WeekBars values={week} color="bg-indigo-400" />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {[6, 7, 8].map((h) => (
          <Button
            key={h}
            type="button"
            variant="outline"
            onClick={() => save(h)}
            className="h-9 border-indigo-400/30 bg-indigo-400/10 px-3 text-indigo-300 hover:bg-indigo-400/20"
          >
            {h}h
          </Button>
        ))}
        <div className="relative ml-auto w-28">
          <Input
            type="number"
            inputMode="decimal"
            step="0.5"
            placeholder="Outro"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                save(Number(value.replace(",", ".")));
              }
            }}
            className="h-9 pr-8"
          />
          <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-xs text-muted-foreground">
            h
          </span>
        </div>
      </div>
    </div>
  );
}

const STEPS_GOAL = 8000;
const KCAL_PER_STEP = 0.04;

export function StepsCard() {
  const { entries, add } = useSteps();

  const today = entries.find((e) => e.date === todayKey())?.count ?? 0;
  const pct = Math.min(100, Math.round((today / STEPS_GOAL) * 100));
  const reached = today >= STEPS_GOAL;
  const kcal = Math.round(today * KCAL_PER_STEP);
  const week = lastNDays(7).map((date) => ({
    date,
    value: entries.find((e) => e.date === date)?.count ?? 0,
  }));

  return (
    <div className="rounded-2xl border border-white/5 bg-brl-card p-6 md:p-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-display text-lg font-bold">
          <FootprintsIcon className="size-4 text-brl-orange" />
          Passos
        </h3>
        <span className="text-xs text-muted-foreground">
          Meta {STEPS_GOAL.toLocaleString("pt-BR")}
        </span>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="font-display text-3xl font-bold tabular-nums text-foreground">
          {today.toLocaleString("pt-BR")}
        </span>
        <span className="text-sm text-muted-foreground">passos hoje</span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-brl-orange transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        {reached
          ? "Meta do dia batida 🎯"
          : `${pct}% da meta · ~${kcal} kcal queimadas`}
      </p>

      <div className="mt-5">
        <WeekBars values={week} color="bg-brl-orange" />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {[1000, 2000, 5000].map((n) => (
          <Button
            key={n}
            type="button"
            variant="outline"
            onClick={() => add(n)}
            className="h-9 border-brl-orange/30 bg-brl-orange/10 px-3 text-brl-orange hover:bg-brl-orange/20"
          >
            +{n.toLocaleString("pt-BR")}
          </Button>
        ))}
        {today > 0 ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => add(-1000)}
            aria-label="Tirar 1.000 passos"
            className="ml-auto h-9 px-3 text-muted-foreground hover:text-foreground"
          >
            −1.000
          </Button>
        ) : null}
      </div>
    </div>
  );
}
