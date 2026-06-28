export type User = {
  id: string;
  name: string;
  email: string;
};

export type AuthResponse = {
  user: User;
  token: string;
};

export type PlanId = "free" | "pro" | "family";

export type Plan = {
  id: PlanId;
  name: string;
  priceLabel: string;
  monthlyPrice: number;
  /** Preço total cobrado no plano anual (mensal × 10 → 2 meses grátis). Ausente no Free. */
  annualPrice?: number;
  /** Rótulo curto do benefício anual, ex.: "2 meses grátis". */
  annualDiscountLabel?: string;
  tagline: string;
  features: string[];
  note?: string;
  highlighted: boolean;
  ctaLabel: string;
};

export type ContactSubject = "duvida" | "sugestao" | "parceria" | "outro";

export interface ContactFormData {
  name: string;
  email: string;
  subject: ContactSubject;
  message: string;
}

/* ------------------------------------------------------------------ */
/* BRL Nutri — onboarding, perfil e plano personalizado               */
/* ------------------------------------------------------------------ */

export type BiologicalSex = "male" | "female";

export type Goal = "lose" | "recomp" | "gain" | "performance" | "health";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "athlete";

export type DietStyle =
  | "omnivore"
  | "vegetarian"
  | "vegan"
  | "lowcarb"
  | "mediterranean";

export type Restriction =
  | "lactose"
  | "gluten"
  | "nuts"
  | "seafood"
  | "egg"
  | "none";

/** Dados coletados no onboarding — base da experiência personalizada. */
export interface NutriProfile {
  name: string;
  email: string;
  sex: BiologicalSex;
  age: number;
  heightCm: number;
  weightKg: number;
  goal: Goal;
  activity: ActivityLevel;
  diet: DietStyle;
  restrictions: Restriction[];
  mealsPerDay: number;
  waterGlasses: number;
  /** Peso alvo (kg). Opcional — perfis antigos podem não ter. */
  goalWeightKg?: number;
  /** Refeições escolhidas com horário. Opcional — perfis antigos não têm. */
  meals?: MealEntry[];
  /** Hora habitual de acordar (HH:MM). Usada pro auto-timing das refeições. */
  wakeTime?: string;
  /** Hora habitual de dormir (HH:MM). */
  sleepTime?: string;
  /** Hora do treino (HH:MM), quando há horário fixo. Encaixa pré/pós-treino. */
  trainTime?: string;
  createdAt: string;
}

/** Rotina do dia — base pra distribuir os horários das refeições. */
export interface DailyRoutine {
  wakeTime: string;
  sleepTime: string;
  /** Vazio/ausente quando não há treino em horário fixo. */
  trainTime?: string;
}

/** Uma refeição selecionada pelo usuário, com horário. */
export interface MealEntry {
  name: string;
  time: string;
}

export interface MealSlice {
  name: string;
  kcal: number;
  /** Horário da refeição (HH:MM), quando definido. */
  time?: string;
}

/** Plano calculado a partir do perfil (TDEE, macros, água, etc). */
export interface NutriPlan {
  bmr: number;
  tdee: number;
  targetCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  waterMl: number;
  bmi: number;
  bmiLabel: string;
  meals: MealSlice[];
}
