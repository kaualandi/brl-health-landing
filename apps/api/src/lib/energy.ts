// Gasto do treino e bônus na meta do Nutri. Fatores/BMR espelham apps/web/src/lib/nutri-plan.ts.
export const ACTIVITY_FACTOR: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
};

const MAX_HOURS = 3;
const DEFAULT_TRAIN_DAYS = 3;

/** MET de musculação pela densidade de séries feitas/min: leve 3,5 · moderada 5,0 · vigorosa 6,0. */
export function metFor(setsDone: number, durationSeconds: number) {
  const density = setsDone / Math.max(durationSeconds / 60, 1);
  if (density < 0.15) return 3.5;
  return density < 0.3 ? 5 : 6;
}

/** kcal = MET × peso × horas (duração limitada a 3 h); sem peso, null. */
export function sessionKcal(weightKg: number | null, setsDone: number, durationSeconds: number) {
  if (!weightKg) return null;
  const hours = Math.min(durationSeconds / 3600, MAX_HOURS);
  return Math.round(metFor(setsDone, durationSeconds) * weightKg * hours);
}

export function bmr(p: { sex: string; weightKg: number; heightCm: number; age: number }) {
  return 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.sex === "male" ? 5 : -161);
}

/**
 * Bônus = max(0, kcal dos treinos de hoje − o que o fator de atividade já prevê por dia de treino).
 * Previsto = (fator − 1,2) × BMR × 7 / dias de treino por semana (o fator já embute o exercício).
 */
export function bonusKcal(workoutKcal: number, p: { activity: string; bmr: number; trainDays?: number | null }) {
  const extra = Math.max((ACTIVITY_FACTOR[p.activity] ?? 1.2) - 1.2, 0);
  const days = Math.min(Math.max(p.trainDays || DEFAULT_TRAIN_DAYS, 1), 7);
  return Math.max(0, Math.round(workoutKcal - (extra * p.bmr * 7) / days));
}
