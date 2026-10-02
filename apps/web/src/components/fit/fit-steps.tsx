"use client";

import { OptionCard } from "@/components/onboarding/option-card";
import {
  DAYS_PER_WEEK,
  FIT_EQUIPMENT_OPTIONS,
  FIT_GOALS,
  FIT_LEVELS,
  FIT_LIMITATION_OPTIONS,
  FIT_LOCATIONS,
  SESSION_MINUTES,
  withLocation,
  type FitForm,
  type FitLimitation,
} from "@/lib/fit-profile";
import { cn } from "@/lib/utils";

export type StepProps = {
  data: FitForm;
  update: <K extends keyof FitForm>(key: K, value: FitForm[K]) => void;
  patch: (changes: Partial<FitForm>) => void;
};

const GRID = "grid grid-cols-1 gap-3 sm:grid-cols-2";

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "min-h-11 min-w-14 rounded-xl border px-4 text-sm font-semibold outline-none transition-colors",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        selected ? "border-brl-purple/60 bg-brl-purple/15 text-foreground" : "border-white/10 text-muted-foreground hover:border-brl-purple/40",
      )}
    >
      {children}
    </button>
  );
}

export function GoalStep({ data, update }: StepProps) {
  return (
    <div className={GRID} role="group" aria-label="Objetivo">
      {FIT_GOALS.map((o) => (
        <OptionCard key={o.value} {...o} selected={data.goal === o.value} onSelect={() => update("goal", o.value)} />
      ))}
    </div>
  );
}

export function LevelStep({ data, update }: StepProps) {
  return (
    <div className="flex flex-col gap-3" role="group" aria-label="Nível">
      {FIT_LEVELS.map((o) => (
        <OptionCard key={o.value} {...o} compact selected={data.level === o.value} onSelect={() => update("level", o.value)} />
      ))}
    </div>
  );
}

export function RoutineStep({ data, update }: StepProps) {
  return (
    <div className="flex flex-col gap-6">
      <fieldset>
        <legend className="mb-3 text-sm font-semibold">Dias de treino por semana</legend>
        <div className="flex flex-wrap gap-2">
          {DAYS_PER_WEEK.map((d) => (
            <Chip key={d} selected={data.daysPerWeek === d} onClick={() => update("daysPerWeek", d)}>
              {`${d}x`}
            </Chip>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-3 text-sm font-semibold">Duração de cada sessão</legend>
        <div className="flex flex-wrap gap-2">
          {SESSION_MINUTES.map((m) => (
            <Chip key={m} selected={data.sessionMinutes === m} onClick={() => update("sessionMinutes", m)}>
              {`${m} min`}
            </Chip>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

export function LocationStep({ data, update, patch }: StepProps) {
  const toggle = (value: string) =>
    update("equipment", data.equipment.includes(value) ? data.equipment.filter((e) => e !== value) : [...data.equipment, value]);
  return (
    <div className="flex flex-col gap-6">
      <div className={GRID} role="group" aria-label="Local de treino">
        {FIT_LOCATIONS.map((o) => (
          <OptionCard
            key={o.value}
            {...o}
            selected={data.location === o.value}
            onSelect={() => {
              const { location, equipment } = withLocation(data, o.value);
              patch({ location, equipment });
            }}
          />
        ))}
      </div>
      {data.location ? (
        <fieldset>
          <legend className="mb-3 text-sm font-semibold">Equipamentos disponíveis</legend>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {FIT_EQUIPMENT_OPTIONS.map((o) => (
              <OptionCard key={o.value} emoji={o.emoji} label={o.label} selected={data.equipment.includes(o.value)} onSelect={() => toggle(o.value)} />
            ))}
          </div>
        </fieldset>
      ) : null}
    </div>
  );
}

export function LimitationsStep({ data, update }: StepProps) {
  const toggle = (value: FitLimitation) => {
    if (value === "none") return update("limitations", data.limitations.includes("none") ? [] : ["none"]);
    const rest = data.limitations.filter((l) => l !== "none");
    update("limitations", rest.includes(value) ? rest.filter((l) => l !== value) : [...rest, value]);
  };
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" role="group" aria-label="Limitações">
      {FIT_LIMITATION_OPTIONS.map((o) => (
        <OptionCard key={o.value} emoji={o.emoji} label={o.label} selected={data.limitations.includes(o.value)} onSelect={() => toggle(o.value)} />
      ))}
    </div>
  );
}
