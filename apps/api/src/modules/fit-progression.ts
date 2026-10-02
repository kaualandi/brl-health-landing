import { and, desc, eq, inArray } from "drizzle-orm";
import { Elysia } from "elysia";
import { db, schema } from "../db";
import { auth } from "../lib/auth";
import { today } from "../lib/date";
import { stepFor, suggest, trainingWeek, type Entry, type Suggestion } from "./fit-progression.rules";

const { fitSessions, fitSessionSets, fitPlanExercises, exercises } = schema;

async function planExercises(userId: number) {
  const rows = await db
    .select({ id: fitPlanExercises.exerciseId, sets: fitPlanExercises.sets, repsMin: fitPlanExercises.repsMin, repsMax: fitPlanExercises.repsMax, equipments: exercises.equipments })
    .from(fitPlanExercises)
    .innerJoin(exercises, eq(exercises.id, fitPlanExercises.exerciseId))
    .where(eq(fitPlanExercises.userId, userId))
    .orderBy(fitPlanExercises.dayIndex, fitPlanExercises.order);
  return [...new Map(rows.map((r) => [r.id, r])).values()];
}

/** Séries feitas por exercício, sessão a sessão (mais recente primeiro). */
async function histories(userId: number, ids: string[]) {
  const rows = ids.length
    ? await db
        .select({ id: fitSessionSets.exerciseId, session: fitSessions.id, date: fitSessions.date, weightKg: fitSessionSets.weightKg, reps: fitSessionSets.reps })
        .from(fitSessionSets)
        .innerJoin(fitSessions, eq(fitSessions.id, fitSessionSets.sessionId))
        .where(and(eq(fitSessions.userId, userId), eq(fitSessionSets.done, true), inArray(fitSessionSets.exerciseId, ids)))
        .orderBy(desc(fitSessions.id))
        // ponytail: teto de 2000 séries; consultar por exercício (2 últimas sessões) se crescer
        .limit(2000)
    : [];
  const out = new Map<string, Map<number, Entry>>();
  for (const r of rows) {
    const bySession = out.get(r.id) ?? new Map<number, Entry>();
    const entry = bySession.get(r.session) ?? { date: r.date, sets: [] };
    entry.sets.push({ weightKg: r.weightKg, reps: r.reps });
    out.set(r.id, bySession.set(r.session, entry));
  }
  return out;
}

export const fitProgressionModule = new Elysia({ prefix: "/fit/progression" }).use(auth).get(
  "/",
  async ({ userId }) => {
    const plan = await planExercises(userId);
    const [dates, hist] = await Promise.all([
      db.selectDistinct({ date: fitSessions.date }).from(fitSessions).where(eq(fitSessions.userId, userId)),
      histories(userId, plan.map((p) => p.id)),
    ]);
    const { week, deload, inDeload } = trainingWeek(dates.map((d) => d.date), today());
    const result: Record<string, Suggestion> = {};
    for (const p of plan) {
      const entries = [...(hist.get(p.id)?.values() ?? [])].filter((e) => !inDeload(e.date));
      result[p.id] = suggest(entries.slice(0, 2), p, stepFor(p.equipments), deload);
    }
    return { deload, week, exercises: result };
  },
  { auth: true },
);
