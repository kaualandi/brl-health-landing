/** Regras puras do progresso do Fit: semanas (seg–dom), sequência, recordes e e1RM. */

export type SessionRow = { date: string; volume: number; seconds: number };
export type SetRow = { exerciseId: string; name: string; date: string; sessionId: number; weightKg: number; reps: number };

const DAY = 86_400_000;
const WEEKS = 8;
const utc = (d: string) => Date.parse(`${d}T00:00:00Z`);
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const round = (n: number) => Math.round(n * 100) / 100;

/** Segunda-feira (YYYY-MM-DD) da semana de `date`. */
export const weekStart = (date: string) => iso(utc(date) - ((new Date(utc(date)).getUTCDay() + 6) % 7) * DAY);

const MAX_E1RM_REPS = 12;

/** Epley: carga × (1 + reps/30); 1 rep = a própria carga; acima de 12 reps não estima (null). */
export const e1rm = (kg: number, reps: number) => (reps > MAX_E1RM_REPS ? null : round(reps <= 1 ? kg : kg * (1 + reps / 30)));

/** Últimas 8 semanas (a atual por último), com zeros nas vazias. */
export function buildWeeks(rows: SessionRow[], todayStr: string) {
  const thisWeek = utc(weekStart(todayStr));
  const weeks = Array.from({ length: WEEKS }, (_, i) => ({ start: iso(thisWeek - (WEEKS - 1 - i) * 7 * DAY), sessions: 0, volume: 0 }));
  const byStart = new Map(weeks.map((w) => [w.start, w]));
  for (const r of rows) {
    const w = byStart.get(weekStart(r.date));
    if (w) {
      w.sessions += 1;
      w.volume = round(w.volume + r.volume);
    }
  }
  return weeks;
}

/** Sequência em semanas consecutivas com ≥1 treino; a atual só quebra se a semana passada também ficou vazia. */
export function computeStreak(dates: string[], todayStr: string) {
  const weeks = [...new Set(dates.map((d) => utc(weekStart(d))))].sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  weeks.forEach((w, i) => {
    run = i > 0 && w - weeks[i - 1] === 7 * DAY ? run + 1 : 1;
    best = Math.max(best, run);
  });
  const last = weeks[weeks.length - 1];
  const gap = last === undefined ? Infinity : (utc(weekStart(todayStr)) - last) / (7 * DAY);
  return { current: gap <= 1 ? run : 0, best };
}

export function computeTotals(rows: SessionRow[]) {
  return {
    sessions: rows.length,
    volume: round(rows.reduce((s, r) => s + r.volume, 0)),
    minutes: Math.round(rows.reduce((s, r) => s + r.seconds, 0) / 60),
  };
}

type Best = { kg: number; date: string };
const better = (cur: Best | undefined, kg: number, date: string): Best => (!cur || kg > cur.kg || (kg === cur.kg && date < cur.date) ? { kg, date } : cur);

/** Recorde por exercício; `broken` = melhor carga veio depois da 1ª sessão do exercício. */
export function computeRecords(sets: SetRow[]) {
  const by = new Map<string, { name: string; weight?: Best; volume?: Best; e1?: Best; firstDate: string }>();
  for (const s of sets) {
    const r = by.get(s.exerciseId) ?? { name: s.name, firstDate: s.date };
    r.firstDate = s.date < r.firstDate ? s.date : r.firstDate;
    r.weight = better(r.weight, s.weightKg, s.date);
    r.volume = better(r.volume, round(s.weightKg * s.reps), s.date);
    const e = e1rm(s.weightKg, s.reps);
    if (e !== null) r.e1 = better(r.e1, e, s.date);
    by.set(s.exerciseId, r);
  }
  return [...by].map(([exerciseId, r]) => ({
    exerciseId,
    name: r.name,
    maxWeightKg: r.weight!.kg,
    maxWeightDate: r.weight!.date,
    maxSetVolumeKg: r.volume!.kg,
    maxSetVolumeDate: r.volume!.date,
    e1rmKg: r.e1?.kg ?? null,
    e1rmDate: r.e1?.date ?? null,
    broken: r.weight!.date > r.firstDate,
  })).sort((a, b) => (b.e1rmKg ?? 0) - (a.e1rmKg ?? 0) || b.maxWeightKg - a.maxWeightKg);
}

/** Um ponto por dia de treino do exercício: maior carga e melhor e1RM. */
export function computeHistory(sets: SetRow[]) {
  const by = new Map<string, { date: string; maxWeightKg: number; e1rmKg: number | null }>();
  for (const s of sets) {
    const p = by.get(s.date) ?? { date: s.date, maxWeightKg: 0, e1rmKg: null };
    p.maxWeightKg = Math.max(p.maxWeightKg, s.weightKg);
    const e = e1rm(s.weightKg, s.reps);
    if (e !== null) p.e1rmKg = Math.max(p.e1rmKg ?? 0, e);
    by.set(s.date, p);
  }
  return [...by.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** Resposta de GET /fit/stats (sem `recordsBroken`, que vem dos recordes). */
export function computeStats(rows: SessionRow[], todayStr: string) {
  return {
    weeks: buildWeeks(rows, todayStr),
    streak: computeStreak(rows.map((r) => r.date), todayStr),
    totals: computeTotals(rows),
  };
}
