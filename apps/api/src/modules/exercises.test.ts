import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { inArray, sql } from "drizzle-orm";
import { config } from "../config";
import { db, schema } from "../db";
import { api } from "../test/http";
import { bodyPartLabels, equipmentLabels, label, muscleLabels } from "./exercises.labels";

const tag = crypto.randomUUID().slice(0, 8);
const mk = (n: string, over: Partial<typeof schema.exercises.$inferInsert> = {}) => ({
  id: `t${tag}${n}`,
  name: `zz${tag} ${n}`,
  gifUrl: `https://example.com/${n}.gif`,
  bodyParts: ["chest"],
  targetMuscles: ["pectorals"],
  secondaryMuscles: ["triceps"],
  equipments: ["barbell"],
  instructions: ["Passo um", "Passo dois"],
  ...over,
});
const fixtures = [
  mk("a", { name: `zz${tag} 100%_press` }),
  mk("b", { bodyParts: ["back"], targetMuscles: ["latissimus dorsi"], equipments: ["cable"] }),
  mk("c", { bodyParts: ["back"], equipments: ["dumbbell"], mediaPath: "x.gif" }),
  mk("d", { bodyParts: ["waist"], targetMuscles: ["abdominals"], equipments: ["bodyweight"] }),
  mk("e", { equipments: ["dumbbell"] }),
];

beforeAll(async () => {
  await db.insert(schema.exercises).values(fixtures);
});
afterAll(async () => {
  await db.delete(schema.exercises).where(inArray(schema.exercises.id, fixtures.map((f) => f.id)));
});

const list = (qs: string) => api("GET", `/exercises?q=zz${tag}&${qs}`);

describe("GET /exercises", () => {
  it("busca por nome com shape do item", async () => {
    const { status, body } = await list("");
    expect(status).toBe(200);
    expect(body.total).toBe(5);
    expect(body.hasMore).toBe(false);
    const item = body.items[0];
    expect(Object.keys(item).sort()).toEqual(
      ["bodyParts", "equipments", "gifUrl", "id", "instructions", "name", "secondaryMuscles", "targetMuscles"],
    );
    expect(item.bodyParts[0]).toEqual({ value: "chest", label: "Peito" });
  });

  it("escapa % e _ no termo", async () => {
    const { body } = await api("GET", `/exercises?q=${encodeURIComponent(`zz${tag} 100%_`)}`);
    expect(body.total).toBe(1);
    const none = await api("GET", `/exercises?q=${encodeURIComponent(`zz${tag}%`)}`);
    expect(none.body.total).toBe(0);
  });

  it("filtros bodyPart, equipment e muscle", async () => {
    expect((await list("bodyPart=back")).body.total).toBe(2);
    expect((await list("equipment=dumbbell")).body.total).toBe(2);
    expect((await list("muscle=abdominals")).body.total).toBe(1);
    expect((await list("bodyPart=back&equipment=cable")).body.total).toBe(1);
  });

  it("paginação: total, hasMore e offset", async () => {
    const p1 = (await list("limit=2")).body;
    expect([p1.total, p1.items.length, p1.hasMore]).toEqual([5, 2, true]);
    const p3 = (await list("limit=2&offset=4")).body;
    expect([p3.items.length, p3.hasMore]).toEqual([1, false]);
  });

  it("limit > 100 é clampado", async () => {
    const { status, body } = await api("GET", "/exercises?limit=500");
    expect(status).toBe(200);
    expect(body.items.length).toBeLessThanOrEqual(100);
  });

  it("gifUrl aponta pro nosso host quando há mediaPath", async () => {
    const { body } = await list("");
    const byName = (n: string) => body.items.find((i: { id: string }) => i.id === `t${tag}${n}`);
    expect(byName("c").gifUrl).toBe(`${config.publicUrl}/media/exercises/x.gif`);
    expect(byName("a").gifUrl).toBe("https://example.com/a.gif");
  });
});

describe("GET /exercises/filters e /:id", () => {
  it("filtros com rótulo, ordenados, e atribuição", async () => {
    const { body } = await api("GET", "/exercises/filters");
    expect(body.attribution).toBe("Dados e GIFs: ExerciseDB");
    expect(body.bodyParts).toContainEqual({ value: "waist", label: "Abdômen" });
    expect(body.equipments).toContainEqual({ value: "dumbbell", label: "Halteres" });
    expect(body.muscles).toContainEqual({ value: "abdominals", label: "Abdominais" });
    const labels = body.bodyParts.map((b: { label: string }) => b.label);
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b, "pt-BR")));
  });

  it("detalhe e 404", async () => {
    const ok = await api("GET", `/exercises/t${tag}a`);
    expect(ok.status).toBe(200);
    expect(ok.body.instructions).toEqual(["Passo um", "Passo dois"]);
    const miss = await api("GET", "/exercises/nao-existe");
    expect(miss.status).toBe(404);
    expect(miss.body).toEqual({ error: "Exercício não encontrado" });
  });
});

describe("GET /media/exercises/:file", () => {
  it("bloqueia path traversal e arquivo inexistente", async () => {
    for (const p of ["..%2F..%2F.env", "..%2Fx.gif", "x.png", "nao-existe.gif"]) {
      expect((await api("GET", `/media/exercises/${p}`)).status).toBe(404);
    }
  });
});

describe("dicionário PT-BR", () => {
  it("todo valor presente no banco tem rótulo", async () => {
    const rows = await db.execute<{ c: string; v: string }>(sql`
      select 'b' c, unnest(body_parts) v from exercises union
      select 'm', unnest(target_muscles) from exercises union
      select 'm', unnest(secondary_muscles) from exercises union
      select 'e', unnest(equipments) from exercises`);
    const dicts: Record<string, Record<string, string>> = { b: bodyPartLabels, m: muscleLabels, e: equipmentLabels };
    for (const { c, v } of rows) expect(dicts[c][v]).toBeDefined();
  });

  it("cobre as listas oficiais e capitaliza desconhecidos", () => {
    expect(Object.keys(bodyPartLabels)).toHaveLength(10);
    expect(Object.keys(equipmentLabels)).toHaveLength(30);
    expect(Object.keys(muscleLabels)).toHaveLength(38);
    expect(label(bodyPartLabels, "foo bar")).toEqual({ value: "foo bar", label: "Foo bar" });
  });
});
