import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { inArray } from "drizzle-orm";
import { db, schema } from "../db";
import { api } from "../test/http";
import { signup } from "../test/users";

const tag = crypto.randomUUID().slice(0, 8);
const ex = { id: `fx-${tag}-s`, name: `fx ${tag} s`, gifUrl: "https://example.test/x.gif", bodyParts: ["chest"], targetMuscles: ["pectorals"], secondaryMuscles: [] as string[], equipments: ["barbell"], instructions: [] as string[] };

beforeAll(async () => {
  await db.insert(schema.exercises).values(ex);
});
afterAll(async () => {
  await db.delete(schema.exercises).where(inArray(schema.exercises.id, [ex.id]));
});

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000 - 1000);
const post = (token: string, finished: Date, weightKg: number, reps: number) =>
  api("POST", "/fit/sessions", {
    clientId: crypto.randomUUID(),
    dayIndex: 0,
    dayName: "Treino A",
    startedAt: new Date(finished.getTime() - 1800_000).toISOString(),
    finishedAt: finished.toISOString(),
    sets: [{ exerciseId: ex.id, exerciseOrder: 1, setNumber: 1, weightKg, reps, done: true }],
  }, token);

describe("/fit/stats, /fit/records, /fit/exercises/:id/history", () => {
  test("401 sem token", async () => {
    for (const p of ["/fit/stats", "/fit/records", `/fit/exercises/${ex.id}/history`]) expect((await api("GET", p)).status).toBe(401);
  });

  test("usuário sem treinos: tudo zerado", async () => {
    const { token } = await signup();
    const stats = await api("GET", "/fit/stats", undefined, token);
    expect(stats.body.weeks).toHaveLength(8);
    expect(stats.body.streak).toEqual({ current: 0, best: 0 });
    expect(stats.body.totals).toEqual({ sessions: 0, volume: 0, minutes: 0 });
    expect((await api("GET", "/fit/records", undefined, token)).body).toEqual([]);
    expect((await api("GET", `/fit/exercises/${ex.id}/history`, undefined, token)).body.points).toEqual([]);
  });

  test("com treinos em semanas diferentes", async () => {
    const { token } = await signup();
    await post(token, daysAgo(14), 50, 10);
    await post(token, daysAgo(7), 60, 5);
    await post(token, daysAgo(0), 55, 10);
    const stats = (await api("GET", "/fit/stats", undefined, token)).body;
    expect(stats.totals).toEqual({ sessions: 3, volume: 500 + 300 + 550, minutes: 90 });
    expect(stats.streak.best).toBe(3);
    expect(stats.streak.current).toBe(3);
    expect(stats.recordsBroken).toBe(1);
    expect(stats.weeks.reduce((n: number, w: { sessions: number }) => n + w.sessions, 0)).toBe(3);
    const [rec] = (await api("GET", "/fit/records", undefined, token)).body;
    expect(rec).toMatchObject({ exerciseId: ex.id, maxWeightKg: 60, maxSetVolumeKg: 550, e1rmKg: 73.33 });
    expect(rec.broken).toBeUndefined();
    const hist = (await api("GET", `/fit/exercises/${ex.id}/history`, undefined, token)).body;
    expect(hist.points.map((p: { maxWeightKg: number }) => p.maxWeightKg)).toEqual([50, 60, 55]);
    expect(hist.name).toBeTruthy();
  });
});
