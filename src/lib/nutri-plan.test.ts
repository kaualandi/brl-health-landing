import { describe, expect, it } from "vitest";

import {
  computeNutriPlan,
  estimateWeeksToGoal,
  macroKcal,
} from "@/lib/nutri-plan";
import type { ActivityLevel, Goal, NutriPlan, NutriProfile } from "@/types";

/**
 * Perfil base de teste. Sem o campo `meals` (MealEntry[]) de propósito: assim o
 * cálculo usa `buildMeals` (templates por nº de refeições), não a agenda.
 */
function makeProfile(overrides: Partial<NutriProfile> = {}): NutriProfile {
  return {
    name: "Teste",
    email: "teste@brl.com",
    sex: "male",
    age: 30,
    heightCm: 180,
    weightKg: 80,
    goal: "health",
    activity: "sedentary",
    diet: "omnivore",
    restrictions: [],
    mealsPerDay: 3,
    waterGlasses: 8,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("computeNutriPlan — BMR (Mifflin-St Jeor)", () => {
  it("calcula o BMR masculino (10*kg + 6.25*cm - 5*age + 5)", () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    const plan = computeNutriPlan(
      makeProfile({ sex: "male", weightKg: 80, heightCm: 180, age: 30 }),
    );
    expect(plan.bmr).toBe(1780);
  });

  it("calcula o BMR feminino (10*kg + 6.25*cm - 5*age - 161)", () => {
    // 10*60 + 6.25*165 - 5*30 - 161 = 600 + 1031.25 - 150 - 161 = 1320.25 -> 1320
    const plan = computeNutriPlan(
      makeProfile({ sex: "female", weightKg: 60, heightCm: 165, age: 30 }),
    );
    expect(plan.bmr).toBe(1320);
  });
});

describe("computeNutriPlan — TDEE escala com a atividade", () => {
  it("aplica o fator de atividade sobre o BMR", () => {
    // bmr = 1780 -> sedentary 1.2 = 2136 ; athlete 1.9 = 3382
    const sedentary = computeNutriPlan(makeProfile({ activity: "sedentary" }));
    const athlete = computeNutriPlan(makeProfile({ activity: "athlete" }));

    expect(sedentary.tdee).toBe(2136);
    expect(athlete.tdee).toBe(3382);
  });

  it("aumenta o TDEE de forma monotônica entre os níveis", () => {
    const levels: ActivityLevel[] = [
      "sedentary",
      "light",
      "moderate",
      "active",
      "athlete",
    ];
    const tdees = levels.map(
      (activity) => computeNutriPlan(makeProfile({ activity })).tdee,
    );
    const sorted = [...tdees].sort((a, b) => a - b);
    expect(tdees).toEqual(sorted);
    expect(new Set(tdees).size).toBe(levels.length);
  });
});

describe("computeNutriPlan — objetivo ajusta as calorias na direção certa", () => {
  it("perder < manter (saúde) < ganhar", () => {
    const lose = computeNutriPlan(makeProfile({ goal: "lose" }));
    const health = computeNutriPlan(makeProfile({ goal: "health" }));
    const gain = computeNutriPlan(makeProfile({ goal: "gain" }));

    expect(lose.targetCalories).toBeLessThan(health.targetCalories);
    expect(health.targetCalories).toBeLessThan(gain.targetCalories);
  });

  it("déficit no objetivo de perda (alvo abaixo do TDEE)", () => {
    const lose = computeNutriPlan(makeProfile({ goal: "lose" }));
    expect(lose.targetCalories).toBeLessThan(lose.tdee);
  });
});

describe("computeNutriPlan — IMC (valor + classificação)", () => {
  it("calcula o IMC com uma casa decimal e classifica peso saudável", () => {
    // 80 / 1.8^2 = 24.69... -> 24.7 (< 25)
    const plan = computeNutriPlan(makeProfile({ weightKg: 80, heightCm: 180 }));
    expect(plan.bmi).toBe(24.7);
    expect(plan.bmiLabel).toBe("Peso saudável");
  });

  it("classifica a fronteira 25.0 como sobrepeso (limite é < 25)", () => {
    // 81 / 1.8^2 = 25.0 exato
    const plan = computeNutriPlan(makeProfile({ weightKg: 81, heightCm: 180 }));
    expect(plan.bmi).toBe(25);
    expect(plan.bmiLabel).toBe("Sobrepeso");
  });

  it("classifica abaixo do peso e obesidade nas pontas", () => {
    const baixo = computeNutriPlan(
      makeProfile({ weightKg: 50, heightCm: 180 }),
    );
    expect(baixo.bmiLabel).toBe("Abaixo do peso");

    const obeso = computeNutriPlan(
      makeProfile({ weightKg: 100, heightCm: 170 }),
    );
    expect(obeso.bmiLabel).toBe("Obesidade");
  });
});

describe("computeNutriPlan — água arredonda para múltiplos de 50ml", () => {
  it("80kg -> 2800ml e sempre múltiplo de 50", () => {
    const plan = computeNutriPlan(makeProfile({ weightKg: 80 }));
    expect(plan.waterMl).toBe(2800);
    expect(plan.waterMl % 50).toBe(0);

    const outro = computeNutriPlan(makeProfile({ weightKg: 72 }));
    expect(outro.waterMl % 50).toBe(0);
  });
});

describe("computeNutriPlan — nº de refeições clampado entre 3 e 6", () => {
  it.each([
    [1, 3],
    [3, 3],
    [4, 4],
    [6, 6],
    [10, 6],
  ])("mealsPerDay=%i resulta em %i refeições", (mealsPerDay, expected) => {
    const plan = computeNutriPlan(makeProfile({ mealsPerDay }));
    expect(plan.meals.length).toBe(expected);
    expect(plan.meals.length).toBeGreaterThanOrEqual(3);
    expect(plan.meals.length).toBeLessThanOrEqual(6);
  });

  it("kcal de cada refeição arredondada para múltiplos de 5", () => {
    const plan = computeNutriPlan(makeProfile({ mealsPerDay: 5 }));
    for (const meal of plan.meals) {
      expect(meal.kcal % 5).toBe(0);
    }
  });
});

describe("computeNutriPlan — macros positivos e carbo nunca negativo", () => {
  it("proteína e gordura positivas, carbo >= 0 em um perfil normal", () => {
    const plan = computeNutriPlan(makeProfile());
    expect(plan.protein).toBeGreaterThan(0);
    expect(plan.fat).toBeGreaterThan(0);
    expect(plan.carbs).toBeGreaterThanOrEqual(0);
  });

  it("carbo nunca fica negativo em vários objetivos", () => {
    const goals: Goal[] = ["lose", "recomp", "gain", "performance", "health"];
    for (const goal of goals) {
      const plan = computeNutriPlan(makeProfile({ goal }));
      expect(plan.carbs).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("macroKcal", () => {
  it("os percentuais somam ~100 e são positivos", () => {
    const plan = computeNutriPlan(makeProfile());
    const macros = macroKcal(plan);

    expect(macros.protein).toBe(plan.protein * 4);
    expect(macros.carbs).toBe(plan.carbs * 4);
    expect(macros.fat).toBe(plan.fat * 9);

    const sum = macros.proteinPct + macros.carbsPct + macros.fatPct;
    expect(sum).toBeGreaterThanOrEqual(99);
    expect(sum).toBeLessThanOrEqual(101);
    expect(macros.proteinPct).toBeGreaterThan(0);
    expect(macros.carbsPct).toBeGreaterThan(0);
    expect(macros.fatPct).toBeGreaterThan(0);
  });

  it("não divide por zero quando todos os macros são 0", () => {
    const emptyPlan: NutriPlan = {
      bmr: 0,
      tdee: 0,
      targetCalories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      waterMl: 0,
      bmi: 0,
      bmiLabel: "—",
      meals: [],
    };
    const macros = macroKcal(emptyPlan);
    expect(macros.proteinPct).toBe(0);
    expect(macros.carbsPct).toBe(0);
    expect(macros.fatPct).toBe(0);
    expect(Number.isNaN(macros.proteinPct)).toBe(false);
  });
});

describe("estimateWeeksToGoal", () => {
  it("retorna semanas positivas quando há déficit", () => {
    const plan = computeNutriPlan(makeProfile({ goal: "lose" }));
    const weeks = estimateWeeksToGoal(plan, 80, 75);
    expect(weeks).not.toBeNull();
    expect(weeks as number).toBeGreaterThan(0);
    expect(Number.isInteger(weeks)).toBe(true);
  });

  it("retorna null quando já está na meta (resto < 0.1kg)", () => {
    const plan = computeNutriPlan(makeProfile({ goal: "lose" }));
    expect(estimateWeeksToGoal(plan, 80, 80)).toBeNull();
  });

  it("retorna null quando o ritmo é desprezível (< 0.02kg/semana)", () => {
    // Objetivo "health": alvo ~= TDEE, então o delta diário é ínfimo.
    const plan = computeNutriPlan(makeProfile({ goal: "health" }));
    expect(estimateWeeksToGoal(plan, 80, 78)).toBeNull();
  });
});
