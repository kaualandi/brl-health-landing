"use client";

import Link from "next/link";
import { AlertCircleIcon, ArrowRightIcon, CheckIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { usePlan } from "@/hooks/use-plan";
import { creditsForTier } from "@/lib/consultations-store";
import { getPlanById } from "@/services/plans.service";
import { cn } from "@/lib/utils";
import type { PlanId } from "@/types";

const ORDER: PlanId[] = ["free", "pro", "family"];
const rankOf = (tier: PlanId) => ORDER.indexOf(tier);

/** Texto do que muda ao sair do `from` pro `to` (só pra downgrade/cancelamento). */
function downgradeEffects(from: PlanId, to: PlanId): string[] {
  const fromName = getPlanById(from)?.name ?? from;
  const fromCredits = creditsForTier(from);
  const toCredits = creditsForTier(to);
  const effects = [
    `Consultas com nutricionista: de ${fromCredits} para ${toCredits} por mês.`,
    `Você perde os recursos exclusivos do ${fromName}.`,
  ];
  if (to === "free") {
    effects.push("Sua assinatura paga será encerrada.");
  }
  effects.push("A mudança vale a partir de agora.");
  return effects;
}

export function PlanManager() {
  const { tier, setTier } = usePlan();
  const toast = useToast();
  const [pending, setPending] = useState<PlanId | null>(null);

  const currentRank = rankOf(tier);

  function applyDowngrade(target: PlanId) {
    setTier(target);
    setPending(null);
    toast({
      variant: "success",
      title: target === "free" ? "Assinatura cancelada" : "Plano alterado",
      description:
        target === "free"
          ? "Você voltou pro plano Free."
          : `Agora você está no ${getPlanById(target)?.name}.`,
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {ORDER.map((id) => {
        const plan = getPlanById(id);
        if (!plan) return null;
        const isCurrent = id === tier;
        const isUpgrade = rankOf(id) > currentRank;
        const isDowngrade = rankOf(id) < currentRank;
        // Ir pro Free a partir de um plano pago = cancelar.
        const isCancel = isDowngrade && id === "free";

        return (
          <div
            key={id}
            className={cn(
              "rounded-2xl border p-4 transition-colors",
              isCurrent
                ? "border-brl-purple/60 bg-brl-purple/[0.06]"
                : "border-white/8",
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-base font-bold text-foreground">
                    {plan.name}
                  </p>
                  {isCurrent ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brl-purple/15 px-2.5 py-0.5 text-xs font-semibold text-brl-purple">
                      <CheckIcon className="size-3.5" />
                      Plano atual
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {plan.priceLabel}
                  {plan.monthlyPrice > 0 ? "/mês" : ""} · {plan.tagline}
                </p>
              </div>

              {isCurrent ? (
                <Button
                  variant="outline"
                  disabled
                  className="shrink-0 border-white/10 bg-white/5 opacity-100"
                >
                  Em uso
                </Button>
              ) : isUpgrade ? (
                <Button
                  nativeButton={false}
                  className="shrink-0 bg-brl-purple text-white hover:bg-brl-purple/90"
                  render={
                    <Link href={`/checkout?plano=${id}`}>
                      Fazer upgrade
                      <ArrowRightIcon />
                    </Link>
                  }
                />
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setPending(id)}
                  className="shrink-0 border-white/15 bg-white/5 hover:bg-white/10"
                >
                  {isCancel ? "Cancelar assinatura" : "Mudar pra cá"}
                </Button>
              )}
            </div>

            {pending === id ? (
              <div className="mt-4 rounded-xl border border-brl-orange/30 bg-brl-orange/5 p-4">
                <div className="flex items-start gap-2.5">
                  <AlertCircleIcon className="mt-0.5 size-5 shrink-0 text-brl-orange" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {isCancel
                        ? "Cancelar sua assinatura?"
                        : `Mudar para o ${plan.name}?`}
                    </p>
                    <ul className="mt-2 flex flex-col gap-1.5">
                      {downgradeEffects(tier, id).map((effect) => (
                        <li
                          key={effect}
                          className="flex gap-2 text-sm text-muted-foreground"
                        >
                          <span
                            aria-hidden
                            className="mt-1.5 size-1 shrink-0 rounded-full bg-brl-orange"
                          />
                          <span>{effect}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  <Button
                    variant="destructive"
                    onClick={() => applyDowngrade(id)}
                  >
                    {isCancel ? "Sim, cancelar" : "Confirmar mudança"}
                  </Button>
                  <Button variant="ghost" onClick={() => setPending(null)}>
                    Voltar
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
