"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchFoods } from "@/services/foods.service";

/** Catálogo de alimentos (referência estável; cacheado por 1h). */
export function useFoods() {
  return useQuery({
    queryKey: ["foods"],
    queryFn: fetchFoods,
    staleTime: 1000 * 60 * 60,
  });
}
