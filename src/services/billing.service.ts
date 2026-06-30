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
