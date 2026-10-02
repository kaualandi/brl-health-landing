import { describe, expect, test } from "bun:test";
import { ACTIVITY_FACTOR, bmr, bonusKcal, metFor, sessionKcal } from "./energy";

const p = { sex: "male", weightKg: 80, heightCm: 180, age: 30 };
const base = bmr(p); // 1780

test("espelho do Nutri: BMR e fatores travados", () => {
  expect(base).toBe(1780);
  expect(ACTIVITY_FACTOR).toEqual({ sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, athlete: 1.9 });
});

describe("sessionKcal", () => {
  test("MET por densidade", () => {
    expect(metFor(6, 3600)).toBe(3.5);
    expect(metFor(15, 3600)).toBe(5);
    expect(metFor(30, 3600)).toBe(6);
  });
  test("MET × kg × h, com teto de 3 h e sem peso null", () => {
    expect(sessionKcal(80, 15, 3600)).toBe(400);
    expect(sessionKcal(80, 100, 10 * 3600)).toBe(Math.round(metFor(100, 36000) * 80 * 3));
    expect(sessionKcal(null, 15, 3600)).toBeNull();
  });
});

describe("bonusKcal (sem dupla contagem)", () => {
  test("sedentário que treina: bônus integral", () => {
    expect(bonusKcal(400, { activity: "sedentary", bmr: base, trainDays: 3 })).toBe(400);
  });
  test("muito ativo que treina leve: 0", () => {
    expect(bonusKcal(250, { activity: "athlete", bmr: base, trainDays: 3 })).toBe(0);
  });
  test("moderado: só o excedente", () => {
    // previsto = 0,35 × 1780 × 7/3 ≈ 1454 → 2000 kcal passa 546
    expect(bonusKcal(2000, { activity: "moderate", bmr: base, trainDays: 3 })).toBe(Math.round(2000 - (0.35 * base * 7) / 3));
  });
  test("nenhum treino: 0", () => {
    expect(bonusKcal(0, { activity: "sedentary", bmr: base })).toBe(0);
  });
});
