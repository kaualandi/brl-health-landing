import { and, arrayContained, arrayOverlaps, eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db, schema } from "../db";
import { auth } from "../lib/auth";
import { exerciseMedia } from "./exercises";
import { equipmentLabels, label, muscleLabels } from "./exercises.labels";
import { loadPlan } from "./fit-plan";
import { alternativesFor } from "./fit-plan.swap";

const { fitPlanExercises: items, fitProfiles, exercises } = schema;
const int = t.Numeric({ minimum: 0, maximum: 2147483647 });
const params = t.Object({ day: int, order: int });
type Reader = Pick<typeof db, "select">;

/** Alternativas válidas pro exercício do plano; null se perfil/dia/ordem não existem. */
async function swapOptions(rd: Reader, userId: number, day: number, order: number) {
  const [profile] = await rd.select().from(fitProfiles).where(eq(fitProfiles.userId, userId));
  const dayRows = await rd
    .select({ order: items.order, exercise: exercises })
    .from(items)
    .innerJoin(exercises, eq(exercises.id, items.exerciseId))
    .where(and(eq(items.userId, userId), eq(items.dayIndex, day)));
  const current = dayRows.find((r) => r.order === order)?.exercise;
  if (!profile || !current) return null;
  const pool = await rd
    .select()
    .from(exercises)
    .where(and(arrayContained(exercises.equipments, profile.equipment), arrayOverlaps(exercises.targetMuscles, [...current.targetMuscles, ...current.secondaryMuscles])));
  return alternativesFor(profile, current, pool, new Set(dayRows.map((r) => r.exercise.id)));
}

const toAlternative = (e: typeof exercises.$inferSelect) => ({
  id: e.id,
  name: e.namePt ?? e.name,
  nameEn: e.name,
  gifUrl: exerciseMedia(e),
  targetMuscles: e.targetMuscles.map((m) => label(muscleLabels, m)),
  equipments: e.equipments.map((q) => label(equipmentLabels, q)),
});

export const fitPlanSwapModule = new Elysia({ prefix: "/fit/plan/days/:day/exercises/:order" })
  .use(auth)
  .get(
    "/alternatives",
    async ({ userId, params: p, status }) => {
      const found = await swapOptions(db, userId, p.day, p.order);
      return found ? found.map(toAlternative) : status(404, { error: "Exercício do plano não encontrado" });
    },
    { auth: true, params },
  )
  .put(
    "/",
    async ({ userId, params: p, body, status }) => {
      const result = await db.transaction(async (tx) => {
        await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`fitplan:${userId}`}))`);
        const found = await swapOptions(tx, userId, p.day, p.order);
        if (!found) return 404;
        if (!found.some((f) => f.id === body.exerciseId)) return 400;
        await tx
          .update(items)
          .set({ exerciseId: body.exerciseId })
          .where(and(eq(items.userId, userId), eq(items.dayIndex, p.day), eq(items.order, p.order)));
        return 200;
      });
      if (result === 404) return status(404, { error: "Exercício do plano não encontrado" });
      if (result === 400) return status(400, { errors: ["Esse exercício não serve como troca aqui."] });
      return loadPlan(userId);
    },
    { auth: true, params, body: t.Object({ exerciseId: t.String() }) },
  );
