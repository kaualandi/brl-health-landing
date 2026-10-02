import Link from "next/link";
import { BedIcon, FootprintsIcon, TimerIcon } from "lucide-react";

import { SwapButton } from "@/components/fit/fit-swap";
import { FitUnsynced } from "@/components/fit/fit-unsynced";
import { StartWorkoutButton } from "@/components/fit/fit-start-button";
import { ExerciseGif } from "@/components/fit/exercise-parts";
import type { FitPlan, FitPlanDay, FitPlanExercise } from "@/lib/fit-plan";
import { sentenceCase } from "@/lib/exercises";
import { workoutForWeekday } from "@/lib/fit-week";

function Rest() {
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-foreground/10 bg-card p-6 md:p-8">
      <span className="grid size-12 place-items-center rounded-xl bg-brl-purple/15 text-brl-purple">
        <BedIcon aria-hidden className="size-6" />
      </span>
      <h2 className="font-display text-2xl font-extrabold tracking-tight">Dia de descanso</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        É no descanso que o músculo se recupera e cresce. Capriche no sono e na água.
      </p>
      <p className="flex items-center gap-2 text-sm">
        <FootprintsIcon aria-hidden className="size-4 text-brl-orange" /> Que tal uma caminhada leve ou um alongamento de 10 minutos?
      </p>
    </div>
  );
}

function ExerciseRow({ day, item }: { day: number; item: FitPlanExercise }) {
  return (
    <li className="flex items-center gap-1">
      <Link
        href={`/fit/exercicios/${item.exercise.id}?aba=hoje`}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-foreground/5 p-2 outline-none transition-colors hover:border-brl-purple/50 focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ExerciseGif src={item.exercise.gifUrl} name={item.exercise.name} className="size-16 w-16 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{sentenceCase(item.exercise.name)}</span>
          <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <TimerIcon aria-hidden className="size-3.5" /> Descanso de {item.restSeconds}s
          </span>
        </span>
        <span className="shrink-0 text-sm font-bold tabular-nums text-brl-purple">
          {item.sets}×{item.reps}
        </span>
      </Link>
      <SwapButton day={day} item={item} />
    </li>
  );
}

function Workout({ day }: { day: FitPlanDay }) {
  return (
    <div className="rounded-2xl border border-foreground/10 bg-card p-5 md:p-6">
      <h2 className="font-display text-2xl font-extrabold tracking-tight">{day.name}</h2>
      <p className="mt-1 text-sm text-muted-foreground">Foco: {day.focus.join(" · ")}</p>
      <ol className="mt-5 flex flex-col gap-3">
        {day.exercises.map((e) => (
          <ExerciseRow key={e.order} day={day.index} item={e} />
        ))}
      </ol>
      <StartWorkoutButton />
    </div>
  );
}

/** Aba Hoje: o treino mapeado pro dia da semana (0 = domingo) ou descanso. */
export function FitToday({ plan, weekday }: { plan: FitPlan; weekday: number }) {
  const day = workoutForWeekday(plan, weekday);
  return (
    <section aria-label="Treino de hoje" className="pt-8 md:pt-12">
      <p className="mb-4 text-xs font-medium tracking-wide text-brl-purple uppercase">Hoje</p>
      <FitUnsynced />
      {day ? <Workout day={day} /> : <Rest />}
    </section>
  );
}
