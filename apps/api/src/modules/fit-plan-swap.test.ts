import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { inArray } from "drizzle-orm";
import { db, schema } from "../db";
import { api } from "../test/http";
import { signup } from "../test/users";

// Catálogo e plano próprios (músculo exclusivo do teste): não depende dos exercícios importados.
const tag = crypto.randomUUID().slice(0, 8);
const muscle = `swapm-${tag}`;
const mk = (key: string, equipments: string[], secondary: string[] = []) => ({
  id: `fx-${tag}-${key}`,
  name: `fx ${tag} ${key}`,
  gifUrl: "https://example.test/x.gif",
  bodyParts: ["upper arms"],
  targetMuscles: [muscle],
  secondaryMuscles: secondary,
  equipments,
  instructions: [] as string[],
});
const fixtures = [
  mk("cur", ["dumbbell"], ["forearms", "deltoids"]),
  mk("inday", ["dumbbell"]),
  mk("best", ["dumbbell"], ["forearms", "deltoids"]),
  mk("mid", ["dumbbell"], ["forearms"]),
  mk("none", ["dumbbell"]),
  mk("barbell", ["barbell"]),
  mk("bwcur", ["bodyweight"]),
  mk("bwalt", ["bodyweight"]),
];
const id = (key: string) => `fx-${tag}-${key}`;
const profile = { goal: "health", level: "beginner", daysPerWeek: 3, location: "home", equipment: ["dumbbell"], sessionMinutes: 45, limitations: [] };

async function userWithPlan() {
  const s = await signup();
  const userId = Number(s.user.id);
  await api("PUT", "/fit/profile", profile, s.token);
  await db.insert(schema.fitPlans).values({ userId, seed: 1, split: "Full body A/B/C" });
  await db.insert(schema.fitPlanDays).values({ userId, dayIndex: 0, name: "Treino A", focus: [muscle] });
  await db.insert(schema.fitPlanExercises).values(
    ["cur", "inday"].map((k, i) => ({ userId, dayIndex: 0, order: i + 1, exerciseId: id(k), sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60 })),
  );
  return s.token;
}

const alt = (day: number, order: number) => `/fit/plan/days/${day}/exercises/${order}/alternatives`;
const put = (day: number, order: number) => `/fit/plan/days/${day}/exercises/${order}`;

beforeAll(async () => {
  await db.insert(schema.exercises).values(fixtures);
});

afterAll(async () => {
  await db.delete(schema.exercises).where(inArray(schema.exercises.id, fixtures.map((f) => f.id)));
});

describe("troca de exercício", () => {
  test("401 sem token", async () => {
    expect((await api("GET", alt(0, 1))).status).toBe(401);
    expect((await api("PUT", put(0, 1), { exerciseId: "x" })).status).toBe(401);
  });

  test("alternativas: equivalentes, ordenadas, sem o do dia e sem outro equipamento", async () => {
    const token = await userWithPlan();
    const res = await api("GET", alt(0, 1), undefined, token);
    expect(res.status).toBe(200);
    expect(res.body.map((e: { id: string }) => e.id)).toEqual([id("best"), id("mid"), id("none")]);
    expect(res.body[0]).toMatchObject({ name: expect.any(String), gifUrl: expect.any(String), equipments: [{ value: "dumbbell" }] });
  });

  test("academia sem equipamento: alternativas só de peso corporal (#191)", async () => {
    const s = await signup();
    const userId = Number(s.user.id);
    await api("PUT", "/fit/profile", { ...profile, location: "gym", equipment: [] }, s.token);
    await db.insert(schema.fitPlans).values({ userId, seed: 1, split: "Full body A/B/C" });
    await db.insert(schema.fitPlanDays).values({ userId, dayIndex: 0, name: "Treino A", focus: [muscle] });
    await db.insert(schema.fitPlanExercises).values({ userId, dayIndex: 0, order: 1, exerciseId: id("bwcur"), sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60 });
    const res = await api("GET", alt(0, 1), undefined, s.token);
    expect(res.status).toBe(200);
    expect(res.body.map((e: { id: string }) => e.id)).toEqual([id("bwalt")]);
    expect(res.body[0].equipments).toEqual([{ value: "bodyweight", label: "Peso corporal" }]);
  });

  test("404 para dia/ordem inexistente", async () => {
    const token = await userWithPlan();
    expect((await api("GET", alt(9, 1), undefined, token)).status).toBe(404);
    expect((await api("PUT", put(0, 9), { exerciseId: id("best") }, token)).status).toBe(404);
  });

  test("troca persiste mantendo sets/reps/descanso", async () => {
    const token = await userWithPlan();
    const res = await api("PUT", put(0, 1), { exerciseId: id("mid") }, token);
    expect(res.status).toBe(200);
    expect(res.body.days[0].exercises[0]).toMatchObject({ order: 1, sets: 3, reps: "10–12", restSeconds: 60, exercise: { id: id("mid") } });
    const got = await api("GET", "/fit/plan", undefined, token);
    expect(got.body.days[0].exercises[0].exercise.id).toBe(id("mid"));
  });

  test("400 para exercício que não é alternativa válida", async () => {
    const token = await userWithPlan();
    for (const bad of [id("barbell"), id("inday"), "nao-existe"]) {
      const res = await api("PUT", put(0, 1), { exerciseId: bad }, token);
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ errors: ["Esse exercício não serve como troca aqui."] });
    }
    expect((await api("PUT", put(0, 1), {}, token)).status).toBe(400);
  });
});
