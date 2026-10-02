/**
 * Progressão por exercício (histórico + faixa prescrita): topo da faixa em todas as séries => +carga
 * (+2,5 kg; +1 kg halter/kettlebell; sem carga => +1 rep); dentro da faixa => mantém e +1 rep;
 * abaixo do mínimo em 2 sessões seguidas => -10%. Toda 5ª semana de treino consecutiva é deload (carga x0,6, -1 série).
 */
export type SetLog = { weightKg: number | null; reps: number };
export type Entry = { date: string; sets: SetLog[] };
export type Rx = { sets: number; repsMin: number; repsMax: number };
export type Reason = "up" | "hold" | "down" | "deload" | "new";
export type Suggestion = { weightKg: number | null; reps: number; sets: number; reason: Reason };

const DELOAD_EVERY = 5;
const weekOf = (date: string) => {
  const days = Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
  return (days - ((days + 3) % 7)) / 7;
};

/** Semana de treino atual (1 = primeira após uma pausa) e quais semanas passadas foram de deload. */
export function trainingWeek(dates: string[], now: string) {
  const weeks = new Set(dates.map(weekOf));
  const cur = weekOf(now);
  let prior = 0;
  while (weeks.has(cur - 1 - prior)) prior++;
  const week = prior + 1;
  const isDeload = (n: number) => n % DELOAD_EVERY === 0;
  const inDeload = (date: string) => {
    const back = cur - weekOf(date);
    return back <= prior && isDeload(week - back);
  };
  return { week, deload: isDeload(week), inDeload };
}

export const stepFor = (equipments: string[]) => (equipments.some((e) => /dumbbell|kettlebell/i.test(e)) ? 1 : 2.5);
const round = (kg: number, step: number) => Math.round(kg / step) * step;
const workingKg = (sets: SetLog[]) => Math.max(0, ...sets.map((s) => s.weightKg ?? 0));
const minReps = (sets: SetLog[]) => Math.min(...sets.map((s) => s.reps));
const failed = (e: Entry, rx: Rx) => e.sets.length > 0 && minReps(e.sets) < rx.repsMin;

/** `history`: sessões em que o exercício teve séries feitas, da mais recente à mais antiga. */
export function suggest(history: Entry[], rx: Rx, step: number, deload: boolean): Suggestion {
  const [last, prev] = history;
  if (!last || !last.sets.length) return { weightKg: null, reps: rx.repsMin, sets: rx.sets, reason: "new" };
  const kg = workingKg(last.sets);
  const loaded = kg > 0;
  if (deload) return { weightKg: loaded ? Math.max(step, round(kg * 0.6, step)) : null, reps: rx.repsMin, sets: Math.max(1, rx.sets - 1), reason: "deload" };
  const base = { sets: rx.sets };
  if (prev && failed(last, rx) && failed(prev, rx))
    return { ...base, weightKg: loaded ? Math.max(step, Math.min(kg - step, round(kg * 0.9, step))) : null, reps: rx.repsMin, reason: "down" };
  const top = last.sets.length >= rx.sets && minReps(last.sets) >= rx.repsMax;
  if (top) return loaded ? { ...base, weightKg: kg + step, reps: rx.repsMin, reason: "up" } : { ...base, weightKg: null, reps: minReps(last.sets) + 1, reason: "up" };
  const reps = failed(last, rx) ? rx.repsMin : Math.min(minReps(last.sets) + 1, rx.repsMax);
  return { ...base, weightKg: loaded ? kg : null, reps, reason: "hold" };
}
