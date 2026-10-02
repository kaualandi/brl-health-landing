import { existsSync } from "node:fs";
import { and, arrayContains, asc, count, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { config } from "../config";
import { db, schema } from "../db";
import { bodyPartLabels, equipmentLabels, label, muscleLabels } from "./exercises.labels";

const { exercises } = schema;
const FILE = /^[A-Za-z0-9_-]+\.gif$/;
const labelAll = (dict: Record<string, string>, values: string[]) => values.map((v) => label(dict, v));
const byLabel = (a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label, "pt-BR");

export const exerciseMedia = (e: typeof exercises.$inferSelect) =>
  e.mediaPath && existsSync(`${config.mediaDir}/exercises/${e.mediaPath}`) ? `${config.publicUrl}/media/exercises/${e.mediaPath}` : e.gifUrl;

const toItem = (e: typeof exercises.$inferSelect) => ({
  id: e.id,
  name: e.namePt ?? e.name,
  nameEn: e.name,
  gifUrl: exerciseMedia(e),
  bodyParts: labelAll(bodyPartLabels, e.bodyParts),
  targetMuscles: labelAll(muscleLabels, e.targetMuscles),
  secondaryMuscles: labelAll(muscleLabels, e.secondaryMuscles),
  equipments: labelAll(equipmentLabels, e.equipments),
  instructions: e.instructionsPt ?? e.instructions,
});

const escapeLike = (s: string) => s.replace(/[\\%_]/g, "\\$&");
const matchName = (q: string) => {
  const like = `%${escapeLike(q.trim())}%`;
  return or(ilike(exercises.name, like), ilike(exercises.namePt, like));
};
const sortName = sql`lower(coalesce(${exercises.namePt}, ${exercises.name}))`;

const filterColumns = {
  bodyParts: exercises.bodyParts,
  targetMuscles: exercises.targetMuscles,
  equipments: exercises.equipments,
};

async function distinct(name: keyof typeof filterColumns, dict: Record<string, string>) {
  const col = filterColumns[name];
  const rows = await db.selectDistinct({ v: sql<string>`unnest(${col})` }).from(exercises);
  return rows.map((r) => label(dict, r.v)).sort(byLabel);
}

const listQuery = t.Object({
  q: t.Optional(t.String()),
  bodyPart: t.Optional(t.String()),
  equipment: t.Optional(t.String()),
  muscle: t.Optional(t.String()),
  limit: t.Optional(t.Numeric()),
  offset: t.Optional(t.Numeric()),
});

export const exercisesModule = new Elysia()
  .get(
    "/exercises",
    async ({ query }) => {
      const limit = Math.min(Math.max(Math.trunc(query.limit ?? 24), 1), 100);
      const offset = Math.max(Math.trunc(query.offset ?? 0), 0);
      const filters: (SQL | undefined)[] = [
        query.q ? matchName(query.q) : undefined,
        query.bodyPart ? arrayContains(exercises.bodyParts, [query.bodyPart]) : undefined,
        query.equipment ? arrayContains(exercises.equipments, [query.equipment]) : undefined,
        query.muscle ? arrayContains(exercises.targetMuscles, [query.muscle]) : undefined,
      ];
      const where = and(...filters);
      const [{ total }] = await db.select({ total: count() }).from(exercises).where(where);
      const rows = await db.select().from(exercises).where(where).orderBy(asc(sortName), asc(exercises.id)).limit(limit).offset(offset);
      return { total, items: rows.map((r) => toItem(r)), hasMore: offset + rows.length < total };
    },
    { query: listQuery },
  )
  .get("/exercises/filters", async () => ({
    attribution: "Dados e GIFs: ExerciseDB",
    bodyParts: await distinct("bodyParts", bodyPartLabels),
    muscles: await distinct("targetMuscles", muscleLabels),
    equipments: await distinct("equipments", equipmentLabels),
  }))
  .get(
    "/exercises/:id",
    async ({ params, status }) => {
      const [row] = await db.select().from(exercises).where(eq(exercises.id, params.id));
      return row ? toItem(row) : status(404, { error: "Exercício não encontrado" });
    },
    { params: t.Object({ id: t.String() }) },
  )
  .get(
    "/media/exercises/:file",
    async ({ params, set, status }) => {
      if (!FILE.test(params.file)) return status(404, { error: "Arquivo não encontrado" });
      const file = Bun.file(`${config.mediaDir}/exercises/${params.file}`);
      if (!(await file.exists())) return status(404, { error: "Arquivo não encontrado" });
      set.headers["content-type"] = "image/gif";
      set.headers["cache-control"] = "public, max-age=31536000, immutable";
      return file;
    },
    { params: t.Object({ file: t.String() }) },
  );
