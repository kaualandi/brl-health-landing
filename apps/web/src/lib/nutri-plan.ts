import { buildScheduledMeals } from "@/lib/meals";
import type {
  ActivityLevel,
  Goal,
  MealSlice,
  NutriPlan,
  NutriProfile,
} from "@/types";

/** Multiplicadores de gasto energético por nível de atividade. */
const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
};

/** Ajuste calórico sobre o TDEE conforme o objetivo. */
const GOAL_ADJUST: Record<Goal, number> = {
  lose: -0.18,
  recomp: -0.05,
  gain: 0.12,
  performance: 0.08,
  health: 0,
};

/** Proteína alvo (g por kg de peso) por objetivo. */
const PROTEIN_PER_KG: Record<Goal, number> = {
  lose: 2.0,
  recomp: 1.9,
  gain: 1.8,
  performance: 1.8,
  health: 1.6,
};

/** Repartição das calorias do dia por número de refeições. */
const MEAL_TEMPLATES: Record<number, { name: string; ratio: number }[]> = {
  3: [
    { name: "Café da manhã", ratio: 0.3 },
    { name: "Almoço", ratio: 0.4 },
    { name: "Jantar", ratio: 0.3 },
  ],
  4: [
    { name: "Café da manhã", ratio: 0.27 },
    { name: "Almoço", ratio: 0.35 },
    { name: "Lanche da tarde", ratio: 0.13 },
    { name: "Jantar", ratio: 0.25 },
  ],
  5: [
    { name: "Café da manhã", ratio: 0.24 },
    { name: "Lanche da manhã", ratio: 0.1 },
    { name: "Almoço", ratio: 0.31 },
    { name: "Lanche da tarde", ratio: 0.12 },
    { name: "Jantar", ratio: 0.23 },
  ],
  6: [
    { name: "Café da manhã", ratio: 0.22 },
    { name: "Lanche da manhã", ratio: 0.1 },
    { name: "Almoço", ratio: 0.28 },
    { name: "Lanche da tarde", ratio: 0.12 },
    { name: "Jantar", ratio: 0.21 },
    { name: "Ceia", ratio: 0.07 },
  ],
};

function classifyBmi(bmi: number): string {
  if (bmi < 18.5) return "Abaixo do peso";
  if (bmi < 25) return "Peso saudável";
  if (bmi < 30) return "Sobrepeso";
  return "Obesidade";
}

function buildMeals(targetCalories: number, mealsPerDay: number): MealSlice[] {
  const template =
    MEAL_TEMPLATES[mealsPerDay] ?? MEAL_TEMPLATES[Math.min(Math.max(mealsPerDay, 3), 6)] ?? MEAL_TEMPLATES[3];

  return template.map((meal) => ({
    name: meal.name,
    kcal: Math.round((targetCalories * meal.ratio) / 5) * 5,
  }));
}

/**
 * Calcula o plano nutricional a partir do perfil.
 * BMR via Mifflin-St Jeor, TDEE pelo nível de atividade e ajuste por objetivo.
 */
export function computeNutriPlan(profile: NutriProfile): NutriPlan {
  const { sex, age, heightCm, weightKg, activity, goal, mealsPerDay } = profile;

  const bmr =
    sex === "male"
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  const tdee = bmr * ACTIVITY_FACTOR[activity];
  const targetRaw = tdee * (1 + GOAL_ADJUST[goal]);
  const targetCalories = Math.round(targetRaw / 10) * 10;

  const protein = Math.round(PROTEIN_PER_KG[goal] * weightKg);
  const proteinKcal = protein * 4;
  const fatKcal = targetCalories * 0.27;
  const fat = Math.round(fatKcal / 9);
  const carbsKcal = Math.max(targetCalories - proteinKcal - fatKcal, 0);
  const carbs = Math.round(carbsKcal / 4);

  const waterMl = Math.round((weightKg * 35) / 50) * 50;

  const heightM = heightCm / 100;
  const bmi = Number((weightKg / (heightM * heightM)).toFixed(1));

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetCalories,
    protein,
    carbs,
    fat,
    waterMl,
    bmi,
    bmiLabel: classifyBmi(bmi),
    meals:
      profile.meals && profile.meals.length > 0
        ? buildScheduledMeals(profile.meals, targetCalories)
        : buildMeals(targetCalories, mealsPerDay),
  };
}

/** Calorias de cada macro — útil para barras e percentuais. */
export function macroKcal(plan: NutriPlan) {
  const protein = plan.protein * 4;
  const carbs = plan.carbs * 4;
  const fat = plan.fat * 9;
  const total = Math.max(protein + carbs + fat, 1);
  return {
    protein,
    carbs,
    fat,
    proteinPct: Math.round((protein / total) * 100),
    carbsPct: Math.round((carbs / total) * 100),
    fatPct: Math.round((fat / total) * 100),
  };
}

/**
 * Estimativa de semanas pra atingir a meta de peso, a partir do
 * déficit/superávit diário do plano (~7700 kcal ≈ 1 kg).
 * Retorna null quando não dá pra estimar (sem déficit ou já na meta).
 */
export function estimateWeeksToGoal(
  plan: NutriPlan,
  currentKg: number,
  goalKg: number,
): number | null {
  const dailyDelta = plan.tdee - plan.targetCalories; // >0 = déficit, <0 = superávit
  const kgPerWeek = (Math.abs(dailyDelta) * 7) / 7700;
  const remaining = Math.abs(goalKg - currentKg);
  if (kgPerWeek < 0.02 || remaining < 0.1) return null;
  return Math.ceil(remaining / kgPerWeek);
}
