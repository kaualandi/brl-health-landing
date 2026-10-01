"use client";

import { cn } from "@/lib/utils";
import type { Plan } from "@/types";

export type BillingCycle = "monthly" | "annual";

const CYCLES: { value: BillingCycle; label: string }[] = [
  { value: "monthly", label: "Mensal" },
  { value: "annual", label: "Anual" },
];

/** Formata um valor em reais no padrão pt-BR (ex.: R$ 29,90). */
export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export type PlanPrice = {
  /** Valor em destaque exibido (sempre por mês quando há cobrança). */
  amount: string;
  /** Mostra o sufixo "/mês"? (false só no Free). */
  perMonth: boolean;
  /** Preço mensal cheio, riscado — só no ciclo anual de planos pagos. */
  strikethrough?: string;
  /** Nota de cobrança anual + economia no ano. */
  annualNote?: string;
};

/** Resolve o preço a exibir para um plano conforme o ciclo escolhido. */
export function resolvePlanPrice(plan: Plan, cycle: BillingCycle): PlanPrice {
  if (plan.monthlyPrice <= 0) {
    return { amount: plan.priceLabel, perMonth: false };
  }

  if (cycle === "annual" && plan.annualPrice) {
    const perMonth = plan.annualPrice / 12;
    const savings = plan.monthlyPrice * 12 - plan.annualPrice;
    return {
      amount: formatBRL(perMonth),
      perMonth: true,
      strikethrough: formatBRL(plan.monthlyPrice),
      annualNote: `Cobrado ${formatBRL(plan.annualPrice)}/ano · economize ${formatBRL(savings)}`,
    };
  }

  return { amount: formatBRL(plan.monthlyPrice), perMonth: true };
}

/** Segmented control acessível pra alternar entre cobrança mensal e anual. */
export function BillingToggle({
  value,
  onChange,
  savingsLabel,
  className,
}: {
  value: BillingCycle;
  onChange: (cycle: BillingCycle) => void;
  /** Reforço opcional exibido sob o toggle, ex.: "2 meses grátis no anual". */
  savingsLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div
        role="group"
        aria-label="Ciclo de cobrança"
        className="inline-flex rounded-full border border-foreground/10 bg-foreground/5 p-1"
      >
        {CYCLES.map((cycle) => {
          const active = cycle.value === value;
          return (
            <button
              key={cycle.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(cycle.value)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                active
                  ? "bg-brl-purple text-white"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {cycle.label}
            </button>
          );
        })}
      </div>
      {savingsLabel ? (
        <p className="text-xs font-medium text-brl-orange">{savingsLabel}</p>
      ) : null}
    </div>
  );
}
