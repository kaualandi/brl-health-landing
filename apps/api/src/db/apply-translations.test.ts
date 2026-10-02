import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { eq, inArray } from "drizzle-orm";
import { db, schema } from ".";
import { applyTranslations } from "./apply-translations";
import { chunk, planTranslations, type Current } from "./apply-translations.lib";

const cur = (over: Partial<Current> = {}): Current => ({ instructions: ["a", "b"], namePt: null, instructionsPt: null, ...over });
const ok = { id: "x", name: "supino", instructions: ["um", "dois"] };

describe("planTranslations", () => {
  it("separa válidas, inválidas, desconhecidas e divergentes", () => {
    const raw = [ok, { id: "y", name: "", instructions: [] }, "lixo", { ...ok, id: "nope" }, { ...ok, id: "z", instructions: ["um"] }];
    const { updates, clears, report } = planTranslations(raw, new Map([["x", cur()], ["z", cur({ instructionsPt: ["velho", "velho2"] })]]));
    expect(updates).toEqual([ok]);
    expect(clears).toEqual(["z"]);
    expect(report).toEqual({ applied: 1, unchanged: 0, invalid: 2, unknown: 1, mismatched: 1 });
  });

  it("ignora o que já está igual", () => {
    const same = cur({ namePt: "supino", instructionsPt: ["um", "dois"] });
    expect(planTranslations([ok], new Map([["x", same]])).report.unchanged).toBe(1);
  });

  it("chunk divide em pedaços", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
});

describe("applyTranslations", () => {
  const dir = mkdtempSync(`${tmpdir()}/pt-`);
  const id = `tr${crypto.randomUUID().slice(0, 8)}`;
  const stale = `${id}s`;
  const file = new URL(`file://${dir}/pt.json`);
  beforeAll(async () => {
    const base = { name: "en", gifUrl: "https://x/y.gif", instructions: ["a", "b"] };
    await db.insert(schema.exercises).values([{ ...base, id }, { ...base, id: stale, instructionsPt: ["velho", "velho2", "velho3"] }]);
    writeFileSync(file, JSON.stringify([{ id, name: "pt", instructions: ["um", "dois"] }, { id: "inexistente-xyz", name: "n", instructions: ["a"] }, { id: stale, name: "ruim", instructions: ["só um"] }]));
  });
  afterAll(async () => {
    rmSync(dir, { recursive: true, force: true });
    await db.delete(schema.exercises).where(inArray(schema.exercises.id, [id, stale]));
  });

  it("aplica uma vez e é idempotente na segunda", async () => {
    const first = await applyTranslations(file);
    expect([first.applied, first.unknown, first.mismatched]).toEqual([1, 1, 1]);
    const [row] = await db.select().from(schema.exercises).where(eq(schema.exercises.id, id));
    expect([row.namePt, row.instructionsPt]).toEqual(["pt", ["um", "dois"]]);
    const [old] = await db.select().from(schema.exercises).where(eq(schema.exercises.id, stale));
    expect(old.instructionsPt).toBeNull();
    const second = await applyTranslations(file);
    expect(second.applied).toBe(0);
    expect(second.unchanged).toBe(1);
  });
});
