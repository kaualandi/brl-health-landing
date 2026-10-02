import { describe, expect, test } from "bun:test";
import { db, schema } from "../db";
import { today } from "../lib/date";
import { api } from "../test/http";
import { signup } from "../test/users";

const profile = { sex: "male", age: 30, heightCm: 180, weightKg: 80, goal: "health", diet: "omnivore", restrictions: [], mealsPerDay: 4, waterGlasses: 8, meals: [] };

async function user(activity: string) {
  const u = await signup();
  await db.insert(schema.nutriProfiles).values({ userId: Number(u.user.id), ...profile, activity });
  return u;
}

async function session(userId: string, kcal: number | null, date = today()) {
  await db.insert(schema.fitSessions).values({ userId: Number(userId), clientId: crypto.randomUUID(), date, dayIndex: 0, dayName: "A", startedAt: new Date(), kcal });
}

describe("GET /nutri/today-energy", () => {
  test("401 sem token", async () => {
    expect((await api("GET", "/nutri/today-energy")).status).toBe(401);
  });

  test("sem treino: tudo zero", async () => {
    const { token } = await user("sedentary");
    const res = await api("GET", "/nutri/today-energy", undefined, token);
    expect(res.body).toEqual({ date: today(), workoutKcal: 0, bonusKcal: 0, sessions: 0 });
  });

  test("sedentário que treina: bônus integral; ontem não conta", async () => {
    const { token, user: u } = await user("sedentary");
    await session(u.id, 300);
    await session(u.id, 100);
    await session(u.id, 900, "2000-01-01");
    const res = await api("GET", "/nutri/today-energy", undefined, token);
    expect(res.body).toEqual({ date: today(), workoutKcal: 400, bonusKcal: 400, sessions: 2 });
  });

  test("muito ativo que treina leve: bônus 0, mas o treino aparece", async () => {
    const { token, user: u } = await user("athlete");
    await session(u.id, 300);
    const res = await api("GET", "/nutri/today-energy", undefined, token);
    expect(res.body).toEqual({ date: today(), workoutKcal: 300, bonusKcal: 0, sessions: 1 });
  });
});
