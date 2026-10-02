import { CheckIcon } from "lucide-react";
import { useState } from "react";

import { ExerciseGif } from "@/components/fit/exercise-parts";
import { Input } from "@/components/ui/input";
import { sentenceCase } from "@/lib/exercises";
import { parseReps, parseWeight, weightText, type SessionSet, type SnapshotExercise } from "@/lib/fit-session";
import { cn } from "@/lib/utils";

type SetRowProps = {
  set: SessionSet;
  onChange: (patch: Partial<SessionSet>) => void;
  onToggle: () => void;
};

const COLS = "grid grid-cols-[2rem_1fr_1fr_3rem]";

function DoneButton({ set, onToggle }: { set: SessionSet; onToggle: () => void }) {
  const done = set.done;
  return (
    <button
      type="button"
      aria-pressed={done}
      aria-label={`${done ? "Desmarcar" : "Marcar"} série ${set.setNumber} como feita`}
      onClick={onToggle}
      className={cn(
        "grid size-11 place-items-center justify-self-center rounded-xl border outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
        done ? "border-brl-purple bg-brl-purple text-white" : "border-foreground/15 text-muted-foreground hover:border-brl-purple/60",
      )}
    >
      <CheckIcon aria-hidden className="size-5" />
    </button>
  );
}

type FieldProps = { label: string; placeholder: string; mode: "decimal" | "numeric"; initial: string; onValue: (v: string) => void };

function Field({ label, placeholder, mode, initial, onValue }: FieldProps) {
  const [start] = useState(initial);
  return (
    <Input
      inputMode={mode}
      aria-label={label}
      placeholder={placeholder}
      defaultValue={start}
      onChange={(e) => onValue(e.target.value)}
      className="h-11 text-center text-base font-semibold"
    />
  );
}

function SetRow({ set, onChange, onToggle }: SetRowProps) {
  const n = set.setNumber;
  return (
    <li className={cn(COLS, "items-center gap-2 rounded-xl p-1.5", set.done && "bg-brl-purple/10")}>
      <span className="text-center text-sm font-bold text-muted-foreground tabular-nums">{n}</span>
      <Field label={`Carga em kg, série ${n}`} placeholder="kg" mode="decimal" initial={weightText(set.weightKg)} onValue={(v) => onChange({ weightKg: parseWeight(v) })} />
      <Field label={`Repetições, série ${n}`} placeholder="reps" mode="numeric" initial={String(set.reps)} onValue={(v) => onChange({ reps: parseReps(v) })} />
      <DoneButton set={set} onToggle={onToggle} />
    </li>
  );
}

type CardProps = {
  item: SnapshotExercise;
  sets: SessionSet[];
  onChange: (setNumber: number, patch: Partial<SessionSet>) => void;
  onToggle: (setNumber: number) => void;
};

function CardHead({ item }: { item: SnapshotExercise }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <ExerciseGif src={item.gifUrl} name={item.name} className="size-14 w-14 shrink-0" />
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold">{sentenceCase(item.name)}</h3>
        <p className="text-xs text-muted-foreground">
          {item.sets}×{item.reps} · descanso {item.restSeconds}s
        </p>
      </div>
    </div>
  );
}

export function ExerciseCard({ item, sets, onChange, onToggle }: CardProps) {
  return (
    <section aria-label={item.name} className="rounded-2xl border border-foreground/10 bg-card p-4">
      <CardHead item={item} />
      <div className={cn(COLS, "mb-1 gap-2 text-center text-[0.7rem] font-medium text-muted-foreground uppercase")}>
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
