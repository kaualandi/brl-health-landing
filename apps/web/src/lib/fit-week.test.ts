import { describe, expect, it } from "vitest";

import type { FitPlan } from "./fit-plan";
import { nextTabIndex, parseFitTab, upcomingDays, weekdayInSaoPaulo, workoutForWeekday } from "./fit-week";

const plan = (n: number): FitPlan => ({
  generatedAt: "",
  split: "x",
  days: Array.from({ length: n }, (_, index) => ({ index, name: `Treino ${index + 1}`, focus: [], exercises: [] })),
});

describe("workoutForWeekday", () => {
  it("3 treinos caem em seg/qua/sex e o resto é descanso", () => {
    expect(workoutForWeekday(plan(3), 1)?.name).toBe("Treino 1");
    expect(workoutForWeekday(plan(3), 3)?.name).toBe("Treino 2");
    expect(workoutForWeekday(plan(3), 5)?.name).toBe("Treino 3");
    for (const wd of [0, 2, 4, 6]) expect(workoutForWeekday(plan(3), wd)).toBeNull();
  });

  it("2 treinos usam seg e qui", () => {
    expect(workoutForWeekday(plan(2), 4)?.name).toBe("Treino 2");
    expect(workoutForWeekday(plan(2), 2)).toBeNull();
  });

  it("6 treinos descansam só no domingo", () => {
    expect(workoutForWeekday(plan(6), 0)).toBeNull();
    expect(workoutForWeekday(plan(6), 6)?.name).toBe("Treino 6");
  });
});

describe("parseFitTab", () => {
  it("aceita abas válidas e cai em hoje no resto", () => {
    expect(parseFitTab("biblioteca")).toBe("biblioteca");
    expect(parseFitTab("xyz")).toBe("hoje");
    expect(parseFitTab(null)).toBe("hoje");
  });
});

describe("weekdayInSaoPaulo", () => {
  it("usa o fuso de São Paulo, não UTC", () => {
    // 2026-10-05 (segunda) 01:00 UTC ainda é domingo em SP
    expect(weekdayInSaoPaulo(new Date("2026-10-05T01:00:00Z"))).toBe(0);
    expect(weekdayInSaoPaulo(new Date("2026-10-05T12:00:00Z"))).toBe(1);
  });
});

describe("nextTabIndex", () => {
  it("setas com wrap, Home e End", () => {
    expect(nextTabIndex("ArrowRight", 3, 4)).toBe(0);
    expect(nextTabIndex("ArrowRight", 0, 4)).toBe(1);
    expect(nextTabIndex("ArrowLeft", 0, 4)).toBe(3);
    expect(nextTabIndex("Home", 2, 4)).toBe(0);
    expect(nextTabIndex("End", 0, 4)).toBe(3);
  });
  it("ignora outras teclas", () => expect(nextTabIndex("Enter", 1, 4)).toBeNull());
});

describe("upcomingDays", () => {
  it("parte de hoje em São Paulo e segue a mesma regra de dias fixos", () => {
    // 2026-11-13 01:00 UTC = quinta 12/11, 22h em São Paulo
    const days = upcomingDays(plan(3), new Date("2026-11-13T01:00:00Z"));
    expect(days.map((d) => [d.weekday, d.date])).toEqual([[4, 12], [5, 13], [6, 14], [0, 15], [1, 16], [2, 17], [3, 18]]);
    expect(days.map((d) => d.day?.name ?? null)).toEqual([null, "Treino 3", null, null, "Treino 1", null, "Treino 2"]);
  });
});
