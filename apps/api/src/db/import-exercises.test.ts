import { describe, expect, it } from "bun:test";
import { fetchExercises, fetchRetry, mapExercise, type RawExercise } from "./import-exercises.lib";

const raw = (i: number): RawExercise => ({
  exerciseId: `id${i}`,
  name: `ex ${i}`,
  gifUrl: `https://x/${i}.gif`,
  bodyParts: ["chest"],
  equipments: ["barbell"],
  targetMuscles: ["pectorals"],
  secondaryMuscles: [],
  instructions: ["Step:1 Deite.", "Step:12 Empurre."],
});
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const noSleep = async () => {};

describe("importador", () => {
  it("mapExercise tira o prefixo Step:N", () => {
    const m = mapExercise(raw(1));
    expect(m.id).toBe("id1");
    expect(m.instructions).toEqual(["Deite.", "Empurre."]);
  });

  it("pagina por cursor até acabar, pausando entre páginas", async () => {
    const urls: string[] = [];
    let pauses = 0;
    const f = (async (url: string) => {
      urls.push(url);
      const after = new URL(url).searchParams.get("after");
      const n = after ? Number(after.slice(1)) : 0;
      return json({ meta: { total: 5, hasNextPage: n + 2 < 5, nextCursor: `c${n + 2}` }, data: [raw(n), raw(n + 1)].filter((_, i) => n + i < 5) });
    }) as unknown as typeof fetch;
    const ids: string[] = [];
    for await (const page of fetchExercises({ fetch: f, sleep: async () => void pauses++ })) ids.push(...page.map((e) => e.exerciseId));
    expect(ids).toEqual(["id0", "id1", "id2", "id3", "id4"]);
    expect(urls[1]).toContain("after=c2");
    expect(urls).toHaveLength(3);
    expect(pauses).toBe(2);
  });

  it("respeita limit", async () => {
    const f = (async () => json({ meta: { total: 100, hasNextPage: true, nextCursor: "x" }, data: [raw(0), raw(1), raw(2)] })) as unknown as typeof fetch;
    const out: RawExercise[] = [];
    for await (const page of fetchExercises({ fetch: f, sleep: noSleep, limit: 2 })) out.push(...page);
    expect(out).toHaveLength(2);
  });

  it("retenta 429/5xx com backoff e desiste em 4xx", async () => {
    const seq = [429, 503, 200];
    const sleeps: number[] = [];
    const f = (async () => json({}, seq.shift())) as unknown as typeof fetch;
    const res = await fetchRetry("u", { fetch: f, sleep: async (ms) => void sleeps.push(ms) });
    expect(res.status).toBe(200);
    expect(sleeps).toEqual([500, 1000]);
    const bad = (async () => json({}, 404)) as unknown as typeof fetch;
    await expect(fetchRetry("u", { fetch: bad, sleep: noSleep })).rejects.toThrow("HTTP 404");
  });
});
