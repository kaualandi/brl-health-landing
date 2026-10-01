export type PlanInfo = { id: string; rank: number };

export const DECLINED = "Pagamento recusado pelo emissor. Tente outro cartão.";
export const digits = (value: string) => value.replace(/\D/g, "");

/** Cartão aceito no mock: ≥13 dígitos e não terminado em 0000. */
export const cardDeclined = (number: string) => number.endsWith("0000");

type Change = {
  target?: PlanInfo;
  current: PlanInfo;
  cardNumber?: string;
  hasPendingCharge: boolean;
  stripeEnabled: boolean;
};

export function planChangeErrors({ target, current, cardNumber, hasPendingCharge, stripeEnabled }: Change) {
  if (!target) return ["Plano-alvo inexistente."];
  if (target.id === current.id) return ["Você já está neste plano."];
  const errors: string[] = [];
  const upgrade = target.rank > current.rank;
  if (upgrade) {
    const n = cardNumber ?? "";
    if (!/^\d{13,}$/.test(n) || cardDeclined(n)) errors.push(DECLINED);
  }
  if (hasPendingCharge) errors.push("Há uma cobrança pendente. Regularize antes de mudar de plano.");
  if (upgrade && stripeEnabled) errors.push("Para fazer upgrade, use o checkout de pagamento.");
  return errors;
}

export function checkoutErrors(plan: PlanInfo | undefined, cardNumber: string, stripeEnabled: boolean) {
  const errors: string[] = [];
  if (!plan || plan.rank === 0) errors.push("Plano inexistente.");
  const n = digits(cardNumber);
  if (n.length < 13) errors.push("Número de cartão inválido.");
  else if (cardDeclined(n)) errors.push(DECLINED);
  if (stripeEnabled) errors.push("Pagamento real habilitado: use o checkout do Stripe.");
  return errors;
}
