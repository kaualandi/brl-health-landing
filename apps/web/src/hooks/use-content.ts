"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchArticles, fetchRecipes } from "@/services/content.service";

/** Lista de artigos (metadados) do backend. Cacheado por 1h. */
export function useArticles() {
  return useQuery({
    queryKey: ["articles"],
    queryFn: fetchArticles,
    staleTime: 1000 * 60 * 60,
  });
}

/** Catálogo de receitas do backend. Cacheado por 1h. */
export function useRecipes() {
  return useQuery({
    queryKey: ["recipes"],
    queryFn: fetchRecipes,
    staleTime: 1000 * 60 * 60,
  });
}
