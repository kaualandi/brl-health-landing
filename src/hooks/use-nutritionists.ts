"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchNutritionists } from "@/services/nutritionists.service";

/** Catálogo de nutricionistas (referência estável; cacheado por 1h). */
export function useNutritionists() {
  return useQuery({
    queryKey: ["nutritionists"],
    queryFn: fetchNutritionists,
    staleTime: 1000 * 60 * 60,
  });
}
