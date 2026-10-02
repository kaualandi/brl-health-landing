"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { applyWorkoutBonus } from "@/lib/nutri-plan";
import { getTodayEnergy } from "@/services/nutri-energy.service";
import type { NutriPlan } from "@/types";

export const TODAY_ENERGY_KEY = ["nutri-today-energy"] as const;

/** Treino de hoje + o plano já com o bônus somado (falha de rede = plano base). */
export function useTodayEnergy(plan: NutriPlan) {
  const { user } = useAuth();
  const { data } = useQuery({ queryKey: [...TODAY_ENERGY_KEY, user?.id], queryFn: getTodayEnergy, enabled: !!user });
  return { energy: data, plan: applyWorkoutBonus(plan, data?.bonusKcal ?? 0) };
}
