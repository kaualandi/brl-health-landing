import type { DietStyle, Restriction } from "@/types";

export type ShopItem = { name: string; excludedBy?: Restriction[] };
export type ShopCategory = { title: string; emoji: string; items: ShopItem[] };

/** Proteínas variam bastante por estilo alimentar. */
const PROTEINS: Record<DietStyle, ShopItem[]> = {
  omnivore: [
    { name: "Peito de frango" },
    { name: "Ovos", excludedBy: ["egg"] },
    { name: "Patinho ou coxão mole" },
    { name: "Filé de tilápia" },
    { name: "Iogurte natural", excludedBy: ["lactose"] },
  ],
  vegetarian: [
    { name: "Ovos", excludedBy: ["egg"] },
    { name: "Iogurte natural", excludedBy: ["lactose"] },
    { name: "Queijo minas", excludedBy: ["lactose"] },
    { name: "Tofu" },
    { name: "Grão-de-bico" },
    { name: "Lentilha" },
  ],
  vegan: [
    { name: "Tofu" },
    { name: "Tempeh" },
    { name: "Grão-de-bico" },
    { name: "Lentilha" },
    { name: "Feijão preto" },
    { name: "Proteína de soja texturizada" },
  ],
  lowcarb: [
    { name: "Peito de frango" },
    { name: "Ovos", excludedBy: ["egg"] },
    { name: "Filé de peixe" },
    { name: "Carne magra" },
    { name: "Queijo", excludedBy: ["lactose"] },
  ],
  mediterranean: [
    { name: "Filé de peixe" },
    { name: "Sardinha" },
    { name: "Ovos", excludedBy: ["egg"] },
    { name: "Grão-de-bico" },
    { name: "Iogurte natural", excludedBy: ["lactose"] },
    { name: "Peito de frango" },
  ],
};

const CARBS: Record<DietStyle, ShopItem[]> = {
  omnivore: [
    { name: "Arroz integral" },
    { name: "Batata-doce" },
    { name: "Pão integral", excludedBy: ["gluten"] },
    { name: "Aveia", excludedBy: ["gluten"] },
  ],
  vegetarian: [
    { name: "Arroz integral" },
    { name: "Batata-doce" },
    { name: "Feijão" },
    { name: "Pão integral", excludedBy: ["gluten"] },
    { name: "Aveia", excludedBy: ["gluten"] },
  ],
  vegan: [
    { name: "Arroz integral" },
    { name: "Batata-doce" },
    { name: "Quinoa" },
    { name: "Feijão" },
    { name: "Aveia", excludedBy: ["gluten"] },
  ],
  lowcarb: [
    { name: "Batata-doce (moderado)" },
    { name: "Abóbora" },
  ],
  mediterranean: [
    { name: "Arroz integral" },
    { name: "Batata" },
    { name: "Grão-de-bico" },
    { name: "Pão integral", excludedBy: ["gluten"] },
  ],
};

const VEGETABLES: ShopItem[] = [
  { name: "Brócolis" },
  { name: "Espinafre" },
  { name: "Tomate" },
  { name: "Cenoura" },
  { name: "Abobrinha" },
  { name: "Folhas verdes (alface, rúcula)" },
  { name: "Pimentão" },
];

const FATS: ShopItem[] = [
  { name: "Azeite de oliva extravirgem" },
  { name: "Abacate" },
  { name: "Castanhas e nozes", excludedBy: ["nuts"] },
  { name: "Pasta de amendoim", excludedBy: ["nuts"] },
  { name: "Sementes de chia" },
];

const FRUITS: ShopItem[] = [
  { name: "Banana" },
  { name: "Maçã" },
  { name: "Frutas vermelhas" },
  { name: "Laranja" },
  { name: "Mamão" },
];

const FRUITS_LOWCARB: ShopItem[] = [
  { name: "Frutas vermelhas" },
  { name: "Morango" },
  { name: "Abacate" },
];

const STAPLES: ShopItem[] = [
  { name: "Café" },
  { name: "Alho" },
  { name: "Cebola" },
  { name: "Sal e temperos" },
  { name: "Limão" },
];

/**
 * Monta a lista de compras a partir da dieta e das restrições do perfil.
 * Remove itens que conflitam com alguma restrição ativa.
 */
export function buildShoppingList(
  diet: DietStyle,
  restrictions: Restriction[],
): ShopCategory[] {
  const active: Restriction[] = restrictions.filter((r) => r !== "none");
  const keep = (items: ShopItem[]) =>
    items.filter(
      (item) => !item.excludedBy?.some((r) => active.includes(r)),
    );

  const categories: ShopCategory[] = [
    { title: "Proteínas", emoji: "🍗", items: PROTEINS[diet] },
    { title: "Carboidratos", emoji: "🍚", items: CARBS[diet] },
    { title: "Vegetais & legumes", emoji: "🥦", items: VEGETABLES },
    { title: "Frutas", emoji: "🍎", items: diet === "lowcarb" ? FRUITS_LOWCARB : FRUITS },
    { title: "Gorduras boas", emoji: "🥑", items: FATS },
    { title: "Mercearia", emoji: "🧂", items: STAPLES },
  ];

  return categories
    .map((category) => ({ ...category, items: keep(category.items) }))
    .filter((category) => category.items.length > 0);
}
