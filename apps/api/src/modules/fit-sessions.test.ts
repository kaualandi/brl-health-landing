import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { eq, inArray } from "drizzle-orm";
import { db, schema } from "../db";
import { api } from "../test/http";
import { signup } from "../test/users";

const tag = crypto.randomUUID().slice(0, 8);
const fixtures = ["a", "b", "c"].map((k) => ({
  id: `fx-${tag}-${k}`,
  name: `fx ${tag} ${k}`,
  gifUrl: "https://example.test/x.gif",
  bodyParts: ["chest"],
  targetMuscles: ["pectorals"],
  secondaryMuscles: [] as string[],
  equipments: ["barbell"],
  instructions: [] as string[],
}));

// Sessão de teste: usuário com plano de 1 dia montado direto no banco.
async function userWithPlan() {
  const u = await signup();
  const userId = Number(u.user.id);
  await db.insert(schema.fitPlans).values({ userId, seed: 1, split: "Teste" });
  await db.insert(schema.fitPlanDays).values({ userId, dayIndex: 0, name: "Treino A", focus: ["pectorals"] });
  await db.insert(schema.fitPlanExercises).values(
    fixtures.slice(0, 2).map((f, i) => ({ userId, dayIndex: 0, order: i + 1, exerciseId: f.id, sets: 3, repsMin: 8, repsMax: 10, restSeconds: 60 })),
  );
  return u;
}

const set = (over: object = {}) => ({ exerciseId: fixtures[0].id, exerciseOrder: 1, setNumber: 1, weightKg: 20, reps: 10, done: true, ...over });
const payload = (over: object = {}) => {
  const finished = new Date(Date.now() - 1000);
  return {
    clientId: crypto.randomUUID(),
    dayIndex: 0,
    dayName: "Treino A",
    startedAt: new Date(finished.getTime() - 1800_000).toISOString(),
    finishedAt: finished.toISOString(),
    sets: [set(), set({ setNumber: 2, weightKg: 22.5, reps: 8 }), set({ setNumber: 3, done: false }), set({ exerciseId: fixtures[1].id, exerciseOrder: 2, weightKg: null, reps: 12 })],
    ...over,
  };
};

beforeAll(async () => {
  await db.insert(schema.exercises).values(fixtures);
});
afterAll(async () => {
  await db.delete(schema.exercises).where(inArray(schema.exercises.id, fixtures.map((f) => f.id)));
});

describe("/fit/sessions", () => {
  test("401 sem token", async () => {
    expect((await api("GET", "/fit/sessions")).status).toBe(401);
    expect((await api("POST", "/fit/sessions", payload())).status).toBe(401);
    expect((await api("GET", "/fit/sessions/1")).status).toBe(401);
  });

  test("cria, resume e detalha a sessão", async () => {
    const { token } = await userWithPlan();
    const res = await api("POST", "/fit/sessions", payload(), token);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ dayName: "Treino A", dayIndex: 0, durationSeconds: 1800, setsDone: 3, volumeKg: 20 * 10 + 22.5 * 8 });
    expect(res.body.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(res.body.exercises).toHaveLength(2);
    expect(res.body.exercises[0].sets[1]).toEqual({ setNumber: 2, weightKg: 22.5, reps: 8, done: true });
    expect(res.body.exercises[1].sets[0].weightKg).toBeNull();
    const list = await api("GET", "/fit/sessions", undefined, token);
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toMatchObject({ id: res.body.id, setsDone: 3, volumeKg: 380 });
    expect(list.body[0].exercises).toBeUndefined();
    const one = await api("GET", `/fit/sessions/${res.body.id}`, undefined, token);
    expect(one.body).toEqual(res.body);
  });

  test("kcal = MET × peso × horas com o peso do Nutri; sem perfil, null", async () => {
    const { token, user } = await userWithPlan();
    expect((await api("POST", "/fit/sessions", payload(), token)).body.kcal).toBeNull();
    await db.insert(schema.nutriProfiles).values({ userId: Number(user.id), sex: "male", age: 30, heightCm: 180, weightKg: 80, goal: "health", activity: "light", diet: "omnivore", restrictions: [], mealsPerDay: 4, waterGlasses: 8, meals: [] });
    const res = await api("POST", "/fit/sessions", payload(), token);
    expect(res.body.kcal).toBe(Math.round(3.5 * 80 * 0.5));
    expect((await api("GET", "/fit/sessions", undefined, token)).body[0].kcal).toBe(res.body.kcal);
  });

  test("repetir o clientId não duplica", async () => {
    const { token } = await userWithPlan();
    const p = payload();
    const a = await api("POST", "/fit/sessions", p, token);
    const b = await api("POST", "/fit/sessions", p, token);
    expect(b.status).toBe(200);
    expect(b.body.id).toBe(a.body.id);
    expect((await api("GET", "/fit/sessions", undefined, token)).body).toHaveLength(1);
  });

  test("reenvio após o plano ser regenerado continua 200", async () => {
    const { token, user } = await userWithPlan();
    const p = payload();
    const a = await api("POST", "/fit/sessions", p, token);
    await db.delete(schema.fitPlans).where(eq(schema.fitPlans.userId, Number(user.id)));
    const b = await api("POST", "/fit/sessions", p, token);
    expect(b.status).toBe(200);
    expect(b.body.id).toBe(a.body.id);
  });

  test("exercício trocado depois do início e dia que sumiu do plano continuam válidos", async () => {
    const { token } = await userWithPlan();
    const swapped = await api("POST", "/fit/sessions", payload({ sets: [set({ exerciseId: fixtures[2].id })] }), token);
    expect(swapped.status).toBe(200);
    const orphan = await signup();
    const gone = await api("POST", "/fit/sessions", payload({ dayIndex: 5, dayName: "Treino F — antigo" }), orphan.token);
    expect(gone.status).toBe(200);
    expect(gone.body).toMatchObject({ dayName: "Treino F — antigo", dayIndex: 5 });
  });

});

