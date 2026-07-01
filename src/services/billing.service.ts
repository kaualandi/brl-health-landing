import { api } from "@/lib/axios";
import type { PlanId } from "@/types";

export type CardPayload = {
  holder: string;
  number: string;
  expiry: string;
  cvv: string;
};

export type CheckoutResult = {
  planId: PlanId;
  paidAt: string;
};

/**
 * Processa o pagamento via POST /billing/checkout (mock drop-in do backend): o
 * servidor valida o cartão (número terminando em `0000` → 400) e **ativa o
 * plano** na assinatura. Em sucesso, devolve o plano e a data do pagamento.
 */
export async function processPayment(
  planId: PlanId,
  card: CardPayload,
): Promise<CheckoutResult> {
  const { data } = await api.post<CheckoutResult>("/billing/checkout", {
    planId,
    card,
  });
  return data;
}

/* --- Stripe Checkout real (hospedado) --- */

export type StripeConfig = {
  publishableKey: string;
  /** True quando o backend tem chave configurada — habilita o fluxo real. */
  configured: boolean;
};

/**
 * Config pública do Stripe (`GET /billing/stripe/config`). Sem chave no backend,
 * `configured` é `false` e o checkout cai no form de cartão mock (`processPayment`).
 */
export async function getStripeConfig(): Promise<StripeConfig> {
  const { data } = await api.get<StripeConfig>("/billing/stripe/config");
  return data;
}

/**
 * Cria a Checkout Session (`POST /billing/stripe/checkout`) e devolve a URL
 * hospedada do Stripe pra onde redirecionar. O plano só é ativado depois, pelo
 * webhook (`checkout.session.completed`) — a fonte da verdade do pagamento.
 */
export async function createStripeCheckout(planId: PlanId): Promise<string> {
  const { data } = await api.post<{ url: string; sessionId: string }>(
    "/billing/stripe/checkout",
    { planId },
  );
  return data.url;
}

/**
 * Abre o Customer Portal do Stripe (`POST /billing/stripe/portal`) pra gerir ou
 * cancelar a assinatura, devolvendo a URL. Erra com 400 se o usuário não tem uma
 * assinatura paga no Stripe (ex.: tier ativado fora do fluxo real).
 */
export async function openStripePortal(): Promise<string> {
  const { data } = await api.post<{ url: string }>("/billing/stripe/portal", {});
  return data.url;
}
