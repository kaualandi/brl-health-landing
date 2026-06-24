import type { PlanId } from "@/types";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
 * Processa o "pagamento" (mock). Valida superficialmente e simula latência.
 * Recusa um número de cartão de teste pra dar pra exercitar o caminho de erro.
 */
export async function processPayment(
  planId: PlanId,
  card: CardPayload,
): Promise<CheckoutResult> {
  await wait(1400);

  const digits = card.number.replace(/\D/g, "");
  if (digits.endsWith("0000")) {
    throw new Error("Pagamento recusado pelo emissor. Tente outro cartão.");
  }

  return { planId, paidAt: new Date().toISOString() };
  // TODO: substituir por api.post('/billing/checkout') + Stripe (PaymentIntent/webhook)
}
