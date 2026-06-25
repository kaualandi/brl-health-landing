import type {
  ActivityLevel,
  BiologicalSex,
  DietStyle,
  Goal,
  Restriction,
} from "@/types";

export type Option<T extends string> = {
  value: T;
  label: string;
  description: string;
  emoji: string;
};

export const SEX_OPTIONS: Option<BiologicalSex>[] = [
  {
    value: "female",
    label: "Feminino",
    description: "Pra calcular seu gasto com precisão.",
    emoji: "🚺",
  },
  {
    value: "male",
    label: "Masculino",
    description: "Pra calcular seu gasto com precisão.",
    emoji: "🚹",
  },
];

export const GOAL_OPTIONS: Option<Goal>[] = [
  {
    value: "lose",
    label: "Perder gordura",
    description: "Déficit inteligente, sem passar fome.",
    emoji: "🔥",
  },
  {
    value: "recomp",
    label: "Recomposição",
    description: "Trocar gordura por músculo aos poucos.",
    emoji: "♻️",
  },
  {
    value: "gain",
    label: "Ganhar massa",
    description: "Superávit pra construir músculo.",
    emoji: "💪",
  },
  {
    value: "performance",
    label: "Performance",
    description: "Energia pra render mais no treino.",
    emoji: "⚡",
  },
  {
    value: "health",
    label: "Mais saúde",
    description: "Comer melhor e manter o peso.",
    emoji: "🌱",
  },
];

export const ACTIVITY_OPTIONS: Option<ActivityLevel>[] = [
  {
    value: "sedentary",
    label: "Sedentário",
    description: "Pouco ou nenhum exercício — dia mais parado, sem ofegar.",
    emoji: "🛋️",
  },
  {
    value: "light",
    label: "Leve",
    description: "Treino 1–2x na semana — esforço leve, dá pra conversar à vontade.",
    emoji: "🚶",
  },
  {
    value: "moderate",
    label: "Moderado",
    description:
      "Treino 3–4x na semana — coração acelera, falar já exige um esforço.",
    emoji: "🏃",
  },
  {
    value: "active",
    label: "Ativo",
    description: "Treino 5–6x na semana — respiração pesada, só frases curtas.",
    emoji: "🏋️",
  },
  {
    value: "athlete",
    label: "Atleta",
    description: "Quase todo dia, no talo — alta intensidade, fôlego no limite.",
    emoji: "🥇",
  },
];

export const DIET_OPTIONS: Option<DietStyle>[] = [
  {
    value: "omnivore",
    label: "Como de tudo",
    description: "Sem restrição de grupo alimentar.",
    emoji: "🍽️",
  },
  {
    value: "vegetarian",
    label: "Vegetariano",
    description: "Sem carne, com ovos e laticínios.",
    emoji: "🥦",
  },
  {
    value: "vegan",
    label: "Vegano",
    description: "100% de origem vegetal.",
    emoji: "🌿",
  },
  {
    value: "lowcarb",
    label: "Low carb",
    description: "Menos carbo, mais proteína e gordura boa.",
    emoji: "🥑",
  },
  {
    value: "mediterranean",
    label: "Mediterrâneo",
    description: "Azeite, peixe, grãos e vegetais.",
    emoji: "🫒",
  },
];

export const RESTRICTION_OPTIONS: Option<Restriction>[] = [
  {
    value: "none",
    label: "Nenhuma",
    description: "Pode mandar de tudo.",
    emoji: "✅",
  },
  {
    value: "lactose",
    label: "Lactose",
    description: "Evitar leite e derivados.",
    emoji: "🥛",
  },
  {
    value: "gluten",
    label: "Glúten",
    description: "Evitar trigo, cevada e centeio.",
    emoji: "🌾",
  },
  {
    value: "nuts",
    label: "Oleaginosas",
    description: "Castanhas, amendoim e nozes.",
    emoji: "🥜",
  },
  {
    value: "seafood",
    label: "Frutos do mar",
    description: "Camarão, mariscos e afins.",
    emoji: "🦐",
  },
  {
    value: "egg",
    label: "Ovo",
    description: "Evitar ovo e preparações com ele.",
    emoji: "🥚",
  },
];

export const MEALS_OPTIONS = [3, 4, 5, 6] as const;

/** Resolve o rótulo legível de qualquer opção a partir do valor. */
function labelFrom<T extends string>(options: Option<T>[], value: T): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

export const goalLabel = (value: Goal) => labelFrom(GOAL_OPTIONS, value);
export const activityLabel = (value: ActivityLevel) =>
  labelFrom(ACTIVITY_OPTIONS, value);
export const dietLabel = (value: DietStyle) => labelFrom(DIET_OPTIONS, value);
export const restrictionLabel = (value: Restriction) =>
  labelFrom(RESTRICTION_OPTIONS, value);
