import type { FitPlanDay } from "@/lib/fit-plan";

export type SessionSet = {
  exerciseId: string;
  exerciseOrder: number;
  setNumber: number;
  weightKg: number | null;
  reps: number;
  done: boolean;
};

/** Descanso em curso: `endsAt` (ms) corre; sem `endsAt` está pausado com `left` segundos. */
export type Rest = { total: number; endsAt: number | null; left: number };

export type ActiveSession = {
  clientId: string;
  dayIndex: number;
  dayName: string;
  startedAt: string;
  sets: SessionSet[];
  restByOrder: Record<number, number>;
  rest: Rest | null;
};

export type SessionPayload = {
  clientId: string;
  dayIndex: number;
  startedAt: string;
  finishedAt: string;
  sets: SessionSet[];
};

export type Loads = Record<string, number>;

const repsMin = (reps: string) => Number.parseInt(reps, 10) || 0;

/** Sessão nova: séries pré-preenchidas com reps = mínimo da faixa e a última carga conhecida. */
export function createSession(day: FitPlanDay, loads: Loads, now: Date, clientId: string): ActiveSession {
  const sets = day.exercises.flatMap((e) =>
    Array.from({ length: e.sets }, (_, i) => ({
      exerciseId: e.exercise.id,
      exerciseOrder: e.order,
      setNumber: i + 1,
      weightKg: loads[e.exercise.id] ?? null,
      reps: repsMin(e.reps),
      done: false,
    })),
  );
  const restByOrder = Object.fromEntries(day.exercises.map((e) => [e.order, e.restSeconds]));
  return { clientId, dayIndex: day.index, dayName: day.name, startedAt: now.toISOString(), sets, restByOrder, rest: null };
}

/** Texto digitado (aceita vírgula) → kg entre 0 e 1000, ou null se vazio/inválido. */
export function parseWeight(text: string): number | null {
  const n = Number.parseFloat(text.replace(",", "."));
  return Number.isFinite(n) ? Math.min(Math.max(n, 0), 1000) : null;
}

export function parseReps(text: string): number {
  const n = Number.parseInt(text, 10);
  return Number.isFinite(n) ? Math.min(Math.max(n, 0), 100) : 0;
}

export function updateSet(s: ActiveSession, order: number, setNumber: number, patch: Partial<SessionSet>): ActiveSession {
  const sets = s.sets.map((x) => (x.exerciseOrder === order && x.setNumber === setNumber ? { ...x, ...patch } : x));
  return { ...s, sets };
}

/** Marca/desmarca a série; ao marcar, inicia o descanso do exercício. */
export function toggleDone(s: ActiveSession, order: number, setNumber: number, now: number): ActiveSession {
  const cur = s.sets.find((x) => x.exerciseOrder === order && x.setNumber === setNumber);
  if (!cur) return s;
  const next = updateSet(s, order, setNumber, { done: !cur.done });
  return cur.done ? next : startRest(next, s.restByOrder[order] ?? 60, now);
}

export const startRest = (s: ActiveSession, seconds: number, now: number): ActiveSession => ({
  ...s,
  rest: { total: seconds, endsAt: now + seconds * 1000, left: seconds },
});

export const restLeft = (r: Rest, now: number) => (r.endsAt === null ? r.left : Math.max(0, Math.ceil((r.endsAt - now) / 1000)));

export function pauseRest(s: ActiveSession, now: number): ActiveSession {
  return s.rest && s.rest.endsAt !== null ? { ...s, rest: { ...s.rest, endsAt: null, left: restLeft(s.rest, now) } } : s;
}

export function resumeRest(s: ActiveSession, now: number): ActiveSession {
  return s.rest && s.rest.endsAt === null ? { ...s, rest: { ...s.rest, endsAt: now + s.rest.left * 1000 } } : s;
}

export const skipRest = (s: ActiveSession): ActiveSession => ({ ...s, rest: null });

export const doneCount = (sets: SessionSet[]) => sets.filter((x) => x.done).length;

/** Σ carga × reps das séries feitas. */
export const volumeKg = (sets: SessionSet[]) =>
  Math.round(sets.reduce((sum, x) => (x.done ? sum + (x.weightKg ?? 0) * x.reps : sum), 0) * 100) / 100;

export const elapsedSeconds = (startedAt: string, now: number) => Math.max(0, Math.round((now - Date.parse(startedAt)) / 1000));

/** finishedAt/startedAt nunca passam de "agora" (relógio do aparelho adiantado). */
export const toPayload = (s: ActiveSession, now: Date): SessionPayload => ({
  clientId: s.clientId,
  dayIndex: s.dayIndex,
  startedAt: new Date(Math.min(Date.parse(s.startedAt), now.getTime())).toISOString(),
  finishedAt: now.toISOString(),
  sets: s.sets,
});

/** Fila de reenvio: entra uma vez por clientId (idempotente) e sai ao sincronizar. */
export const enqueue = (queue: SessionPayload[], p: SessionPayload) =>
  queue.some((q) => q.clientId === p.clientId) ? queue : [...queue, p];

export const dequeue = (queue: SessionPayload[], clientId: string) => queue.filter((q) => q.clientId !== clientId);

/** Última carga por exercício vinda de treinos ainda não sincronizados (sobrepõe o servidor). */
export function overlayLoads(base: Loads, queue: SessionPayload[]): Loads {
  const out = { ...base };
  for (const p of queue)
    for (const x of p.sets) if (x.done && x.weightKg !== null) out[x.exerciseId] = x.weightKg;
  return out;
}

export function formatClock(total: number): string {
  const m = Math.floor(total / 60);
  const h = Math.floor(m / 60);
  const mm = String(m % 60).padStart(h ? 2 : 1, "0");
  const ss = String(total % 60).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function formatVolume(kg: number): string {
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(kg)} kg`;
}
