import { describe, expect, test } from "vitest";

import { computeFitAchievements, newlyUnlocked } from "./fit-achievements";

const stats = (over = {}) => ({
  weeks: [],
  streak: { current: 0, best: 0 },
  totals: { sessions: 0, volume: 0, minutes: 0 },
  recordsBroken: 0,
  ...over,
});

describe("fit-achievements", () => {
  test("nada desbloqueado sem treinos", () => {
    expect(computeFitAchievements(stats()).some((a) => a.unlocked)).toBe(false);
  });

  test("marcos por treinos, sequência, recorde e volume", () => {
    const list = computeFitAchievements(stats({ totals: { sessions: 25, volume: 10_000, minutes: 1 }, streak: { current: 1, best: 4 }, recordsBroken: 1 }));
    expect(list.filter((a) => !a.unlocked).map((a) => a.id)).toEqual(["workouts-100"]);
    expect(list.find((a) => a.id === "workouts-100")!.progress).toBe(0.25);
  });

  test("newlyUnlocked ignora o que já foi visto", () => {
    const list = computeFitAchievements(stats({ totals: { sessions: 5, volume: 0, minutes: 0 } }));
    expect(newlyUnlocked(list, ["first-workout"])).toEqual(["workouts-5"]);
  });
});
