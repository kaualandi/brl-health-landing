"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { useAuth } from "@/hooks/use-auth";
import { getExerciseHistory, getFitRecords, getFitStats } from "@/services/fit-stats.service";

const useUid = () => useAuth().user?.id;

export function useFitStats() {
  const uid = useUid();
  return useQuery({ queryKey: ["fit-stats", uid], queryFn: getFitStats, enabled: !!uid });
}

export function useFitRecords() {
  const uid = useUid();
  return useQuery({ queryKey: ["fit-records", uid], queryFn: getFitRecords, enabled: !!uid });
}

export function useExerciseHistory(id: string | null) {
  return useQuery({ queryKey: ["fit-history", id], queryFn: () => getExerciseHistory(id!), enabled: !!id });
}

/** Marca stats, recordes e gráficos como velhos (treino concluído ou sincronizado). */
export function useInvalidateFitStats() {
  const qc = useQueryClient();
  return useCallback(() => {
    for (const k of ["fit-stats", "fit-records", "fit-history"]) void qc.invalidateQueries({ queryKey: [k] });
  }, [qc]);
}