describe("/fit/sessions histórico", () => {
  test("histórico: mais recentes primeiro, limit e before", async () => {
    const { token } = await userWithPlan();
    const ids: string[] = [];
    for (let i = 0; i < 3; i++) ids.push((await api("POST", "/fit/sessions", payload(), token)).body.id);
    const page = await api("GET", "/fit/sessions?limit=2", undefined, token);
    expect(page.body.map((s: { id: string }) => s.id)).toEqual([ids[2], ids[1]]);
    const next = await api("GET", `/fit/sessions?limit=2&before=${ids[1]}`, undefined, token);
    expect(next.body.map((s: { id: string }) => s.id)).toEqual([ids[0]]);
  });

  test("última carga por exercício", async () => {
    const { token } = await userWithPlan();
    expect((await api("GET", "/fit/sessions/last-loads", undefined, token)).body).toEqual({});
    await api("POST", "/fit/sessions", payload(), token);
    await api("POST", "/fit/sessions", payload({ sets: [set({ weightKg: 30 }), set({ setNumber: 2, weightKg: 32.5 })] }), token);
    const res = await api("GET", "/fit/sessions/last-loads", undefined, token);
    expect(res.body).toEqual({ [fixtures[0].id]: 32.5 });
  });

  test("isola por usuário", async () => {
    const a = await userWithPlan();
    const b = await signup();
    const s = await api("POST", "/fit/sessions", payload(), a.token);
    expect((await api("GET", `/fit/sessions/${s.body.id}`, undefined, b.token)).status).toBe(404);
    expect((await api("GET", "/fit/sessions", undefined, b.token)).body).toEqual([]);
  });

});

describe("/fit/sessions validações", () => {
  test.each([
    ["dia fora de 0–6", { dayIndex: 9 }, "Dia do treino inválido"],
    ["sem nome", { dayName: "" }, "Nome do treino deve ter de 1 a 60 caracteres"],
    ["nome só com espaços", { dayName: "   " }, "Nome do treino deve ter de 1 a 60 caracteres"],
    ["nome longo", { dayName: "x".repeat(61) }, "Nome do treino deve ter de 1 a 60 caracteres"],
    ["reps acima de 100", { sets: [set({ reps: 101 })] }, "Repetições devem estar entre 0 e 100"],
    ["carga acima de 1000", { sets: [set({ weightKg: 1001 })] }, "Carga deve estar entre 0 e 1000 kg"],
    ["carga negativa", { sets: [set({ weightKg: -1 })] }, "Carga deve estar entre 0 e 1000 kg"],
    ["sem séries", { sets: [] }, "Envie de 1 a 60 séries"],
    ["séries demais", { sets: Array.from({ length: 61 }, (_, i) => set({ setNumber: (i % 50) + 1 })) }, "Envie de 1 a 60 séries"],
    ["clientId inválido", { clientId: "x" }, "Identificador do treino inválido"],
    ["exercício desconhecido", { sets: [set({ exerciseId: "nao-existe" })] }, "Há exercícios que não existem no catálogo."],
    ["mesma posição, outro exercício", { sets: [set(), set({ setNumber: 2, exerciseId: fixtures[1].id })] }, "Há séries com exercício inconsistente na mesma posição."],
    ["série repetida", { sets: [set(), set()] }, "Há séries repetidas no treino."],
    ["fim antes do início", { startedAt: new Date().toISOString(), finishedAt: new Date(Date.now() - 60_000).toISOString() }, "O fim do treino não pode ser antes do início."],
    ["fim no futuro", { finishedAt: new Date(Date.now() + 7200_000).toISOString(), startedAt: new Date().toISOString() }, "O fim do treino não pode estar no futuro."],
  ])("400: %s", async (_n, over, msg) => {
    const { token } = await userWithPlan();
    const res = await api("POST", "/fit/sessions", payload(over), token);
    expect(res.status).toBe(400);
    expect(res.body.errors).toContain(msg);
  });

  test("404 em sessão inexistente", async () => {
    const { token } = await signup();
    expect((await api("GET", "/fit/sessions/999999999", undefined, token)).status).toBe(404);
  });
});
