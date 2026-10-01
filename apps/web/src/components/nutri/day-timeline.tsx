"use client";

import { useEffect, useState } from "react";

import { MEAL_OPTIONS } from "@/lib/meals";
import { cn } from "@/lib/utils";
import type { NutriPlan, NutriProfile } from "@/types";

const EMOJI_BY_MEAL = new Map(MEAL_OPTIONS.map((m) => [m.name, m.emoji]));

type EventKind = "wake" | "meal" | "train" | "sleep" | "now";

type TimelineEvent = {
  key: string;
  kind: EventKind;
  /** Minutos do dia ajustados (madrugada vira +1440 pra ordenar no fim). */
  mins: number;
  time: string;
  label: string;
  emoji?: string;
  kcal?: number;
};

function parseMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(Math.max(n, lo), hi);
}

const DOT_CLASS: Record<EventKind, string> = {
  wake: "bg-amber-400/80",
  meal: "bg-brl-purple",
  train: "bg-brl-orange",
  sleep: "bg-indigo-400/80",
  now: "bg-emerald-400",
};

/**
 * Régua visual do dia: as refeições (e as âncoras de acordar/treino/dormir)
 * posicionadas por horário, com o espaço entre elas proporcional ao intervalo
 * real. Marca "agora" e destaca a próxima refeição.
 */
export function DayTimeline({
  plan,
  profile,
}: {
  plan: NutriPlan;
  profile: NutriProfile;
}) {
  const [nowMin, setNowMin] = useState<number | null>(null);

  // "Agora" só no client (evita mismatch de hidratação) e atualiza a cada minuto.
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setNowMin(now.getHours() * 60 + now.getMinutes());
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  const timedMeals = plan.meals.filter((m) => Boolean(m.time));
  if (timedMeals.length < 2) return null;

  const dayStart = profile.wakeTime
    ? parseMinutes(profile.wakeTime)
    : Math.min(...timedMeals.map((m) => parseMinutes(m.time!)));

  const adjust = (time: string): number => {
    const raw = parseMinutes(time);
    return raw < dayStart - 1 ? raw + 1440 : raw;
  };

  const events: TimelineEvent[] = [];
  if (profile.wakeTime) {
    events.push({
      key: "wake",
      kind: "wake",
      mins: adjust(profile.wakeTime),
      time: profile.wakeTime,
      label: "Acordar",
      emoji: "☀️",
    });
  }
  for (const meal of timedMeals) {
    events.push({
      key: `meal-${meal.name}`,
      kind: "meal",
      mins: adjust(meal.time!),
      time: meal.time!,
      label: meal.name,
      emoji: EMOJI_BY_MEAL.get(meal.name) ?? "🍽️",
      kcal: meal.kcal,
    });
  }
  if (profile.trainTime) {
    events.push({
      key: "train",
      kind: "train",
      mins: adjust(profile.trainTime),
      time: profile.trainTime,
      label: "Treino",
      emoji: "🏋️",
    });
  }
  if (profile.sleepTime) {
    events.push({
      key: "sleep",
      kind: "sleep",
      mins: adjust(profile.sleepTime),
      time: profile.sleepTime,
      label: "Dormir",
      emoji: "🌙",
    });
  }

  events.sort((a, b) => a.mins - b.mins);

  const firstMin = events[0].mins;
  const lastMin = events[events.length - 1].mins;

  const nowAdj =
    nowMin == null ? null : nowMin < dayStart ? nowMin + 1440 : nowMin;
  const showNow = nowAdj != null && nowAdj >= firstMin && nowAdj <= lastMin;
  const nextMealKey =
    nowAdj == null
      ? null
      : (events.find((e) => e.kind === "meal" && e.mins >= nowAdj)?.key ?? null);

  const rows: TimelineEvent[] = [...events];
  if (showNow && nowAdj != null) {
    rows.push({
      key: "now",
      kind: "now",
      mins: nowAdj,
      time: `${String(Math.floor((nowAdj % 1440) / 60)).padStart(2, "0")}:${String(nowAdj % 60).padStart(2, "0")}`,
      label: "Agora",
    });
    rows.sort((a, b) => a.mins - b.mins || (a.kind === "now" ? -1 : 1));
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-brl-card p-6 md:p-8">
      <div className="mb-6">
        <h3 className="flex items-center gap-2 font-display text-lg font-bold">
          <span aria-hidden>🕒</span> Linha do tempo do dia
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Suas refeições encaixadas na sua rotina.
        </p>
      </div>

      <div className="relative pl-6">
        <div
          aria-hidden
          className="absolute top-1.5 bottom-1.5 left-[7px] w-px bg-white/10"
        />
        {rows.map((event, i) => {
          const gap = i === 0 ? 0 : event.mins - rows[i - 1].mins;
          const marginTop = i === 0 ? 0 : clamp(Math.round(gap * 0.7), 14, 72);

          if (event.kind === "now") {
            return (
              <div
                key={event.key}
                className="relative flex items-center gap-2"
                style={{ marginTop }}
              >
                <span
                  aria-hidden
                  className="absolute top-1/2 -left-6 size-3.5 -translate-y-1/2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20"
                />
                <span aria-hidden className="h-px flex-1 bg-emerald-400/30" />
                <span className="text-xs font-semibold tabular-nums text-emerald-400">
                  Agora · {event.time}
                </span>
              </div>
            );
          }

          const isPast = nowAdj != null && event.mins < nowAdj;
          const isNext = event.key === nextMealKey;
          const isMeal = event.kind === "meal";

          return (
            <div
              key={event.key}
              className={cn("relative", isPast && "opacity-45")}
              style={{ marginTop }}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute top-1 -left-6 size-3.5 rounded-full border-2 border-brl-card",
                  DOT_CLASS[event.kind],
                  isNext && "ring-2 ring-brl-purple/50",
                )}
              />
              <div className="flex items-baseline gap-2">
                <span className="w-11 shrink-0 text-xs tabular-nums text-muted-foreground">
                  {event.time}
                </span>
                <p
                  className={cn(
                    "min-w-0 flex-1 text-sm font-medium",
                    isMeal ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  <span aria-hidden className="mr-1">
                    {event.emoji}
                  </span>
                  {event.label}
                  {isNext ? (
                    <span className="ml-2 rounded-full bg-brl-purple/15 px-2 py-0.5 align-middle text-[10px] font-semibold text-brl-purple">
                      próxima
                    </span>
                  ) : null}
                </p>
                {event.kcal != null ? (
                  <span className="shrink-0 font-display text-sm font-bold tabular-nums text-foreground">
                    {event.kcal}
                    <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                      kcal
                    </span>
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
