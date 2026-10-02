import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { inArray } from "drizzle-orm";
import { db, schema } from "../db";
import { api } from "../test/http";

const tag = crypto.randomUUID().slice(0, 8);
const base = { gifUrl: "https://example.com/x.gif", instructions: ["Step one", "Step two"] };
const rows = [
  { ...base, id: `p${tag}a`, name: `zz${tag} squat`, namePt: `zz${tag} agachamento`, instructionsPt: ["Passo um", "Passo dois"] },
  { ...base, id: `p${tag}b`, name: `zz${tag} plank` },
];
beforeAll(async () => void (await db.insert(schema.exercises).values(rows)));
afterAll(async () => void (await db.delete(schema.exercises).where(inArray(schema.exercises.id, rows.map((r) => r.id)))));

describe("exercícios em PT com fallback para EN", () => {
  it("devolve PT quando existe, mantendo nameEn", async () => {
    const { body } = await api("GET", `/exercises/${rows[0].id}`);
    expect(body.name).toBe(`zz${tag} agachamento`);
    expect(body.nameEn).toBe(`zz${tag} squat`);
    expect(body.instructions).toEqual(["Passo um", "Passo dois"]);
  });

  it("cai pro inglês sem tradução", async () => {
    const { body } = await api("GET", `/exercises/${rows[1].id}`);
    expect(body.name).toBe(`zz${tag} plank`);
    expect(body.instructions).toEqual(["Step one", "Step two"]);
  });

  it("ordena sem diferenciar maiúsculas de minúsculas", async () => {
    const extra = [
      { ...base, id: `p${tag}c`, name: `zz${tag} x`, namePt: `zz${tag} Banco` },
      { ...base, id: `p${tag}d`, name: `zz${tag} y`, namePt: `zz${tag} cadeira` },
      { ...base, id: `p${tag}e`, name: `zz${tag} z`, namePt: `zz${tag} Elevação` },
    ];
    await db.insert(schema.exercises).values(extra);
    const { body } = await api("GET", `/exercises?q=zz${tag}%20&limit=10`);
    const names = body.items.map((i: { name: string }) => i.name.slice(`zz${tag} `.length));
    await db.delete(schema.exercises).where(inArray(schema.exercises.id, extra.map((r) => r.id)));
    expect(names).toEqual(["agachamento", "Banco", "cadeira", "Elevação", "plank"]);
  });

  it("busca por termo PT e EN", async () => {
    const pt = await api("GET", `/exercises?q=zz${tag}%20agacha`);
    expect(pt.body.items.map((i: { id: string }) => i.id)).toEqual([rows[0].id]);
    const en = await api("GET", `/exercises?q=zz${tag}%20squat`);
    expect(en.body.items.map((i: { id: string }) => i.id)).toEqual([rows[0].id]);
    const list = await api("GET", `/exercises?q=zz${tag}`);
    expect(list.body.total).toBe(2);
  });
});
