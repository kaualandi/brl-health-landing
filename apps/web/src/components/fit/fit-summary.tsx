import {
  FIT_EQUIPMENT_OPTIONS,
  FIT_GOALS,
  FIT_LEVELS,
  FIT_LIMITATION_OPTIONS,
  FIT_LOCATIONS,
  labelOf,
  type FitProfile,
} from "@/lib/fit-profile";

export function fitSummaryRows(p: FitProfile): [string, string][] {
  const list = (opts: typeof FIT_EQUIPMENT_OPTIONS, values: string[]) =>
    values.length ? values.map((v) => labelOf(opts, v)).join(", ") : "Nenhuma";
  return [
    ["Objetivo", labelOf(FIT_GOALS, p.goal)],
    ["Nível", labelOf(FIT_LEVELS, p.level)],
    ["Rotina", `${p.daysPerWeek}x por semana, ${p.sessionMinutes} min`],
    ["Local", labelOf(FIT_LOCATIONS, p.location)],
    ["Equipamentos", list(FIT_EQUIPMENT_OPTIONS, p.equipment)],
    ["Limitações", list(FIT_LIMITATION_OPTIONS, p.limitations)],
  ];
}

export function FitSummary({ profile, onEdit }: { profile: FitProfile; onEdit?: (label: string) => void }) {
  return (
    <dl className="divide-y divide-foreground/8 rounded-2xl border border-foreground/8 bg-card">
      {fitSummaryRows(profile).map(([label, value]) => (
        <div key={label} className="flex items-start justify-between gap-4 p-4">
          <div>
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-0.5 text-sm font-semibold">{value}</dd>
          </div>
          {onEdit ? (
            <button
              type="button"
              onClick={() => onEdit(label)}
              aria-label={`Editar ${label}`}
              className="min-h-11 rounded-lg px-3 text-xs font-semibold text-brl-purple outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              Editar
            </button>
          ) : null}
        </div>
      ))}
    </dl>
  );
}
