import { and, asc, desc, eq, isNotNull, lt, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db, schema } from "../db";
import { auth } from "../lib/auth";
import { today } from "../lib/date";

const { fitSessions, fitSessionSets, fitPlanDays, fitPlanExercises, exercises } = schema;

const MAX_SETS = 60;
const MAX_SESSION_SECONDS = 24 * 3600;
const FUTURE_TOLERANCE_MS = 60 * 60_000;

const setSchema = t.Object({
  exerciseId: t.String({ minLength: 1, error: "Exercício inválido" }),
  exerciseOrder: t.Integer({ minimum: 1, maximum: 100, error: "Ordem do exercício inválida" }),
  setNumber: t.Integer({ minimum: 1, maximum: 50, error: "Número da série inválido" }),
  weightKg: t.Union([t.Null(), t.Number({ minimum: 0, maximum: 1000 })], { error: "Carga deve estar entre 0 e 1000 kg" }),
  reps: t.Integer({ minimum: 0, maximum: 100, error: "Repetições devem estar entre 0 e 100" }),
  done: t.Boolean({ error: "Marcação da série inválida" }),
});

const body = t.Object({
  clientId: t.String({ format: "uuid", error: "Identificador do treino inválido" }),
  dayIndex: t.Integer({ minimum: 0, error: "Dia do treino inválido" }),
  startedAt: t.String({ format: "date-time", error: "Início do treino inválido" }),
  finishedAt: t.String({ format: "date-time", error: "Fim do treino inválido" }),
  sets: t.Array(setSchema, { minItems: 1, maxItems: MAX_SETS, error: `Envie de 1 a ${MAX_SETS} séries` }),
});

type Body = typeof body.static;

const summaryCols = {
  id: fitSessions.id,
  clientId: fitSessions.clientId,
  date: fitSessions.date,
  dayIndex: fitSessions.dayIndex,
  dayName: fitSessions.dayName,
  startedAt: fitSessions.startedAt,
  finishedAt: fitSessions.finishedAt,
  durationSeconds: fitSessions.durationSeconds,
  setsDone: sql<number>`count(*) filter (where ${fitSessionSets.done})::int`,
  volumeKg: sql<number>`coalesce(sum(${fitSessionSets.weightKg} * ${fitSessionSets.reps}) filter (where ${fitSessionSets.done}), 0)::float8`,
};

type Summary = Awaited<ReturnType<typeof summaries>>[number];

const toSummary = (r: Summary) => ({
  ...r,
  id: String(r.id),
  startedAt: r.startedAt.toISOString(),
  finishedAt: r.finishedAt?.toISOString() ?? null,
  volumeKg: Math.round(r.volumeKg * 100) / 100,
});

const summaries = (where: ReturnType<typeof and>, limit = 1) =>
  db
    .select(summaryCols)
    .from(fitSessions)
    .leftJoin(fitSessionSets, eq(fitSessionSets.sessionId, fitSessions.id))
    .where(where)
    .groupBy(fitSessions.id)
    .orderBy(desc(fitSessions.id))
    .limit(limit);

const planErrors = async (userId: number, b: Body) => {
  const [day] = await db.select().from(fitPlanDays).where(and(eq(fitPlanDays.userId, userId), eq(fitPlanDays.dayIndex, b.dayIndex)));
  if (!day) return { errors: ["Esse dia não existe no seu plano de treino."] };
  const planned = await db.select({ id: fitPlanExercises.exerciseId }).from(fitPlanExercises).where(and(eq(fitPlanExercises.userId, userId), eq(fitPlanExercises.dayIndex, b.dayIndex)));
  const ids = new Set(planned.map((p) => p.id));
  if (b.sets.some((s) => !ids.has(s.exerciseId))) return { errors: ["Há exercícios que não fazem parte desse treino."] };
  const keys = b.sets.map((s) => `${s.exerciseOrder}:${s.setNumber}`);
  if (new Set(keys).size !== keys.length) return { errors: ["Há séries repetidas no treino."] };
  return { day };
};

const dateErrors = (b: Body) => {
  const start = Date.parse(b.startedAt);
  const end = Date.parse(b.finishedAt);
  if (end < start) return "O fim do treino não pode ser antes do início.";
  if (end - start > MAX_SESSION_SECONDS * 1000) return "O treino não pode durar mais de 24 horas.";
  if (end > Date.now() + FUTURE_TOLERANCE_MS) return "O fim do treino não pode estar no futuro.";
  return null;
};

