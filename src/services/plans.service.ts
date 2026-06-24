import type { Plan, PlanId } from "@/types";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    priceLabel: "R$ 0",
    monthlyPrice: 0,
    tagline: "Pra começar a sentir a diferença.",
    features: [
      "BRL Fit básico",
      "BRL Nutri básico",
      "Sem integração entre os apps",
      "Histórico de 7 dias",
    ],
    highlighted: false,
    ctaLabel: "Começar grátis",
  },
  {
    id: "pro",
    name: "BRL Pro",
    priceLabel: "R$ 29,90",
    monthlyPrice: 29.9,
    tagline: "Treino e nutrição jogando junto.",
    features: [
      "Integração completa Fit + Nutri",
      "IA personalizada",
      "Histórico ilimitado",
      "1 usuário",
    ],
    note: "Abaixo do ticket médio de suplemento mensal.",
    highlighted: true,
    ctaLabel: "Assinar BRL Pro",
  },
  {
    id: "family",
    name: "BRL Family",
    priceLabel: "R$ 49,90",
    monthlyPrice: 49.9,
    tagline: "Toda a família no mesmo ritmo.",
    features: [
      "Tudo do Pro",
      "Até 4 usuários",
      "Dashboard familiar",
      "Metas compartilhadas",
    ],
    note: "R$ 12,47 por pessoa.",
    highlighted: false,
    ctaLabel: "Assinar BRL Family",
  },
];

export async function getPlans(): Promise<Plan[]> {
  await wait(400);
  return PLANS;
  // TODO: substituir por api.get('/plans')
}

/** Lookup síncrono de um plano pelo id (usado no checkout). */
export function getPlanById(id: PlanId): Plan | undefined {
  return PLANS.find((plan) => plan.id === id);
}
