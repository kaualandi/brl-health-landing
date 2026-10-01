import { and, asc, eq, sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { Elysia, t } from "elysia";
import { db, schema } from "../db";
import { auth } from "../lib/auth";
import { today } from "../lib/date";

const day = t.String({ format: "date", error: "Data inválida (use YYYY-MM-DD)" });
const query = t.Object({ date: t.Optional(day) });
const clamp = (n: number) => Math.max(0, n);
const round1 = (n: number) => Math.round(n * 10) / 10;
const doneMap = t.Record(t.String(), t.Boolean({ error: "Os valores devem ser verdadeiro ou falso" }), { error: "Mapa de itens inválido" });
const limited = (maximum: number, label: string) =>
  t.Number({ maximum, error: `${label} (máximo ${maximum})` });
const INT_MAX = 2147483647;

// a escrita é a mesma nas 3 tabelas; o tipo de uma representa todas
type Table = typeof schema.weightLogs;
type SeriesOpts = {
  path: string;
  table: Table | typeof schema.sleepLogs | typeof schema.stepLogs;
  field: "weightKg" | "hours" | "count";
  col: AnyPgColumn;
  key: string;
  label: string;
  max: number;
  map: (n: number) => number;
};

/** Série histórica (peso/sono/passos): GET asc por data, POST faz upsert do dia e devolve o valor salvo. */
function series({ path, table, field, col, key, label, max, map }: SeriesOpts) {
  const tb = table as Table;
  const bodySchema = t.Object({ [key]: limited(max, label), date: t.Optional(day) });
  return new Elysia({ prefix: `/nutri/${path}` })
    .use(auth)
    .get(
      "/",
      async ({ userId }) => {
        const rows = await db.select({ date: tb.date, v: col }).from(tb).where(eq(tb.userId, userId)).orderBy(asc(tb.date));
        return rows.map((r) => ({ date: r.date, [key]: r.v }));
      },
      { auth: true },
    )
    .post(
      "/",
      async ({ userId, body }) => {
        const date = body.date ?? today();
        const v = map((body as Record<string, number>)[key]);
        const row = { userId, date, [field]: v } as typeof tb.$inferInsert;
        await db.insert(tb).values(row).onConflictDoUpdate({ target: [tb.userId, tb.date], set: { [field]: v } });
        return { date, [key]: v };
      },
      { auth: true, body: bodySchema },
    );
}

/** Mapa do dia (hábitos/diário): GET {} se vazio, POST substitui. */
function doneRoute(path: string, table: typeof schema.habitLogs) {
  return new Elysia({ prefix: `/nutri/${path}` })
    .use(auth)
    .get(
      "/",
      async ({ userId, query: q }) => {
        const [row] = await db.select({ done: table.done }).from(table).where(and(eq(table.userId, userId), eq(table.date, q.date ?? today())));
        return row?.done ?? {};
      },
      { auth: true, query },
    )
    .post(
      "/",
      async ({ userId, body }) => {
        const date = body.date ?? today();
        await db.insert(table).values({ userId, date, done: body.done }).onConflictDoUpdate({ target: [table.userId, table.date], set: { done: body.done } });
        return { saved: true };
      },
      { auth: true, body: t.Object({ done: doneMap, date: t.Optional(day) }) },
    );
}

const water = new Elysia({ prefix: "/nutri/water" })
  .use(auth)
  .get(
    "/",
    async ({ userId, query: q }) => {
      const [row] = await db.select({ ml: schema.waterLogs.ml }).from(schema.waterLogs).where(and(eq(schema.waterLogs.userId, userId), eq(schema.waterLogs.date, q.date ?? today())));
      return { ml: row?.ml ?? 0 };
    },
    { auth: true, query },
  )
  .post(
    "/",
    async ({ userId, body }) => {
      const ml = clamp(Math.round(body.ml));
      const date = body.date ?? today();
      await db.insert(schema.waterLogs).values({ userId, date, ml }).onConflictDoUpdate({ target: [schema.waterLogs.userId, schema.waterLogs.date], set: { ml } });
      return { ml };
    },
    { auth: true, body: t.Object({ ml: limited(INT_MAX, "Quantidade de água inválida"), date: t.Optional(day) }) },
  );

const M = schema.measurements;
const rounded = (o: Record<string, number | undefined>) =>
  Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v === undefined ? v : round1(v)]));
const optNum = t.Optional(t.Number({ minimum: 0, maximum: 9999.9, error: "Medida inválida (0 a 9999.9)" }));
const measurements = new Elysia({ prefix: "/nutri/measurements" })
  .use(auth)
  .get(
    "/",
    ({ userId }) =>
      db
        .select({ date: M.date, waist: M.waist, hip: M.hip, chest: M.chest, arm: M.arm, thigh: M.thigh })
        .from(M)
        .where(eq(M.userId, userId))
        .orderBy(asc(M.date)),
    { auth: true },
  )
  .post(
    "/",
    async ({ userId, body }) => {
      const { date: d, ...vals } = body;
      const date = d ?? today();
      const keys = ["waist", "hip", "chest", "arm", "thigh"] as const;
      const set = Object.fromEntries(keys.map((k) => [k, sql`coalesce(excluded.${sql.identifier(k)}, ${M[k]})`]));
      await db.insert(M).values({ userId, date, ...rounded(vals) }).onConflictDoUpdate({ target: [M.userId, M.date], set });
      return { saved: true };
    },
    { auth: true, body: t.Object({ waist: optNum, hip: optNum, chest: optNum, arm: optNum, thigh: optNum, date: t.Optional(day) }) },
  );

export const trackingModule = new Elysia()
  .use(water)
  .use(series({ path: "weight", table: schema.weightLogs, field: "weightKg", col: schema.weightLogs.weightKg, key: "kg", label: "Peso inválido", max: 9999.9, map: (n) => round1(clamp(n)) }))
  .use(series({ path: "sleep", table: schema.sleepLogs, field: "hours", col: schema.sleepLogs.hours, key: "hours", label: "Horas de sono inválidas", max: 24, map: (n) => round1(clamp(n)) }))
  .use(series({ path: "steps", table: schema.stepLogs, field: "count", col: schema.stepLogs.count as AnyPgColumn, key: "count", label: "Passos inválidos", max: INT_MAX, map: (n) => clamp(Math.round(n)) }))
  .use(measurements)
  .use(doneRoute("habits", schema.habitLogs))
  .use(doneRoute("diary", schema.mealLogs));
