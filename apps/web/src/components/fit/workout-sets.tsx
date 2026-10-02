import { CheckIcon } from "lucide-react";
import { useState } from "react";

import { ExerciseGif } from "@/components/fit/exercise-parts";
import { Input } from "@/components/ui/input";
import { sentenceCase } from "@/lib/exercises";
import type { FitPlanExercise } from "@/lib/fit-plan";
import { parseReps, parseWeight, type SessionSet } from "@/lib/fit-session";
import { cn } from "@/lib/utils";

type SetRowProps = {
  set: SessionSet;
  onChange: (patch: Partial<SessionSet>) => void;
  onToggle: () => void;
};

function SetRow({ set, onChange, onToggle }: SetRowProps) {
  const label = `série ${set.setNumber}`;
  const [initial] = useState({ weight: set.weightKg ?? "", reps: set.reps });
  return (
    <li className={cn("grid grid-cols-[2rem_1fr_1fr_3rem] items-center gap-2 rounded-xl p-1.5", set.done && "bg-brl-purple/10")}>
      <span className="text-center text-sm font-bold text-muted-foreground tabular-nums">{set.setNumber}</span>
      <Input
        inputMode="decimal"
        aria-label={`Carga em kg, ${label}`}
        placeholder="kg"
        defaultValue={initial.weight}
        onChange={(e) => onChange({ weightKg: parseWeight(e.target.value) })}
        className="h-11 text-center text-base font-semibold"
      />
      <Input
        inputMode="numeric"
        aria-label={`Repetições, ${label}`}
        placeholder="reps"
        defaultValue={initial.reps}
        onChange={(e) => onChange({ reps: parseReps(e.target.value) })}
        className="h-11 text-center text-base font-semibold"
      />
      <button
        type="button"
        aria-pressed={set.done}
        aria-label={`${set.done ? "Desmarcar" : "Marcar"} ${label} como feita`}
        onClick={onToggle}
        className={cn(
          "grid size-11 place-items-center justify-self-center rounded-xl border outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
          set.done ? "border-brl-purple bg-brl-purple text-white" : "border-foreground/15 text-muted-foreground hover:border-brl-purple/60",
        )}
      >
        <CheckIcon aria-hidden className="size-5" />
      </button>
    </li>
  );
}

type CardProps = {
  item: FitPlanExercise;
  sets: SessionSet[];
  onChange: (setNumber: number, patch: Partial<SessionSet>) => void;
  onToggle: (setNumber: number) => void;
};

export function ExerciseCard({ item, sets, onChange, onToggle }: CardProps) {
  return (
    <section aria-label={item.exercise.name} className="rounded-2xl border border-foreground/10 bg-card p-4">
      <div className="mb-3 flex items-center gap-3">
        <ExerciseGif src={item.exercise.gifUrl} name={item.exercise.name} className="size-14 w-14 shrink-0" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold">{sentenceCase(item.exercise.name)}</h3>
          <p className="text-xs text-muted-foreground">
            {item.sets}×{item.reps} · descanso {item.restSeconds}s
          </p>
        </div>
      </div>
      <div className="mb-1 grid grid-cols-[2rem_1fr_1fr_3rem] gap-2 text-center text-[0.7rem] font-medium text-muted-foreground uppercase">
        <span>Sér.</span>
        <span>Carga (kg)</span>
        <span>Reps</span>
        <span>Feita</span>
      </div>
      <ul className="flex flex-col gap-1">
        {sets.map((s) => (
          <SetRow key={s.setNumber} set={s} onChange={(p) => onChange(s.setNumber, p)} onToggle={() => onToggle(s.setNumber)} />
        ))}
      </ul>
    </section>
  );
}
