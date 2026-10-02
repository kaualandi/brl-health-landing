import { describe, expect, test } from "bun:test";
import { api } from "../test/http";
import { signup } from "../test/users";

const profile = {
  goal: "hypertrophy",
  level: "intermediate",
  daysPerWeek: 4,
  location: "gym",
  equipment: ["barbell", "dumbbell", "cable"],
  sessionMinutes: 60,
  limitations: ["knee"],
};

const put = async (body: unknown) => api("PUT", "/fit/profile", body, (await signup()).token);

describe("/fit/profile", () => {
  test("401 sem token", async () => {
    expect((await api("GET", "/fit/profile")).status).toBe(401);
    expect((await api("PUT", "/fit/profile", profile)).status).toBe(401);
  });

  test("404 antes do PUT", async () => {
    const { token } = await signup();
    const res = await api("GET", "/fit/profile", undefined, token);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Perfil de treino não encontrado" });
  });

  test("round-trip e upsert substitui", async () => {
    const { token } = await signup();
    const first = await api("PUT", "/fit/profile", profile, token);
    expect(first.status).toBe(200);
    expect(first.body).toEqual(profile);
    expect((await api("GET", "/fit/profile", undefined, token)).body).toEqual(profile);
    const next = { ...profile, goal: "health", location: "home", equipment: ["bodyweight"], limitations: [] };
    expect((await api("PUT", "/fit/profile", next, token)).body).toEqual(next);
    expect((await api("GET", "/fit/profile", undefined, token)).body).toEqual(next);
  });

  test.each([
    ["dias abaixo de 2", { daysPerWeek: 1 }],
    ["dias acima de 6", { daysPerWeek: 7 }],
    ["dias fracionados", { daysPerWeek: 3.5 }],
    ["nível inválido", { level: "pro" }],
    ["objetivo inválido", { goal: "lose" }],
    ["local inválido", { location: "park" }],
    ["equipamento desconhecido", { equipment: ["laser"] }],
    ["limitação desconhecida", { limitations: ["neck"] }],
    ["sessão curta", { sessionMinutes: 10 }],
    ["sessão longa", { sessionMinutes: 200 }],
    ["casa sem equipamento", { location: "home", equipment: [] }],
  ])("400: %s", async (_, patch) => {
    const res = await put({ ...profile, ...patch });
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeArray();
    expect(res.body.errors.length).toBeGreaterThan(0);
  });
});
