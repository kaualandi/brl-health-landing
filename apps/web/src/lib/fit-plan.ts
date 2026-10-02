export type FitLabelled = { value: string; label: string };

/** Espelha GET /fit/plan e POST /fit/plan/generate. */
export type FitPlanExercise = {
  order: number;
  exercise: { id: string; name: string; gifUrl: string; targetMuscles: FitLabelled[]; equipments: FitLabelled[] };
  sets: number;
  reps: string;
  restSeconds: number;
};

export type FitPlanDay = { index: number; name: string; focus: string[]; exercises: FitPlanExercise[] };

export type FitPlan = { generatedAt: string; split: string; days: FitPlanDay[] };

/** Espelha GET /fit/plan/days/:day/exercises/:order/alternatives. */
export type FitAlternative = FitPlanExercise["exercise"];
