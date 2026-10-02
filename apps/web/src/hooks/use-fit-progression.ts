"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { getProgression } from "@/services/fit-sessions.service";

export const fitProgressionQuery = (uid: string | undefined) => ({
  queryKey: ["fit-progression", uid],
  queryFn: getProgression,
});

/** Sugestão de carga/reps/séries por exercício (undefined enquanto carrega ou sem rede). */
export function useFitProgression() {
  const { user } = useAuth();
  return useQuery({ ...fitProgressionQuery(user?.id), enabled: !!user, retry: false }).data;
}
