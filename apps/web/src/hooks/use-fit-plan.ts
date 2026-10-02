"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { useAuth } from "@/hooks/use-auth";
import {
  ensureFitPlanHydrated,
  getFitPlanServerSnapshot,
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
