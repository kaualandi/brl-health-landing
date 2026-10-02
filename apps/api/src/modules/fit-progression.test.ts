import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { inArray } from "drizzle-orm";
import { db, schema } from "../db";
import { today } from "../lib/date";
import { api } from "../test/http";
import { setPlan, signup } from "../test/users";
import { stepFor, suggest, trainingWeek, type Entry } from "./fit-progression.rules";

const rx = { sets: 3, repsMin: 8, repsMax: 10 };
const entry = (reps: number[], kg: number | null = 20, date = "2026-09-30"): Entry => ({ date, sets: reps.map((r) => ({ weightKg: kg, reps: r })) });

describe("suggest (regra pura)", () => {
  test("sem histórico", () => expect(suggest([], rx, 2.5, false)).toEqual({ weightKg: null, reps: 8, sets: 3, reason: "new" }));
  test("topo em todas as séries sobe a carga", () => {
    expect(suggest([entry([10, 10, 10])], rx, 2.5, false)).toMatchObject({ weightKg: 22.5, reps: 8, reason: "up" });
    expect(suggest([entry([10, 10, 10])], rx, 1, false).weightKg).toBe(21);
  });
  test("dentro da faixa mantém e +1 rep", () => {
    expect(suggest([entry([10, 9, 9])], rx, 2.5, false)).toMatchObject({ weightKg: 20, reps: 10, reason: "hold" });
    expect(suggest([entry([10, 10])], rx, 2.5, false).reason).toBe("hold");
  });
  test("falha uma vez mantém; duas seguidas reduz ~10%", () => {
    expect(suggest([entry([7, 8, 8])], rx, 2.5, false)).toMatchObject({ weightKg: 20, reps: 8, reason: "hold" });
    expect(suggest([entry([7, 8, 8]), entry([6, 8, 8])], rx, 2.5, false)).toMatchObject({ weightKg: 17.5, reps: 8, reason: "down" });
  });
  test("redução sempre tira ao menos um passo", () => {
    const two = (kg: number) => [entry([7, 7, 7], kg), entry([6, 6, 6], kg)];
    expect(suggest(two(10), rx, 2.5, false).weightKg).toBe(7.5);
    expect(suggest(two(5), rx, 1, false).weightKg).toBe(4);
  });
  test("peso corporal: +1 rep alvo", () => {
    expect(suggest([entry([10, 10, 10], null)], rx, 2.5, false)).toMatchObject({ weightKg: null, reps: 11, reason: "up" });
    expect(suggest([entry([9, 8, 8], null)], rx, 2.5, false)).toMatchObject({ weightKg: null, reps: 9, reason: "hold" });
  });
  test("deload: carga x0,6 e -1 série", () => {
    expect(suggest([entry([10, 10, 10], 40)], rx, 2.5, true)).toEqual({ weightKg: 25, reps: 8, sets: 2, reason: "deload" });
    expect(suggest([entry([10], 40)], { ...rx, sets: 1 }, 2.5, true).sets).toBe(1);
  });
  test("passo por equipamento", () => {
    expect(stepFor(["dumbbell"])).toBe(1);
    expect(stepFor(["barbell"])).toBe(2.5);
  });
});

describe("trainingWeek", () => {
  const dates = ["2026-08-31", "2026-09-07", "2026-09-14", "2026-09-21"]; // 4 semanas seguidas (segundas)
  test("5ª semana consecutiva é deload", () => {
    const w = trainingWeek(dates, "2026-09-30");
    expect(w).toMatchObject({ week: 5, deload: true });
    expect(trainingWeek(dates, "2026-09-30").inDeload("2026-09-21")).toBe(false);
  });
  test("pausa zera a contagem; semana 6 ignora sessões do deload", () => {
    expect(trainingWeek(dates, "2026-10-14")).toMatchObject({ week: 1, deload: false });
    const six = trainingWeek([...dates, "2026-09-28"], "2026-10-06");
    expect(six).toMatchObject({ week: 6, deload: false });
    expect(six.inDeload("2026-09-28")).toBe(true);
  });
  test("sem histórico", () => expect(trainingWeek([], "2026-09-30")).toMatchObject({ week: 1, deload: false }));
});

const tag = crypto.randomUUID().slice(0, 8);
const fx = ["up", "hold", "down", "new"].map((k) => ({
  id: `fp-${tag}-${k}`, name: `fp ${tag} ${k}`, gifUrl: "https://example.test/x.gif", bodyParts: ["chest"],
  targetMuscles: ["pectorals"], secondaryMuscles: [] as string[], equipments: ["barbell"], instructions: [] as string[],
}));

