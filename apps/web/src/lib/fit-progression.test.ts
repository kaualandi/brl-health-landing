import { describe, expect, it } from "vitest";

import { nextLabel } from "./fit-progression";

const item = (over: object) => ({ weightKg: 42.5, reps: 8, sets: 3, reason: "up" as const, ...over });

describe("nextLabel", () => {
  it("carga e reps", () => expect(nextLabel(item({}))).toBe("Próxima: 42,5 kg × 8"));
  it("peso corporal", () => {
    expect(nextLabel(item({ weightKg: null, reps: 11 }))).toBe("Próxima: +1 rep (11)");
    expect(nextLabel(item({ weightKg: null, reps: 9, reason: "hold" }))).toBe("Próxima: 9 reps");
  });
  it("deload", () => expect(nextLabel(item({ reason: "deload", weightKg: 25 }))).toBe("Deload: 25 kg × 8 · 3 séries"));
  it("sem histórico", () => {
    expect(nextLabel(item({ reason: "new" }))).toBeNull();
    expect(nextLabel(undefined)).toBeNull();
  });
});
