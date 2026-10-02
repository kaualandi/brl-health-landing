"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { usePlan } from "@/hooks/use-plan";
import { getProgression } from "@/services/fit-sessions.service";

export const fitProgressionQuery = (uid: string | undefined) => ({
  queryKey: ["fit-progression", uid],
  queryFn: getProgression,
});

/** Sugestão de carga/reps/séries por exercício (undefined enquanto carrega ou sem rede). */
export function useFitProgression() {
  const { user } = useAuth();
  const { tier } = usePlan();
  const query = fitProgressionQuery(user?.id);
  // tier na chave: trocar de plano refaz a consulta na hora
  return useQuery({ ...query, queryKey: [...query.queryKey, tier], enabled: !!user, retry: false }).data;
}