async function saveSession(userId: number, b: Body, dayName: string) {
  const startedAt = new Date(b.startedAt);
  const finishedAt = new Date(b.finishedAt);
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`fitsession:${userId}:${b.clientId}`}))`);
    const [dup] = await tx.select({ id: fitSessions.id }).from(fitSessions).where(and(eq(fitSessions.userId, userId), eq(fitSessions.clientId, b.clientId)));
    if (dup) return dup.id;
    const [row] = await tx
      .insert(fitSessions)
      .values({
        userId,
        clientId: b.clientId,
        date: today(finishedAt),
        dayIndex: b.dayIndex,
        dayName,
        startedAt,
        finishedAt,
        durationSeconds: Math.round((finishedAt.getTime() - startedAt.getTime()) / 1000),
      })
      .returning({ id: fitSessions.id });
    await tx.insert(fitSessionSets).values(b.sets.map((s) => ({ ...s, sessionId: row.id })));
    return row.id;
  });
}

async function detail(userId: number, id: number) {
  const [head] = await summaries(and(eq(fitSessions.userId, userId), eq(fitSessions.id, id)));
  if (!head) return null;
  const rows = await db
    .select({ s: fitSessionSets, name: exercises.name, namePt: exercises.namePt })
    .from(fitSessionSets)
    .innerJoin(exercises, eq(exercises.id, fitSessionSets.exerciseId))
    .where(eq(fitSessionSets.sessionId, id))
    .orderBy(asc(fitSessionSets.exerciseOrder), asc(fitSessionSets.setNumber));
  const groups = new Map<number, { exerciseId: string; name: string; order: number; sets: object[] }>();
  for (const { s, name, namePt } of rows) {
    const g = groups.get(s.exerciseOrder) ?? { exerciseId: s.exerciseId, name: namePt ?? name, order: s.exerciseOrder, sets: [] };
    g.sets.push({ setNumber: s.setNumber, weightKg: s.weightKg, reps: s.reps, done: s.done });
    groups.set(s.exerciseOrder, g);
  }
  return { ...toSummary(head), exercises: [...groups.values()] };
}

export const fitSessionsModule = new Elysia({ prefix: "/fit/sessions" })
  .use(auth)
  .post(
    "/",
    async ({ userId, body: b, status }) => {
      const [dup] = await db.select({ id: fitSessions.id }).from(fitSessions).where(and(eq(fitSessions.userId, userId), eq(fitSessions.clientId, b.clientId)));
      if (dup) return (await detail(userId, dup.id))!;
      const bad = dateErrors(b);
      if (bad) return status(400, { errors: [bad] });
      const plan = await planErrors(userId, b);
      if ("errors" in plan) return status(400, plan);
      const id = await saveSession(userId, b, plan.day.name);
      return (await detail(userId, id))!;
    },
    { auth: true, body },
  )
  .get(
    "/",
    async ({ userId, query }) => {
      const where = and(eq(fitSessions.userId, userId), query.before ? lt(fitSessions.id, query.before) : undefined);
      return (await summaries(where, query.limit ?? 30)).map(toSummary);
    },
    {
      auth: true,
      query: t.Object({
        limit: t.Optional(t.Integer({ minimum: 1, maximum: 100, error: "Limite deve estar entre 1 e 100" })),
        before: t.Optional(t.Integer({ minimum: 1, error: "Cursor inválido" })),
      }),
    },
  )
  .get(
    "/last-loads",
    async ({ userId }) => {
      const rows = await db
        .selectDistinctOn([fitSessionSets.exerciseId], { id: fitSessionSets.exerciseId, kg: fitSessionSets.weightKg })
        .from(fitSessionSets)
        .innerJoin(fitSessions, eq(fitSessions.id, fitSessionSets.sessionId))
        .where(and(eq(fitSessions.userId, userId), eq(fitSessionSets.done, true), isNotNull(fitSessionSets.weightKg)))
        .orderBy(fitSessionSets.exerciseId, desc(fitSessions.id), desc(fitSessionSets.setNumber));
      return Object.fromEntries(rows.map((r) => [r.id, r.kg]));
    },
    { auth: true },
  )
  .get(
    "/:id",
    async ({ userId, params, status }) => (await detail(userId, params.id)) ?? status(404, { error: "Treino não encontrado" }),
    { auth: true, params: t.Object({ id: t.Integer({ minimum: 1, error: "Treino inválido" }) }) },
  );
