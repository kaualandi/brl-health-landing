import { DumbbellIcon, TimerIcon } from "lucide-react";

import { SwapButton } from "@/components/fit/fit-swap";
import { sentenceCase } from "@/lib/exercises";
import type { FitPlan, FitPlanDay } from "@/lib/fit-plan";

function DayCard({ day, swappable }: { day: FitPlanDay; swappable?: boolean }) {
  return (
    <li className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
      <h3 className="font-display text-base font-bold">{day.name}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{day.focus.join(" · ")}</p>
      <ol className="mt-3 flex flex-col gap-2">
        {day.exercises.map((e) => (
          <li key={e.order} className="flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0">{sentenceCase(e.exercise.name)}</span>
            <span className="flex shrink-0 items-center gap-1">
              <span className="font-medium tabular-nums text-brl-purple">
                {e.sets}×{e.reps}
              </span>
              {swappable ? <SwapButton day={day.index} item={e} /> : null}
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <TimerIcon aria-hidden className="size-3.5" /> Descanso de {day.exercises[0]?.restSeconds ?? 0}s entre séries
      </p>
    </li>
  );
}

/** Prévia da semana: um card por dia; `swappable` (só no app) habilita a troca. */
export function FitPlanPreview({ plan, swappable }: { plan: FitPlan; swappable?: boolean }) {
  return (
    <section aria-label="Prévia da semana" className="flex flex-col gap-4">
      <p className="flex items-center gap-2 text-sm font-medium">
        <DumbbellIcon aria-hidden className="size-4 text-brl-purple" /> Divisão: {plan.split}
      </p>
      <ul className="grid gap-3 md:grid-cols-2">
        {plan.days.map((d) => (
          <DayCard key={d.index} day={d} swappable={swappable} />
        ))}
      </ul>
    </section>
  );
}
