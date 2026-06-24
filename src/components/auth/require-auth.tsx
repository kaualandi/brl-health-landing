"use client";

import { usePathname, useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/hooks/use-auth";

/**
 * Guarda de rota no client. Enquanto lê a sessão mostra um loader; se não
 * houver sessão, manda pro /login guardando o destino em `?next=`.
 *
 * É proteção de UX (mock). Na fase de backend, a verdade vem do servidor.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-brl-dark">
        <Loader2Icon className="size-6 animate-spin text-brl-purple" />
      </div>
    );
  }

  return <>{children}</>;
}
