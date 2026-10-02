import { describe, expect, test } from "bun:test";
import { api } from "../test/http";
import { signup } from "../test/users";

const home = {
  goal: "health", level: "beginner", daysPerWeek: 3, location: "home",
  equipment: ["bodyweight"], sessionMinutes: 45, limitations: ["knee"],
};
const gym = { ...home, goal: "strength", level: "advanced", daysPerWeek: 5, location: "gym", equipment: ["barbell", "dumbbell", "cable"] };

describe("/fit/plan", () => {
  test("401 sem token", async () => {
    expect((await api("GET", "/fit/plan")).status).toBe(401);
    expect((await api("POST", "/fit/plan/generate")).status).toBe(401);
  });

  test("404 sem plano e 400 sem perfil", async () => {
    const { token } = await signup();
    const get = await api("GET", "/fit/plan", undefined, token);
    expect(get.status).toBe(404);
    expect(get.body).toEqual({ error: "Plano de treino não encontrado" });
    const gen = await api("POST", "/fit/plan/generate", undefined, token);
    expect(gen.status).toBe(400);
    expect(gen.body).toEqual({ errors: ["Monte seu perfil de treino primeiro."] });
  });

  test("gera, persiste e devolve o shape", async () => {
    const { token } = await signup();
    await api("PUT", "/fit/profile", home, token);
    const gen = await api("POST", "/fit/plan/generate", undefined, token);
    expect(gen.status).toBe(200);
    expect(gen.body.split).toBe("Full body A/B/C");
    expect(gen.body.days).toHaveLength(3);
    const day = gen.body.days[0];
    expect(day.name).toStartWith("Treino A — ");
    expect(day.focus.length).toBeGreaterThan(0);
    expect(day.exercises).toHaveLength(5);
    const ex = day.exercises[0];
    expect(ex).toMatchObject({ order: 1, sets: 2, reps: "10–12", restSeconds: 60 });
    expect(ex.exercise).toMatchObject({ id: expect.any(String), name: expect.any(String), gifUrl: expect.any(String) });
    expect(ex.exercise.equipments).toEqual([{ value: "bodyweight", label: "Peso corporal" }]);
    expect(ex.exercise.targetMuscles[0]).toHaveProperty("label");
    expect(typeof gen.body.generatedAt).toBe("string");
    expect((await api("GET", "/fit/plan", undefined, token)).body).toEqual(gen.body);
  });

  test("regenerar substitui o plano; PUT do perfil não mexe nele", async () => {
    const { token } = await signup();
    await api("PUT", "/fit/profile", home, token);
    const first = await api("POST", "/fit/plan/generate", undefined, token);
    const again = await api("POST", "/fit/plan/generate", undefined, token);
    expect(again.body.days).toHaveLength(3);
    expect(again.body.days).not.toEqual(first.body.days);
    await api("PUT", "/fit/profile", gym, token);
    expect((await api("GET", "/fit/plan", undefined, token)).body).toEqual(again.body);
    const fresh = await api("POST", "/fit/plan/generate", undefined, token);
    expect(fresh.body.split).toBe("PPL + Superior/Inferior");
    expect(fresh.body.days).toHaveLength(5);
  });

  test("gerações simultâneas: todas 200 e um único plano", async () => {
    const { token } = await signup();
    await api("PUT", "/fit/profile", home, token);
    const results = await Promise.all([1, 2, 3].map(() => api("POST", "/fit/plan/generate", undefined, token)));
    expect(results.map((r) => r.status)).toEqual([200, 200, 200]);
    const got = await api("GET", "/fit/plan", undefined, token);
    expect(got.body.days).toHaveLength(3);
    expect(got.body.days.every((d: { exercises: unknown[] }) => d.exercises.length === 5)).toBe(true);
  });

  test("salvar perfil sem plano prévio não cria plano", async () => {
    const { token } = await signup();
    await api("PUT", "/fit/profile", home, token);
    expect((await api("GET", "/fit/plan", undefined, token)).status).toBe(404);
  });
});
