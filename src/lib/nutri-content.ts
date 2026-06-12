import type { DietStyle, Goal } from "@/types";

export type Article = {
  id: string;
  category: string;
  emoji: string;
  title: string;
  excerpt: string;
  readTime: string;
  /** Objetivos pra quem o conteúdo é mais relevante (vazio = todos). */
  goals?: Goal[];
};

export const ARTICLES: Article[] = [
  {
    id: "proteina-quanto",
    category: "Macros",
    emoji: "🍗",
    title: "Proteína: quanto você realmente precisa por dia",
    excerpt:
      "Esqueça os mitos. A conta é mais simples — e mais alta — do que te contaram.",
    readTime: "4 min",
    goals: ["gain", "recomp", "lose"],
  },
  {
    id: "lanches-pre-treino",
    category: "Treino",
    emoji: "🍌",
    title: "5 lanches pré-treino que cabem na rotina (e no bolso)",
    excerpt:
      "Energia rápida sem peso no estômago. Da banana com pasta de amendoim ao iogurte.",
    readTime: "3 min",
    goals: ["performance", "gain"],
  },
  {
    id: "ler-rotulos",
    category: "Hábitos",
    emoji: "🔎",
    title: "Como ler rótulos sem cair em pegadinha de marketing",
    excerpt:
      "‘Zero açúcar’ nem sempre é o que parece. Aprenda a olhar a tabela do jeito certo.",
    readTime: "5 min",
  },
  {
    id: "deficit-sem-fome",
    category: "Emagrecimento",
    emoji: "🥗",
    title: "Déficit calórico sem passar fome: o guia honesto",
    excerpt:
      "Volume, fibra e proteína são seus amigos. Veja como montar pratos que saciam.",
    readTime: "6 min",
    goals: ["lose", "recomp"],
  },
  {
    id: "agua-hidratacao",
    category: "Hidratação",
    emoji: "💧",
    title: "Você provavelmente bebe menos água do que pensa",
    excerpt:
      "Sinais de desidratação leve que sabotam seu treino e sua fome — e como corrigir.",
    readTime: "3 min",
  },
  {
    id: "fora-de-casa",
    category: "Rotina",
    emoji: "🍔",
    title: "Comendo fora sem sair da meta",
    excerpt:
      "Restaurante, delivery, festa de aniversário. Estratégias pra cada situação real.",
    readTime: "5 min",
  },
  {
    id: "carbo-noite",
    category: "Mitos",
    emoji: "🌙",
    title: "Carboidrato à noite engorda? A ciência responde",
    excerpt:
      "Spoiler: o que importa é o total do dia, não o relógio. Entenda o porquê.",
    readTime: "4 min",
  },
  {
    id: "proteina-vegetal",
    category: "Plant-based",
    emoji: "🌱",
    title: "Proteína vegetal: como bater a meta sem carne",
    excerpt:
      "Combinações de leguminosas, grãos e tofu que fecham seu aminograma do dia.",
    readTime: "5 min",
  },
];

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

/** Prioriza artigos relevantes ao objetivo, mas sempre devolve `count` itens. */
export function curatedArticles(goal: Goal, count = 6): Article[] {
  const relevant = ARTICLES.filter((a) => a.goals?.includes(goal));
  const rest = ARTICLES.filter((a) => !relevant.includes(a));
  return [...relevant, ...rest].slice(0, count);
}
