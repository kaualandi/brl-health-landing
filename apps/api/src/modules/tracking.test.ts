import { describe, expect, it } from "bun:test";
import { today } from "../lib/date";
import { api } from "../test/http";
import { signup } from "../test/users";

const yesterday = () => today(new Date(Date.now() - 86_400_000));

describe("tracking", () => {
  it("water: round-trip, upsert, clamp e 0 no dia vazio", async () => {
    const { token } = await signup();
    expect((await api("GET", "/nutri/water", undefined, token)).body).toEqual({ ml: 0 });
    await api("POST", "/nutri/water", { ml: 500 }, token);
    expect((await api("POST", "/nutri/water", { ml: 750 }, token)).body).toEqual({ ml: 750 });
    expect((await api("GET", "/nutri/water", undefined, token)).body).toEqual({ ml: 750 });
    expect((await api("POST", "/nutri/water", { ml: -5 }, token)).body).toEqual({ ml: 0 });
  });

  it.each([
    ["weight", { kg: 80.5 }, { kg: 81 }, { kg: 81 }, { kg: 0 }, { kg: -3 }],
    ["sleep", { hours: 7.5 }, { hours: 8 }, { hours: 8 }, { hours: 0 }, { hours: -1 }],
    ["steps", { count: 1000 }, { count: 2000.4 }, { count: 2000 }, { count: 0 }, { count: -9 }],
  ])("%s: upsert, histórico asc por date e clamp", async (name, first, second, saved, zero, neg) => {
    const { token } = await signup();
    const p = `/nutri/${name}`;
    await api("POST", p, { ...first, date: yesterday() }, token);
    await api("POST", p, first, token);
    const post = await api("POST", p, second, token);
    expect(post.body).toEqual({ date: today(), ...saved });
    const list = (await api("GET", p, undefined, token)).body;
    expect(list).toEqual([{ date: yesterday(), ...first }, { date: today(), ...saved }]);
    expect((await api("POST", p, neg, token)).body).toEqual({ date: today(), ...zero });
  });

  it("measurements: mescla parcial e null quando vazio", async () => {
    const { token } = await signup();
    await api("POST", "/nutri/measurements", { waist: 80, hip: 95 }, token);
    expect((await api("POST", "/nutri/measurements", { waist: 79, arm: 30 }, token)).body).toEqual({ saved: true });
    expect((await api("GET", "/nutri/measurements", undefined, token)).body).toEqual([
      { date: today(), waist: 79, hip: 95, chest: null, arm: 30, thigh: null },
    ]);
  });

  it.each(["habits", "diary"])("%s: {} vazio, substitui e respeita date", async (name) => {
    const { token } = await signup();
    const p = `/nutri/${name}`;
    expect((await api("GET", p, undefined, token)).body).toEqual({});
    await api("POST", p, { done: { a: true, b: false } }, token);
    await api("POST", p, { done: { c: true } }, token);
    expect((await api("GET", p, undefined, token)).body).toEqual({ c: true });
    await api("POST", p, { done: { y: true }, date: yesterday() }, token);
    expect((await api("GET", `${p}?date=${yesterday()}`, undefined, token)).body).toEqual({ y: true });
  });

  it("400 (não 500) para overflow, medida negativa e data inválida", async () => {
    const { token } = await signup();
    const bad: [string, object][] = [
      ["water", { ml: 2147483648 }],
      ["weight", { kg: 10000 }],
      ["sleep", { hours: 25 }],
      ["steps", { count: 2147483648 }],
      ["measurements", { waist: 10000 }],
      ["measurements", { waist: -1 }],
      ["water", { ml: 1, date: "2026-02-31" }],
      ["water", { ml: 1, date: "2026-13-01" }],
      ["water", { ml: 1, date: "0000-01-01" }],
      ["habits", { done: { a: "x" } }],
    ];
    for (const [m, body] of bad) expect((await api("POST", `/nutri/${m}`, body, token)).status).toBe(400);
    for (const d of ["2026-02-31", "2026-13-01", "2026-00-10", "2026-02-99", "0000-01-01"])
      expect((await api("GET", `/nutri/water?date=${d}`, undefined, token)).status).toBe(400);
  });

  it("devolve o valor arredondado que foi gravado", async () => {
    const { token } = await signup();
    expect((await api("POST", "/nutri/weight", { kg: 80.55 }, token)).body).toEqual({ date: today(), kg: 80.6 });
    expect((await api("GET", "/nutri/weight", undefined, token)).body).toEqual([{ date: today(), kg: 80.6 }]);
  });

  it("401 sem token", async () => {
    for (const m of ["water", "weight", "sleep", "steps", "measurements", "habits", "diary"]) {
      expect((await api("GET", `/nutri/${m}`)).status).toBe(401);
      expect((await api("POST", `/nutri/${m}`, { ml: 1, kg: 1, hours: 1, count: 1, done: {} })).status).toBe(401);
    }
  });
});
