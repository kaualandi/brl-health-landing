import { describe, expect, it } from "vitest";

import type { FitPlanDay } from "@/lib/fit-plan";
import {
  createSession, dequeue, doneCount, enqueue, formatClock, overlayLoads, parseReps, parseWeight,
  pauseRest, restLeft, resumeRest, skipRest, toggleDone, toPayload, updateSet, volumeKg,
} from "./fit-session";

const ex = (order: number, id: string, sets: number, reps: string, restSeconds: number) => ({
  order, sets, reps, restSeconds,
  exercise: { id, name: id, gifUrl: "", targetMuscles: [], equipments: [] },
});
const day: FitPlanDay = { index: 1, name: "Treino B", focus: [], exercises: [ex(1, "a", 2, "8–10", 90), ex(2, "b", 1, "12–15", 45)] };
const base = () => createSession(day, { a: 40 }, new Date("2026-10-02T10:00:00Z"), "c1");

describe("createSession", () => {
  it("pré-preenche reps pelo mínimo e a última carga", () => {
    const s = base();
    expect(s.sets).toHaveLength(3);
    expect(s.sets[0]).toMatchObject({ exerciseId: "a", setNumber: 1, reps: 8, weightKg: 40, done: false });
    expect(s.sets[2]).toMatchObject({ exerciseId: "b", reps: 12, weightKg: null });
  });
});

describe("parse", () => {
  it("aceita vírgula e limita", () => {
    expect(parseWeight("22,5")).toBe(22.5);
    expect(parseWeight("5000")).toBe(1000);
    expect(parseWeight("")).toBeNull();
    expect(parseReps("abc")).toBe(0);
    expect(parseReps("500")).toBe(100);
  });
});

describe("volume e contagem", () => {
  it("soma só séries feitas", () => {
    let s = base();
    s = updateSet(s, 1, 1, { weightKg: 50, reps: 10 });
    s = toggleDone(s, 1, 1, 0);
    s = toggleDone(s, 1, 2, 0);
    s = updateSet(s, 2, 1, { weightKg: 100, reps: 10 });
    expect(doneCount(s.sets)).toBe(2);
    expect(volumeKg(s.sets)).toBe(50 * 10 + 40 * 8);
  });
});

describe("timer de descanso", () => {
  it("marcar inicia o descanso do exercício e desmarcar não", () => {
    let s = toggleDone(base(), 1, 1, 1000);
    expect(s.rest).toEqual({ total: 90, endsAt: 91_000, left: 90 });
    s = skipRest(s);
    s = toggleDone(s, 1, 1, 2000);
    expect(s.rest).toBeNull();
  });

  it("conta regressiva, pausa e retoma", () => {
    let s = toggleDone(base(), 2, 1, 0);
    expect(restLeft(s.rest!, 10_000)).toBe(35);
    s = pauseRest(s, 10_000);
    expect(restLeft(s.rest!, 99_000)).toBe(35);
    s = resumeRest(s, 100_000);
    expect(restLeft(s.rest!, 105_000)).toBe(30);
    expect(restLeft(s.rest!, 999_000)).toBe(0);
  });
});

describe("fila de reenvio", () => {
  it("não duplica por clientId e remove ao sincronizar", () => {
    const p = toPayload(base(), new Date("2026-10-02T11:00:00Z"));
    const q = enqueue(enqueue([], p), p);
    expect(q).toHaveLength(1);
    expect(dequeue(q, "c1")).toEqual([]);
    expect(p.finishedAt).toBe("2026-10-02T11:00:00.000Z");
  });

  it("cargas pendentes sobrepõem as do servidor", () => {
    let s = updateSet(base(), 1, 1, { weightKg: 55 });
    s = toggleDone(s, 1, 1, 0);
    expect(overlayLoads({ a: 40, z: 5 }, [toPayload(s, new Date())])).toEqual({ a: 55, z: 5 });
  });
});

describe("formatClock", () => {
  it("formata mm:ss e h:mm:ss", () => {
    expect(formatClock(65)).toBe("1:05");
    expect(formatClock(3725)).toBe("1:02:05");
  });
});
