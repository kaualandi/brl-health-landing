"use client";

import Link from "next/link";
import { BedIcon, FootprintsIcon, TimerIcon } from "lucide-react";
import { useState } from "react";

import { SwapButton } from "@/components/fit/fit-swap";
import { FitUnsynced } from "@/components/fit/fit-unsynced";
import { StartWorkoutButton } from "@/components/fit/fit-start-button";
import { ExerciseGif } from "@/components/fit/exercise-parts";
import { DeloadBanner, NextHint } from "@/components/fit/fit-progression";
import { ProInvite } from "@/components/plan/pro-invite";
import { useFitProgression } from "@/hooks/use-fit-progression";
import type { ProgressionItem } from "@/lib/fit-progression";
import type { FitPlan, FitPlanDay, FitPlanExercise } from "@/lib/fit-plan";
import { sentenceCase } from "@/lib/exercises";
import { cn } from "@/lib/utils";
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
      <p className="text-sm text-muted-foreground">Quer treinar mesmo assim? Escolha um treino acima.</p>
    </div>
  );
}

function ExerciseRow({ day, item, next }: { day: number; item: FitPlanExercise; next?: ProgressionItem }) {
  return (
    <li>
      <div className="flex items-center gap-1">
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
            {next?.reason === "deload" ? next.sets : item.sets}×{item.reps}
          </span>
        </Link>
        <SwapButton day={day} item={item} />
      </div>
      <NextHint item={next} />
    </li>
  );
}

function Workout({ day }: { day: FitPlanDay }) {
  const prog = useFitProgression();
  return (
    <div className="rounded-2xl border border-foreground/10 bg-card p-5 md:p-6">
      <h2 className="font-display text-2xl font-extrabold tracking-tight">{day.name}</h2>
      <p className="mt-1 text-sm text-muted-foreground">Foco: {day.focus.join(" · ")}</p>
      {prog?.locked ? (
        <ProInvite place="fit-progression">
          Progressão automática é Pro: o app sugere a próxima carga e avisa a semana de deload.
        </ProInvite>
      ) : null}
      {prog?.deload ? <DeloadBanner week={prog.week} /> : null}
      <ol className="mt-5 flex flex-col gap-3">
        {day.exercises.map((e) => (
          <ExerciseRow key={e.order} day={day.index} item={e} next={prog?.exercises[e.exercise.id]} />
        ))}
      </ol>
      <StartWorkoutButton day={day.index} />
    </div>
  );
}

const shortName = (d: FitPlanDay) => d.name.split(" — ")[0];

function DayPicker({ plan, scheduled, picked, onPick }: { plan: FitPlan; scheduled: number | null; picked: number | null; onPick: (i: number | null) => void }) {
  const options = [...(scheduled === null ? [{ index: null, label: "Descanso" }] : []), ...plan.days.map((d) => ({ index: d.index, label: shortName(d) }))];
  return (
    <div role="group" aria-label="Escolher treino" className="mb-4 flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.index ?? "rest"}
          type="button"
          aria-pressed={picked === o.index}
          onClick={() => onPick(o.index)}
          className={cn(
            "min-h-11 rounded-xl border px-4 text-sm font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
            picked === o.index ? "border-brl-purple/60 bg-brl-purple/15 text-foreground" : "border-foreground/10 text-muted-foreground hover:border-brl-purple/40",
          )}
        >
          {o.label}
          {o.index === scheduled ? " · hoje" : ""}
        </button>
      ))}
    </div>
  );
}

/** Aba Hoje: começa no treino do dia da semana (0 = domingo) ou descanso; dá pra escolher qualquer treino do plano. */
export function FitToday({ plan, weekday }: { plan: FitPlan; weekday: number }) {
  const scheduled = workoutForWeekday(plan, weekday)?.index ?? null;
  const [picked, setPicked] = useState(scheduled);
  const day = plan.days.find((d) => d.index === picked) ?? null;
  return (
    <section aria-label="Treino de hoje" className="pt-8 md:pt-12">
      <p className="mb-4 text-xs font-medium tracking-wide text-brl-purple uppercase">Hoje</p>
      <FitUnsynced />
      <DayPicker plan={plan} scheduled={scheduled} picked={picked} onPick={setPicked} />
      {day ? <Workout day={day} /> : <Rest />}
    </section>
  );
}
