"use client";

import { useQuery } from "@tanstack/react-query";
import { ExternalLinkIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { usePlan } from "@/hooks/use-plan";
import { getStripeConfig, openStripePortal } from "@/services/billing.service";

/**
 * Abre o Customer Portal do Stripe (cartão, faturas, cancelamento). Só aparece
 * com Stripe ligado e plano pago — assinatura do Stripe se gerencia lá.
 */
export function StripePortalButton() {
  const { tier } = usePlan();
  const toast = useToast();
  const [opening, setOpening] = useState(false);
  const { data: stripeConfig } = useQuery({
    queryKey: ["stripe-config"],
    queryFn: getStripeConfig,
    staleTime: 5 * 60_000,
    retry: false,
  });

  if (!stripeConfig?.configured || tier === "free") return null;

  async function open() {
    setOpening(true);
    try {
      window.location.assign(await openStripePortal());
    } catch (error) {
      setOpening(false);
      toast({
        variant: "error",
        title: "Não consegui abrir o portal",
        description: error instanceof Error ? error.message : "Tente de novo.",
      });
    }
  }

  return (
    <Button
      variant="outline"
      onClick={open}
      disabled={opening}
      className="self-start border-white/15 bg-white/5 hover:bg-white/10"
    >
      {opening ? "Abrindo portal…" : "Gerenciar pagamento e assinatura"}
      <ExternalLinkIcon />
    </Button>
  );
}
