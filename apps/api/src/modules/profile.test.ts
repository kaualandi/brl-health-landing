import { describe, expect, test } from "bun:test";
import { api } from "../test/http";
import { signup } from "../test/users";

const profile = {
  sex: "female",
  age: 30,
  heightCm: 165.5,
  weightKg: 70,
  goalWeightKg: 62.5,
  goal: "lose",
  activity: "moderate",
  diet: "omnivore",
  restrictions: ["lactose", "egg"],
  mealsPerDay: 4,
  waterGlasses: 8,
  meals: [{ name: "Café", time: "07:30" }],
  wakeTime: "07:00",
  trainTime: null,
  sleepTime: "23:00",
};

describe("/nutri/profile", () => {
  test("401 sem token", async () => {
    expect((await api("GET", "/nutri/profile")).status).toBe(401);
    expect((await api("PUT", "/nutri/profile", profile)).status).toBe(401);
  });

  test("404 antes do PUT", async () => {
    const { token } = await signup();
    const res = await api("GET", "/nutri/profile", undefined, token);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Perfil não encontrado" });
  });

  test("round-trip PUT -> GET com nulls e meals", async () => {
    const { token } = await signup();
    const put = await api("PUT", "/nutri/profile", profile, token);
    expect(put.status).toBe(200);
    expect(put.body).toEqual(profile);
    const get = await api("GET", "/nutri/profile", undefined, token);
    expect(get.body).toEqual(profile);
  });

  test("horário opcional vazio vira null", async () => {
    const { token } = await signup();
    const res = await api("PUT", "/nutri/profile", { ...profile, wakeTime: "", sleepTime: "" }, token);
    expect(res.status).toBe(200);
    expect(res.body.wakeTime).toBeNull();
    expect(res.body.sleepTime).toBeNull();
  });

  test("upsert: segundo PUT substitui", async () => {
    const { token } = await signup();
    await api("PUT", "/nutri/profile", profile, token);
    const next = { ...profile, age: 31, goalWeightKg: null, meals: [], restrictions: [], wakeTime: null };
    expect((await api("PUT", "/nutri/profile", next, token)).status).toBe(200);
    expect((await api("GET", "/nutri/profile", undefined, token)).body).toEqual(next);
  });

  test("400 para enum inválido e idade fora do range", async () => {
    const { token } = await signup();
    const bad = await api("PUT", "/nutri/profile", { ...profile, goal: "fly" }, token);
    expect(bad.status).toBe(400);
    expect(bad.body.errors.join()).toContain("Objetivo inválido");
    const age = await api("PUT", "/nutri/profile", { ...profile, age: 5 }, token);
    expect(age.status).toBe(400);
    expect(age.body.errors.join()).toContain("Idade");
  });
});
