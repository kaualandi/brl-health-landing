import { api } from "@/lib/axios";
import { setPlanTier } from "@/lib/plan-store";
import type { Plan, PlanId, User } from "@/types";

/**
 * Templates de marketing dos planos (copy: nome, tagline, features, CTA). O
 * **preço** é autoritativo do backend (`GET /plans`) e mesclado em `getPlans` —
 * a copy fica no front por decisão de produto (DT-07).
 */
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
    annualPrice: 29.9 * 10,
    annualDiscountLabel: "2 meses grátis",
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
    annualPrice: 49.9 * 10,
    annualDiscountLabel: "2 meses grátis",
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

type PlanApi = { id: PlanId; monthlyPrice: number; credits: number };

function formatBRL(value: number): string {
  if (value === 0) return "R$ 0";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Catálogo de planos: preço/créditos vêm do `GET /plans` (autoritativos) e são
 * mesclados na copy de marketing. Se a API cair, cai no template estático (cujos
 * preços batem com o seed).
 */
export async function getPlans(): Promise<Plan[]> {
  try {
    const { data } = await api.get<PlanApi[]>("/plans");
    const byId = new Map(data.map((p) => [p.id, p]));
    return PLANS.map((template) => {
      const apiPlan = byId.get(template.id);
      if (!apiPlan) return template;
      const monthlyPrice = apiPlan.monthlyPrice;
      return {
        ...template,
        monthlyPrice,
        priceLabel: formatBRL(monthlyPrice),
        annualPrice: monthlyPrice > 0 ? monthlyPrice * 10 : undefined,
      };
    });
  } catch {
    return PLANS;
  }
}

/** Lookup síncrono de um plano pelo id (usado no checkout). */
export function getPlanById(id: PlanId): Plan | undefined {
  return PLANS.find((plan) => plan.id === id);
}

/* --- assinatura atual (tier) — servidor-autoritativo --- */

export type Subscription = {
  planId: PlanId;
  credits: number;
  hasPendingCharge: boolean;
};

/** Tier/assinatura atual do usuário (GET /me/subscription). */
export async function getSubscription(): Promise<Subscription> {
  const { data } = await api.get<Subscription>("/me/subscription");
  return data;
}

/**
 * Muda o plano (downgrade/cancelamento) via PUT /me/plan e atualiza o cache
 * local. O usuário é identificado pelo JWT; cartão só é exigido em upgrade.
 */
export async function changePlan(target: PlanId): Promise<void> {
  await api.put("/me/plan", { target });
  setPlanTier(target);
}

/* --- hidratação do tier a partir do servidor (uma vez por usuário/sessão) --- */

let planHydratedUserId: string | null = null;
let planHydrating: Promise<void> | null = null;

async function fetchSubscription(): Promise<void> {
  try {
    const sub = await getSubscription();
    setPlanTier(sub.planId);
  } catch {
    // Falha de rede: mantém o tier em cache, silencioso.
  }
}

/** True se o tier deste usuário já foi hidratado nesta sessão. */
export function isPlanHydrated(user: User): boolean {
  return planHydratedUserId === user.id;
}

/** Garante (uma única vez por usuário) que o tier foi carregado do servidor. */
export function ensurePlanHydrated(user: User): Promise<void> {
  if (planHydratedUserId === user.id) return Promise.resolve();
  if (planHydrating) return planHydrating;
  planHydrating = fetchSubscription().finally(() => {
    planHydratedUserId = user.id;
    planHydrating = null;
  });
  return planHydrating;
}

/** Zera a hidratação do tier (chamado no logout). */
export function resetPlanHydration(): void {
  planHydratedUserId = null;
  planHydrating = null;
}
