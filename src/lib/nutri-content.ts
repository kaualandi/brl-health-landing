import type { DietStyle, Goal } from "@/types";

/** Um bloco do corpo do artigo. `heading` opcional, parágrafos e/ou bullets. */
export type ArticleSection = {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type Article = {
  id: string;
  category: string;
  emoji: string;
  title: string;
  excerpt: string;
  readTime: string;
  author: string;
  /** Objetivos pra quem o conteúdo é mais relevante (vazio = todos). */
  goals?: Goal[];
  /** Corpo do artigo, em seções. */
  body: ArticleSection[];
};

export type QuickTip = {
  emoji: string;
  text: string;
};

export const QUICK_TIPS: QuickTip[] = [
  { emoji: "🥤", text: "Comece o dia com um copo de água antes do café." },
  { emoji: "🍽️", text: "Encha metade do prato de vegetais — sacia e tem poucas calorias." },
  { emoji: "🛒", text: "Nunca vá ao mercado com fome. Sua lista agradece." },
  { emoji: "😴", text: "Dormir mal aumenta a fome no dia seguinte. Priorize o sono." },
  { emoji: "🥩", text: "Coloque a proteína no prato primeiro — o resto se ajusta." },
];

export type DailyHabit = {
  id: string;
  emoji: string;
  label: string;
};

export const DAILY_HABITS: DailyHabit[] = [
  { id: "water", emoji: "💧", label: "Bater a meta de água" },
  { id: "protein", emoji: "🍗", label: "Comer proteína em toda refeição" },
  { id: "veggies", emoji: "🥦", label: "Incluir vegetais no almoço e jantar" },
  { id: "move", emoji: "👟", label: "10 mil passos no dia" },
  { id: "sleep", emoji: "😴", label: "7–8 horas de sono" },
];

export type Recipe = {
  title: string;
  emoji: string;
  kcal: number;
  time: string;
  tags: string[];
};

const RECIPES: Record<DietStyle, Recipe> = {
  omnivore: {
    title: "Frango grelhado com batata-doce e brócolis",
    emoji: "🍗",
    kcal: 520,
    time: "25 min",
    tags: ["Alta proteína", "Pós-treino"],
  },
  vegetarian: {
    title: "Omelete de espinafre com queijo e torrada integral",
    emoji: "🍳",
    kcal: 430,
    time: "15 min",
    tags: ["Vegetariano", "Rápido"],
  },
  vegan: {
    title: "Bowl de grão-de-bico, quinoa e tahine",
    emoji: "🥗",
    kcal: 480,
    time: "20 min",
    tags: ["Vegano", "Rico em fibra"],
  },
  lowcarb: {
    title: "Salmão com aspargos no azeite",
    emoji: "🐟",
    kcal: 460,
    time: "20 min",
    tags: ["Low carb", "Ômega-3"],
  },
  mediterranean: {
    title: "Atum com grão-de-bico, tomate e azeitona",
    emoji: "🫒",
    kcal: 470,
    time: "15 min",
    tags: ["Mediterrâneo", "Sem fogão"],
  },
};

export function recipeForDiet(diet: DietStyle): Recipe {
  return RECIPES[diet] ?? RECIPES.omnivore;
}

/* ------------------------------------------------------------------ */
/* Catálogo de receitas — página pública /receitas                     */
/* ------------------------------------------------------------------ */

/** Receita completa, com macros, ingredientes e modo de preparo. */
export type RecipeFull = {
  /** Slug em kebab-case, usado na URL. */
  id: string;
  title: string;
  emoji: string;
  /** Café da manhã, Almoço, Lanche, Jantar, Sobremesa fit. */
  category: string;
  excerpt: string;
  /** Tempo de preparo (ex.: "20 min"). */
  time: string;
  kcal: number;
  /** Macros por porção, em gramas. */
  macros: { protein: number; carbs: number; fat: number };
  servings: number;
  diet: DietStyle;
  /** Objetivos pra quem a receita é mais indicada (vazio = todos). */
  goals?: Goal[];
  ingredients: string[];
  steps: string[];
  tags?: string[];
};
