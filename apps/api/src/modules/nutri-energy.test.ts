import { describe, expect, test } from "bun:test";
import { db, schema } from "../db";
import { today } from "../lib/date";
import { api } from "../test/http";
import { setPlan, signup } from "../test/users";

const profile = { sex: "male", age: 30, heightCm: 180, weightKg: 80, goal: "health", diet: "omnivore", restrictions: [], mealsPerDay: 4, waterGlasses: 8, meals: [] };

async function user(activity: string, plan: "free" | "pro" | "family" = "pro") {
  const u = await signup();
  if (plan !== "free") await setPlan(u.user.id, plan);
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
    expect(res.body).toEqual({ date: today(), workoutKcal: 0, bonusKcal: 0, sessions: 0, locked: false });
  });

  test("sedentário que treina: bônus integral; ontem não conta", async () => {
    const { token, user: u } = await user("sedentary");
    await session(u.id, 300);
    await session(u.id, 100);
    await session(u.id, 900, "2000-01-01");
    const res = await api("GET", "/nutri/today-energy", undefined, token);
    expect(res.body).toEqual({ date: today(), workoutKcal: 400, bonusKcal: 400, sessions: 2, locked: false });
  });

  test("sessão sem kcal não conta", async () => {
    const { token, user: u } = await user("sedentary");
    await session(u.id, null);
    const res = await api("GET", "/nutri/today-energy", undefined, token);
    expect(res.body).toEqual({ date: today(), workoutKcal: 0, bonusKcal: 0, sessions: 0, locked: false });
  });

  test("muito ativo que treina leve: bônus 0, mas o treino aparece", async () => {
    const { token, user: u } = await user("athlete");
    await session(u.id, 300);
    const res = await api("GET", "/nutri/today-energy", undefined, token);
    expect(res.body).toEqual({ date: today(), workoutKcal: 300, bonusKcal: 0, sessions: 1, locked: false });
  });

  test("free: treino aparece, bônus 0 e locked; family ajusta como pro", async () => {
    const free = await user("sedentary", "free");
    await session(free.user.id, 300);
    const res = await api("GET", "/nutri/today-energy", undefined, free.token);
    expect(res.body).toEqual({ date: today(), workoutKcal: 300, bonusKcal: 0, sessions: 1, locked: true });
    const fam = await user("sedentary", "family");
    await session(fam.user.id, 300);
    const ok = await api("GET", "/nutri/today-energy", undefined, fam.token);
    expect(ok.body).toMatchObject({ workoutKcal: 300, bonusKcal: 300, locked: false });
  });
});
