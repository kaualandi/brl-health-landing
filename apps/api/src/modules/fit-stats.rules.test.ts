import { describe, expect, test } from "bun:test";
import { buildWeeks, computeHistory, computeRecords, computeStreak, computeTotals, e1rm, weekStart } from "./fit-stats.rules";

const s = (date: string, volume = 100, seconds = 1800) => ({ date, volume, seconds });

describe("fit-stats.rules", () => {
  test("weekStart é a segunda-feira", () => {
    expect(weekStart("2026-10-02")).toBe("2026-09-28"); // sexta
    expect(weekStart("2026-09-28")).toBe("2026-09-28");
    expect(weekStart("2026-10-04")).toBe("2026-09-28"); // domingo
  });

  test("e1RM de Epley", () => {
    expect(e1rm(100, 1)).toBe(100);
    expect(e1rm(60, 10)).toBe(80);
  });

  test("8 semanas com zeros e soma por semana", () => {
    const w = buildWeeks([s("2026-10-02", 50), s("2026-09-29", 70), s("2026-08-01")], "2026-10-02");
    expect(w).toHaveLength(8);
    expect(w[7]).toEqual({ start: "2026-09-28", sessions: 2, volume: 120 });
    expect(w[6].sessions).toBe(0);
    expect(w[0].start).toBe("2026-08-10");
  });

  test("sequência semanal: atual tolera semana corrente vazia, quebra após 2", () => {
    expect(computeStreak([], "2026-10-02")).toEqual({ current: 0, best: 0 });
    expect(computeStreak(["2026-09-15", "2026-09-22"], "2026-10-02")).toEqual({ current: 2, best: 2 });
    expect(computeStreak(["2026-09-15", "2026-09-22"], "2026-10-09")).toEqual({ current: 0, best: 2 });
    expect(computeStreak(["2026-08-03", "2026-08-10", "2026-08-17", "2026-09-28"], "2026-10-02")).toEqual({ current: 1, best: 3 });
  });

  test("totais", () => {
    expect(computeTotals([s("2026-10-01", 10.5, 90), s("2026-10-02", 20, 90)])).toEqual({ sessions: 2, volume: 30.5, minutes: 3 });
  });

  const set = (date: string, weightKg: number, reps: number, id = "x") => ({ exerciseId: id, name: "Supino", date, sessionId: 1, weightKg, reps });

  test("série longa (30 reps) não gera e1RM nem supera a de 5 reps pesadas", () => {
    const sets = [set("2026-09-01", 100, 5), set("2026-09-08", 20, 30)];
    expect(e1rm(20, 30)).toBeNull();
    expect(computeRecords(sets)[0]).toMatchObject({ e1rmKg: 116.67, e1rmDate: "2026-09-01", maxSetVolumeKg: 600 });
    expect(computeHistory(sets)[1].e1rmKg).toBeNull();
    expect(computeRecords([set("2026-09-01", 20, 30)])[0].e1rmKg).toBeNull();
  });

  test("recordes e histórico", () => {
    const sets = [set("2026-09-01", 50, 10), set("2026-09-08", 60, 5), set("2026-09-08", 40, 15)];
    const [r] = computeRecords(sets);
    expect(r).toMatchObject({ maxWeightKg: 60, maxWeightDate: "2026-09-08", maxSetVolumeKg: 600, maxSetVolumeDate: "2026-09-08", e1rmKg: 70, broken: true });
    expect(computeHistory(sets)).toEqual([
      { date: "2026-09-01", maxWeightKg: 50, e1rmKg: 66.67 },
      { date: "2026-09-08", maxWeightKg: 60, e1rmKg: 70 },
    ]);
    expect(computeRecords([set("2026-09-01", 50, 10)])[0].broken).toBe(false);
  });
});
