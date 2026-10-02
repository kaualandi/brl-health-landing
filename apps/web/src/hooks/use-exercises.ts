"use client";

import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { PAGE_SIZE, type ExerciseQuery } from "@/lib/exercises";
import { fetchExercise, fetchExerciseFilters, fetchExercises } from "@/services/exercises.service";

const DAY = 1000 * 60 * 60 * 24;

/** Rótulos dos filtros (catálogo estável; cache longo). */
export function useExerciseFilters() {
  return useQuery({ queryKey: ["exercise-filters"], queryFn: fetchExerciseFilters, staleTime: DAY });
}

/** Lista paginada ("Carregar mais") por busca + filtros. */
export function useExerciseList(query: ExerciseQuery) {
  return useInfiniteQuery({
    queryKey: ["exercises", query],
    queryFn: ({ pageParam }) => fetchExercises(query, pageParam),
    initialPageParam: 0,
    placeholderData: keepPreviousData,
    getNextPageParam: (last, all) => (last.hasMore ? all.length * PAGE_SIZE : undefined),
    staleTime: 1000 * 60 * 60,
  });
}

export function useExercise(id: string) {
  return useQuery({
    queryKey: ["exercise", id],
    queryFn: () => fetchExercise(id),
    staleTime: DAY,
    retry: (count, e) => (e as { status?: number }).status !== 404 && count < 2,
  });
}
