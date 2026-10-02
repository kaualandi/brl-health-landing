import { and, eq, gt, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db, schema } from "../db";
import { auth } from "../lib/auth";
import { today } from "../lib/date";
import { computeHistory, computeRecords, computeStats, type SetRow } from "./fit-stats.rules";

const { fitSessions, fitSessionSets, exercises } = schema;

const sessionRows = (userId: number) =>
  db
    .select({
      date: fitSessions.date,
      seconds: sql<number>`coalesce(${fitSessions.durationSeconds}, 0)::int`,
      volume: sql<number>`coalesce(sum(${fitSessionSets.weightKg} * ${fitSessionSets.reps}) filter (where ${fitSessionSets.done}), 0)::float8`,
    })
    .from(fitSessions)
    .leftJoin(fitSessionSets, eq(fitSessionSets.sessionId, fitSessions.id))
    .where(eq(fitSessions.userId, userId))
    .groupBy(fitSessions.id);

/** Séries feitas com carga (> 0) do usuário, opcionalmente de um só exercício. */
// ponytail: agrega em memória todas as séries do usuário; se crescer, agregar em SQL ou cachear.
async function setRows(userId: number, exerciseId?: string): Promise<SetRow[]> {
  const rows = await db
    .select({
      exerciseId: fitSessionSets.exerciseId,
      name: sql<string>`coalesce(${exercises.namePt}, ${exercises.name})`,
      date: fitSessions.date,
      sessionId: fitSessions.id,
      weightKg: fitSessionSets.weightKg,
      reps: fitSessionSets.reps,
    })
    .from(fitSessionSets)
    .innerJoin(fitSessions, eq(fitSessions.id, fitSessionSets.sessionId))
    .innerJoin(exercises, eq(exercises.id, fitSessionSets.exerciseId))
    .where(and(eq(fitSessions.userId, userId), eq(fitSessionSets.done, true), gt(fitSessionSets.weightKg, 0), gt(fitSessionSets.reps, 0), exerciseId ? eq(fitSessionSets.exerciseId, exerciseId) : undefined));
  return rows as SetRow[];
}

export const fitStatsModule = new Elysia({ prefix: "/fit" })
  .use(auth)
  .get(
    "/stats",
    async ({ userId }) => {
      const [rows, sets] = await Promise.all([sessionRows(userId), setRows(userId)]);
      const recordsBroken = computeRecords(sets).filter((r) => r.broken).length;
      return { ...computeStats(rows, today()), recordsBroken };
    },
    { auth: true },
  )
  .get("/records", async ({ userId }) => computeRecords(await setRows(userId)).map(({ broken: _, ...r }) => r), { auth: true })
  .get(
    "/exercises/:id/history",
    async ({ userId, params }) => {
      const sets = await setRows(userId, params.id);
      return { exerciseId: params.id, name: sets[0]?.name ?? "", points: computeHistory(sets).slice(-30) };
    },
    { auth: true, params: t.Object({ id: t.String({ minLength: 1 }) }) },
  );
