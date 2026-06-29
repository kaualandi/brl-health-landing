"use client";

import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/hooks/use-auth";

/** Só aceita caminhos internos — evita open redirect via `?next=`. */
function safeNext(value: string | null): string {
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return "/nutri";
}

/**
 * Inverso do RequireAuth: tira de telas de entrada (login) quem JÁ está logado.
 * Enquanto lê a sessão mostra um loader — não pisca o formulário pra quem já
 * tem sessão; se autenticado, manda pro `?next=` interno ou pro /nutri.
 *
 * É proteção de UX (mock). Na fase de backend a verdade vem do servidor.
 */
export function RedirectIfAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status !== "authenticated") return;
    // Lê o `next` do client (sem useSearchParams, pra não exigir Suspense aqui).
    const next =
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get("next");
    router.replace(safeNext(next));
  }, [status, router]);

  if (status !== "unauthenticated") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-brl-dark">
        <Loader2Icon className="size-6 animate-spin text-brl-purple" />
      </div>
    );
  }

  return <>{children}</>;
}
