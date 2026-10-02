import { arrayContained, asc, eq, sql } from "drizzle-orm";
import { Elysia } from "elysia";
import { db, schema } from "../db";
import { auth } from "../lib/auth";
import { generatePlan, type Candidate, type GeneratedPlan } from "./fit-plan.engine";
import { equipmentLabels, label, muscleLabels } from "./exercises.labels";
import { exerciseMedia } from "./exercises";

const { fitPlans, fitPlanDays, fitPlanExercises, exercises } = schema;

const hash = (text: string) => [...text].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0, 2166136261);

/** Gera e persiste (substituindo) o plano; seed nova a cada geração. Null se não há perfil. */
export async function regeneratePlan(userId: number) {
  const [profile] = await db.select().from(schema.fitProfiles).where(eq(schema.fitProfiles.userId, userId));
  if (!profile) return null;
  const [prev] = await db.select({ seed: fitPlans.seed }).from(fitPlans).where(eq(fitPlans.userId, userId));
  const seed = hash(`${userId}:${prev?.seed ?? 0}`);
  const candidates: Candidate[] = await db
    .select({
      id: exercises.id,
      name: exercises.name,
      targetMuscles: exercises.targetMuscles,
      secondaryMuscles: exercises.secondaryMuscles,
      equipments: exercises.equipments,
    })
    .from(exercises)
    .where(arrayContained(exercises.equipments, profile.equipment));
  await savePlan(userId, seed, generatePlan(profile, candidates, seed));
  return loadPlan(userId);
}

async function savePlan(userId: number, seed: number, plan: GeneratedPlan) {
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`fitplan:${userId}`}))`);
    await tx.delete(fitPlans).where(eq(fitPlans.userId, userId));
    await tx.insert(fitPlans).values({ userId, seed, split: plan.split });
    await tx.insert(fitPlanDays).values(plan.days.map((d) => ({ userId, dayIndex: d.index, name: d.name, focus: d.focus })));
    const rows = plan.days.flatMap((d) => d.exercises.map((e) => ({ userId, dayIndex: d.index, ...e })));
    if (rows.length) await tx.insert(fitPlanExercises).values(rows);
  });
}

const repsLabel = (min: number, max: number) => `${min}–${max}`;

type Row = { item: typeof fitPlanExercises.$inferSelect; exercise: typeof exercises.$inferSelect };

const toExercise = ({ item, exercise: e }: Row) => ({
  order: item.order,
  exercise: {
    id: e.id,
    name: e.namePt ?? e.name,
    nameEn: e.name,
    gifUrl: exerciseMedia(e),
    targetMuscles: e.targetMuscles.map((m) => label(muscleLabels, m)),
    equipments: e.equipments.map((q) => label(equipmentLabels, q)),
  },
  sets: item.sets,
  reps: repsLabel(item.repsMin, item.repsMax),
  restSeconds: item.restSeconds,
});

export async function loadPlan(userId: number) {
  const [plan] = await db.select().from(fitPlans).where(eq(fitPlans.userId, userId));
  if (!plan) return null;
  const days = await db.select().from(fitPlanDays).where(eq(fitPlanDays.userId, userId)).orderBy(asc(fitPlanDays.dayIndex));
  const rows = await db
    .select({ item: fitPlanExercises, exercise: exercises })
    .from(fitPlanExercises)
    .innerJoin(exercises, eq(exercises.id, fitPlanExercises.exerciseId))
    .where(eq(fitPlanExercises.userId, userId))
    .orderBy(asc(fitPlanExercises.dayIndex), asc(fitPlanExercises.order));
  return {
    generatedAt: plan.generatedAt.toISOString(),
    split: plan.split,
    days: days.map((d) => ({
      index: d.dayIndex,
      name: d.name,
      focus: d.focus.map((m) => label(muscleLabels, m).label),
      exercises: rows.filter((r) => r.item.dayIndex === d.dayIndex).map(toExercise),
    })),
  };
}

export const fitPlanModule = new Elysia({ prefix: "/fit/plan" })
  .use(auth)
  .get(
    "/",
    async ({ userId, status }) => (await loadPlan(userId)) ?? status(404, { error: "Plano de treino não encontrado" }),
    { auth: true },
  )
  .post(
    "/generate",
    async ({ userId, status }) =>
      (await regeneratePlan(userId)) ?? status(400, { errors: ["Monte seu perfil de treino primeiro."] }),
    { auth: true },
  );
