"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, useSyncExternalStore } from "react";

import { useAuth } from "@/hooks/use-auth";
import {
  ensureFitPlanHydrated,
  getFitPlanServerSnapshot,
  getSwapAlternatives,
  getFitPlanSnapshot,
  isFitPlanHydrated,
  subscribeFitPlan,
} from "@/services/fit-plan.service";

/** Plano de treino do usuário logado: undefined = carregando, null = sem plano. */
export function useFitPlan() {
  const { user } = useAuth();
  const cached = useSyncExternalStore(subscribeFitPlan, getFitPlanSnapshot, getFitPlanServerSnapshot);
  const [, setReady] = useState(false);

  useEffect(() => {
    if (user) void ensureFitPlanHydrated(user).then(() => setReady(true));
  }, [user]);

  return user && isFitPlanHydrated(user) ? cached : undefined;
}

/** Alternativas de troca (sempre frescas: dependem do que está no dia agora). */
export function useSwapAlternatives(day: number, order: number, exerciseId: string) {
  return useQuery({
    queryKey: ["fit-swap", day, order, exerciseId],
    queryFn: () => getSwapAlternatives(day, order),
    gcTime: 0,
  });
}
