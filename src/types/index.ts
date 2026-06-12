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
  createdAt: string;
}

export interface MealSlice {
  name: string;
  kcal: number;
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
