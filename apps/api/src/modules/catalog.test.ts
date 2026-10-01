import { describe, expect, it } from "bun:test";
import { api } from "../test/http";

const nums = (o: Record<string, unknown>, keys: string[]) =>
  keys.forEach((k) => expect(typeof o[k]).toBe("number"));

describe("catálogos públicos", () => {
  it("GET /foods", async () => {
    const { status, body } = await api("GET", "/foods");
    expect(status).toBe(200);
    expect(body).toHaveLength(32);
    nums(body[0], ["kcal", "protein", "carb", "fat"]);
    expect(Array.isArray(body[0].diets)).toBe(true);
    expect(Array.isArray(body[0].excludedBy)).toBe(true);
    expect(body[0]).toHaveProperty("portion");
  });

  it("GET /nutritionists", async () => {
    const { body } = await api("GET", "/nutritionists");
    expect(body).toHaveLength(4);
    nums(body[0], ["rating", "reviews", "years"]);
    for (const k of ["avatar", "crn", "focus", "bio"]) expect(typeof body[0][k]).toBe("string");
    expect(Array.isArray(body[0].goals)).toBe(true);
  });

  it("GET /articles sem body e /articles/:id com body", async () => {
    const { body } = await api("GET", "/articles");
    expect(body).toHaveLength(8);
    expect(body[0]).not.toHaveProperty("body");
    expect(body[0]).toHaveProperty("readTime");
    const one = await api("GET", `/articles/${body[0].id}`);
    expect(one.status).toBe(200);
    expect(Array.isArray(one.body.body)).toBe(true);
    const miss = await api("GET", "/articles/nao-existe");
    expect(miss.status).toBe(404);
    expect(miss.body).toEqual({ error: "Artigo não encontrado" });
  });

  it("GET /recipes no shape RecipeFull", async () => {
    const { body } = await api("GET", "/recipes");
    expect(body).toHaveLength(10);
    const r = body[0];
    expect(typeof r.time).toBe("string");
    expect(r).not.toHaveProperty("prepTime");
    nums(r, ["kcal", "servings"]);
    nums(r.macros, ["protein", "carbs", "fat"]);
    for (const k of ["goals", "ingredients", "steps", "tags"]) expect(Array.isArray(r[k])).toBe(true);
    const one = await api("GET", `/recipes/${r.id}`);
    expect(one.body).toEqual(r);
    const miss = await api("GET", "/recipes/nao-existe");
    expect(miss.status).toBe(404);
    expect(miss.body).toEqual({ error: "Receita não encontrada" });
  });
});