async function userWithPlan(plan: "free" | "pro" | "family" = "pro") {
  const u = await signup();
  const userId = Number(u.user.id);
  if (plan !== "free") await setPlan(userId, plan);
  await db.insert(schema.fitPlans).values({ userId, seed: 1, split: "Teste" });
  await db.insert(schema.fitPlanDays).values({ userId, dayIndex: 0, name: "Treino A", focus: ["pectorals"] });
  await db.insert(schema.fitPlanExercises).values(fx.map((f, i) => ({ userId, dayIndex: 0, order: i + 1, exerciseId: f.id, sets: 3, repsMin: 8, repsMax: 10, restSeconds: 60 })));
  return { ...u, userId };
}

let n = 0;
async function log(userId: number, reps: Record<string, number[]>) {
  const [s] = await db.insert(schema.fitSessions).values({ userId, clientId: crypto.randomUUID(), date: today(), dayIndex: 0, dayName: "A", startedAt: new Date(), finishedAt: new Date(), durationSeconds: 60 + n++ }).returning({ id: schema.fitSessions.id });
  const rows = Object.entries(reps).flatMap(([k, rs]) => rs.map((r, i) => ({ sessionId: s.id, exerciseId: `fp-${tag}-${k}`, exerciseOrder: fx.findIndex((f) => f.id === `fp-${tag}-${k}`) + 1, setNumber: i + 1, weightKg: 40, reps: r, done: true })));
  await db.insert(schema.fitSessionSets).values(rows);
}

beforeAll(async () => void (await db.insert(schema.exercises).values(fx)));
afterAll(async () => void (await db.delete(schema.exercises).where(inArray(schema.exercises.id, fx.map((f) => f.id)))));

describe("GET /fit/progression", () => {
  test("401 sem token", async () => expect((await api("GET", "/fit/progression")).status).toBe(401));

  test("subida, manutenção, falha 2x e sem histórico", async () => {
    const { token, userId } = await userWithPlan();
    await log(userId, { up: [10, 10, 10], hold: [10, 9, 9], down: [7, 8, 8] });
    await log(userId, { up: [10, 10, 10], hold: [10, 9, 9], down: [6, 8, 8] });
    const res = await api("GET", "/fit/progression", undefined, token);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ locked: false, deload: false, week: 1 });
    const e = res.body.exercises;
    expect(e[fx[0].id]).toEqual({ weightKg: 42.5, reps: 8, sets: 3, reason: "up" });
    expect(e[fx[1].id]).toEqual({ weightKg: 40, reps: 10, sets: 3, reason: "hold" });
    expect(e[fx[2].id]).toEqual({ weightKg: 35, reps: 8, sets: 3, reason: "down" });
    expect(e[fx[3].id]).toEqual({ weightKg: null, reps: 8, sets: 3, reason: "new" });
  });

  test("deload na 5ª semana consecutiva", async () => {
    const { token, userId } = await userWithPlan();
    const monday = (weeksAgo: number) => today(new Date(Date.now() - weeksAgo * 7 * 86_400_000));
    for (const w of [4, 3, 2, 1]) {
      const [s] = await db.insert(schema.fitSessions).values({ userId, clientId: crypto.randomUUID(), date: monday(w), dayIndex: 0, dayName: "A", startedAt: new Date(), finishedAt: new Date(), durationSeconds: 60 }).returning({ id: schema.fitSessions.id });
      await db.insert(schema.fitSessionSets).values([{ sessionId: s.id, exerciseId: fx[0].id, exerciseOrder: 1, setNumber: 1, weightKg: 40, reps: 10, done: true }]);
    }
    const res = await api("GET", "/fit/progression", undefined, token);
    expect(res.body).toMatchObject({ deload: true, week: 5 });
    expect(res.body.exercises[fx[0].id]).toEqual({ weightKg: 25, reps: 8, sets: 2, reason: "deload" });
  });

  test("free: 200 locked, sem sugestões; family: igual ao pro", async () => {
    const free = await userWithPlan("free");
    await log(free.userId, { up: [10, 10, 10] });
    const locked = await api("GET", "/fit/progression", undefined, free.token);
    expect(locked).toMatchObject({ status: 200, body: { locked: true, deload: false, exercises: {} } });
    const fam = await userWithPlan("family");
    await log(fam.userId, { up: [10, 10, 10] });
    const res = await api("GET", "/fit/progression", undefined, fam.token);
    expect(res.body.locked).toBe(false);
    expect(res.body.exercises[fx[0].id].reason).toBe("up");
  });
});
