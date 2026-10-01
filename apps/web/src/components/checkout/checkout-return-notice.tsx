"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { useToast } from "@/components/ui/toast";

/**
 * Mostra o feedback do retorno do Stripe Checkout e limpa o `?checkout=` da URL.
 * O Stripe redireciona pra `/conta?checkout=success` (pago) ou
 * `/precos?checkout=cancel` (desistiu) — ver `StripeOptions` no backend.
 *
 * Lê o param via `window.location` (sem `useSearchParams`, pra não exigir
 * Suspense na página). Dispara uma única vez por retorno.
 */
export function CheckoutReturnNotice() {
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current || typeof window === "undefined") return;
    const status = new URLSearchParams(window.location.search).get("checkout");
    if (status !== "success" && status !== "cancel") return;
    handled.current = true;

    if (status === "success") {
      toast({
        variant: "success",
        title: "Pagamento confirmado! 🎉",
        description: "Seu plano é liberado assim que o Stripe confirmar.",
      });
    } else {
      toast({
        variant: "info",
        title: "Pagamento não concluído",
        description: "Tudo certo — você pode assinar quando quiser.",
      });
    }

    // Remove o param pra não repetir o toast num reload/compartilhamento.
    router.replace(pathname);
  }, [toast, router, pathname]);

  return null;
}
