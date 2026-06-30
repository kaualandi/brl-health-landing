import type { DietStyle, Restriction } from "@/types";

export type FoodRole =
  | "protein"
  | "carb"
  | "veg"
  | "fruit"
  | "fat"
  | "dairy"
  | "drink";

export type Food = {
  id: string;
  name: string;
  emoji: string;
  role: FoodRole;
  /** Porção sugerida (texto livre, ex.: "120 g", "2 fatias"). */
  portion: string;
  /** Calorias aproximadas da porção. */
  kcal: number;
  /** Macros aproximados da porção, em gramas. */
  protein: number;
  carb: number;
  fat: number;
  /** Dietas que aceitam o alimento (ausente = todas). */
  diets?: DietStyle[];
  /** Restrições que excluem o alimento. */
  excludedBy?: Restriction[];
};


/** Composição de papéis por refeição. */
const MEAL_ROLES: Record<string, FoodRole[]> = {
  "Café da manhã": ["protein", "carb", "fruit", "drink"],
  "Lanche da manhã": ["fruit", "fat"],
  Almoço: ["protein", "carb", "veg"],
  "Lanche da tarde": ["dairy", "fruit"],
  "Pré-treino": ["carb", "fruit"],
  "Pós-treino": ["protein", "carb"],
  Jantar: ["protein", "carb", "veg"],
  Ceia: ["dairy", "fruit"],
};

const GENERIC_ROLES: FoodRole[] = ["protein", "carb", "veg"];

/** Hash estável de string → inteiro não-negativo (escolha determinística). */
function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function candidates(
  catalog: Food[],
  role: FoodRole,
  diet: DietStyle,
  restrictions: Restriction[],
): Food[] {
  return catalog.filter(
    (food) =>
      food.role === role &&
      (!food.diets || food.diets.includes(diet)) &&
      !food.excludedBy?.some((r) => restrictions.includes(r)),
  );
}

export type MealFood = { food: Food; key: string };

/**
 * Monta os alimentos de uma refeição a partir da dieta/restrições.
 * Determinístico; `overrides[key]` desloca a escolha (usado pra "trocar").
 */
export function buildMealFoods(
  catalog: Food[],
  mealName: string,
  diet: DietStyle,
  restrictions: Restriction[],
  overrides: Record<string, number> = {},
): MealFood[] {
  const roles = MEAL_ROLES[mealName] ?? GENERIC_ROLES;
  return roles
    .map((role, i): MealFood | null => {
      const cands = candidates(catalog, role, diet, restrictions);
      if (cands.length === 0) return null;
      const key = `${mealName}|${i}`;
      const base = hash(`${mealName}|${role}|${i}`);
      const idx = (base + (overrides[key] ?? 0)) % cands.length;
      return { food: cands[idx], key };
    })
    .filter((item): item is MealFood => item !== null);
}

/** Soma kcal e macros de um conjunto de alimentos. */
export function sumMeal(foods: MealFood[]): {
  kcal: number;
  protein: number;
  carb: number;
  fat: number;
} {
  return foods.reduce(
    (acc, { food }) => ({
      kcal: acc.kcal + food.kcal,
      protein: acc.protein + food.protein,
      carb: acc.carb + food.carb,
      fat: acc.fat + food.fat,
    }),
    { kcal: 0, protein: 0, carb: 0, fat: 0 },
  );
}

/** Quantas alternativas existem pra um item (pra saber se dá pra trocar). */
export function alternativesCount(
  catalog: Food[],
  mealName: string,
  index: number,
  diet: DietStyle,
  restrictions: Restriction[],
): number {
  const roles = MEAL_ROLES[mealName] ?? GENERIC_ROLES;
  const role = roles[index];
  if (!role) return 0;
  return candidates(catalog, role, diet, restrictions).length;
}
