"use client";

import { usePathname, useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { useAuth } from "@/hooks/use-auth";
import { ensurePlanHydrated, isPlanHydrated } from "@/services/plans.service";
import {
  ensureNutriProfileHydrated,
  isNutriProfileHydrated,
} from "@/services/nutri.service";

/**
 * Guarda de rota no client. Enquanto lê a sessão (e carrega o perfil do
 * servidor) mostra um loader; se não houver sessão, manda pro /login guardando
 * o destino em `?next=`.
 *
 * A hidratação do perfil acontece aqui (uma vez por usuário/sessão), então toda
 * página logada já encontra o perfil em cache — sem piscar "sem plano".
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Já começa pronto se perfil + tier deste usuário já foram hidratados nesta
  // sessão — evita flash de loader ao navegar entre páginas logadas.
  const [dataReady, setDataReady] = useState(() =>
    user ? isNutriProfileHydrated(user) && isPlanHydrated(user) : false,
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  useEffect(() => {
    if (status !== "authenticated" || !user) return;
    let cancelled = false;
    void Promise.all([
      ensureNutriProfileHydrated(user),
      ensurePlanHydrated(user),
    ]).finally(() => {
      if (!cancelled) setDataReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [status, user]);

  if (status !== "authenticated" || !dataReady) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-brl-dark">
        <Loader2Icon className="size-6 animate-spin text-brl-purple" />
      </div>
    );
  }

  return <>{children}</>;
}
