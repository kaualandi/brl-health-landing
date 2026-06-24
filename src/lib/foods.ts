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

/** Banco de alimentos seed, por papel na refeição. Macros aproximados (g). */
export const FOODS: Food[] = [
  // --- Proteínas ---
  { id: "frango", name: "Frango grelhado", emoji: "🍗", role: "protein", portion: "120 g", kcal: 200, protein: 37, carb: 0, fat: 6, diets: ["omnivore", "lowcarb", "mediterranean"] },
  { id: "patinho", name: "Patinho moído", emoji: "🥩", role: "protein", portion: "120 g", kcal: 230, protein: 32, carb: 0, fat: 11, diets: ["omnivore", "lowcarb"] },
  { id: "tilapia", name: "Filé de tilápia", emoji: "🐟", role: "protein", portion: "140 g", kcal: 180, protein: 36, carb: 0, fat: 3, diets: ["omnivore", "lowcarb", "mediterranean"] },
  { id: "ovos", name: "Ovos mexidos", emoji: "🍳", role: "protein", portion: "2 unidades", kcal: 160, protein: 13, carb: 1, fat: 11, diets: ["omnivore", "vegetarian", "lowcarb", "mediterranean"], excludedBy: ["egg"] },
  { id: "tofu", name: "Tofu grelhado", emoji: "🧈", role: "protein", portion: "150 g", kcal: 170, protein: 17, carb: 4, fat: 10, diets: ["omnivore", "vegetarian", "vegan"] },
  { id: "graobico", name: "Grão-de-bico", emoji: "🫘", role: "protein", portion: "100 g", kcal: 160, protein: 9, carb: 27, fat: 3, diets: ["vegetarian", "vegan", "mediterranean"] },
  { id: "lentilha", name: "Lentilha cozida", emoji: "🍲", role: "protein", portion: "150 g", kcal: 170, protein: 13, carb: 30, fat: 1, diets: ["vegetarian", "vegan", "mediterranean"] },

  // --- Carboidratos ---
  { id: "arroz", name: "Arroz integral", emoji: "🍚", role: "carb", portion: "4 col. de sopa", kcal: 160, protein: 3, carb: 34, fat: 1 },
  { id: "batatadoce", name: "Batata-doce", emoji: "🍠", role: "carb", portion: "150 g", kcal: 130, protein: 2, carb: 30, fat: 0 },
  { id: "quinoa", name: "Quinoa cozida", emoji: "🌾", role: "carb", portion: "100 g", kcal: 120, protein: 4, carb: 21, fat: 2 },
  { id: "paointegral", name: "Pão integral", emoji: "🍞", role: "carb", portion: "2 fatias", kcal: 140, protein: 6, carb: 24, fat: 2, excludedBy: ["gluten"] },
  { id: "aveia", name: "Aveia", emoji: "🥣", role: "carb", portion: "3 col. de sopa", kcal: 150, protein: 5, carb: 26, fat: 3, excludedBy: ["gluten"] },
  { id: "macarrao", name: "Macarrão integral", emoji: "🍝", role: "carb", portion: "120 g", kcal: 180, protein: 7, carb: 36, fat: 1, excludedBy: ["gluten"] },

  // --- Vegetais ---
  { id: "brocolis", name: "Brócolis no vapor", emoji: "🥦", role: "veg", portion: "à vontade", kcal: 40, protein: 3, carb: 6, fat: 0 },
  { id: "salada", name: "Salada verde", emoji: "🥗", role: "veg", portion: "à vontade", kcal: 30, protein: 1, carb: 4, fat: 0 },
  { id: "abobrinha", name: "Abobrinha refogada", emoji: "🥒", role: "veg", portion: "1 xícara", kcal: 45, protein: 2, carb: 6, fat: 1 },
  { id: "legumes", name: "Legumes no vapor", emoji: "🥕", role: "veg", portion: "1 xícara", kcal: 60, protein: 2, carb: 11, fat: 1 },

  // --- Frutas ---
  { id: "banana", name: "Banana", emoji: "🍌", role: "fruit", portion: "1 unidade", kcal: 90, protein: 1, carb: 23, fat: 0 },
  { id: "maca", name: "Maçã", emoji: "🍎", role: "fruit", portion: "1 unidade", kcal: 75, protein: 0, carb: 20, fat: 0 },
  { id: "mamao", name: "Mamão", emoji: "🧡", role: "fruit", portion: "1 fatia", kcal: 60, protein: 1, carb: 15, fat: 0 },
  { id: "frutasverm", name: "Frutas vermelhas", emoji: "🫐", role: "fruit", portion: "1 xícara", kcal: 70, protein: 1, carb: 16, fat: 0 },
  { id: "laranja", name: "Laranja", emoji: "🍊", role: "fruit", portion: "1 unidade", kcal: 65, protein: 1, carb: 16, fat: 0 },

  // --- Gorduras boas ---
  { id: "abacate", name: "Abacate", emoji: "🥑", role: "fat", portion: "1/2 unidade", kcal: 160, protein: 2, carb: 9, fat: 15 },
  { id: "pastaamendoim", name: "Pasta de amendoim", emoji: "🥜", role: "fat", portion: "1 col. de sopa", kcal: 100, protein: 4, carb: 3, fat: 8, excludedBy: ["nuts"] },
  { id: "castanhas", name: "Castanhas", emoji: "🌰", role: "fat", portion: "1 punhado", kcal: 180, protein: 5, carb: 6, fat: 16, excludedBy: ["nuts"] },
  { id: "azeite", name: "Azeite de oliva", emoji: "🫒", role: "fat", portion: "1 fio", kcal: 90, protein: 0, carb: 0, fat: 10 },

  // --- Laticínios / similares ---
  { id: "iogurte", name: "Iogurte natural", emoji: "🥛", role: "dairy", portion: "1 pote", kcal: 90, protein: 9, carb: 12, fat: 1, diets: ["omnivore", "vegetarian", "mediterranean"], excludedBy: ["lactose"] },
  { id: "queijominas", name: "Queijo minas", emoji: "🧀", role: "dairy", portion: "2 fatias", kcal: 140, protein: 12, carb: 3, fat: 9, diets: ["omnivore", "vegetarian"], excludedBy: ["lactose"] },
  { id: "iogurtevegetal", name: "Iogurte vegetal", emoji: "🌱", role: "dairy", portion: "1 pote", kcal: 80, protein: 4, carb: 12, fat: 2, diets: ["omnivore", "vegetarian", "vegan"] },

  // --- Bebidas ---
  { id: "cafe", name: "Café sem açúcar", emoji: "☕", role: "drink", portion: "1 xícara", kcal: 5, protein: 0, carb: 0, fat: 0 },
  { id: "chaverde", name: "Chá verde", emoji: "🍵", role: "drink", portion: "1 xícara", kcal: 2, protein: 0, carb: 0, fat: 0 },
  { id: "suco", name: "Suco natural", emoji: "🧃", role: "drink", portion: "1 copo", kcal: 90, protein: 1, carb: 22, fat: 0 },
];

/** Composição de papéis por refeição. */
const MEAL_ROLES: Record<string, FoodRole[]> = {
  "Café da manhã": ["protein", "carb", "fruit", "drink"],
  "Lanche da manhã": ["fruit", "fat"],
  Almoço: ["protein", "carb", "veg"],
  "Lanche da tarde": ["dairy", "fruit"],
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
  role: FoodRole,
  diet: DietStyle,
  restrictions: Restriction[],
): Food[] {
  return FOODS.filter(
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
  mealName: string,
  diet: DietStyle,
  restrictions: Restriction[],
  overrides: Record<string, number> = {},
): MealFood[] {
  const roles = MEAL_ROLES[mealName] ?? GENERIC_ROLES;
  return roles
    .map((role, i): MealFood | null => {
      const cands = candidates(role, diet, restrictions);
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
  mealName: string,
  index: number,
  diet: DietStyle,
  restrictions: Restriction[],
): number {
  const roles = MEAL_ROLES[mealName] ?? GENERIC_ROLES;
  const role = roles[index];
  if (!role) return 0;
  return candidates(role, diet, restrictions).length;
}
