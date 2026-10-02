import { api } from "@/lib/axios";
import {
  buildExerciseSearch,
  PAGE_SIZE,
  type Exercise,
  type ExerciseFilters,
  type ExercisePage,
  type ExerciseQuery,
} from "@/lib/exercises";

export async function fetchExercises(query: ExerciseQuery, offset: number): Promise<ExercisePage> {
  const qs = buildExerciseSearch(query, { limit: PAGE_SIZE, offset });
  const { data } = await api.get<ExercisePage>(`/exercises?${qs}`);
  return data;
}

export async function fetchExerciseFilters(): Promise<ExerciseFilters> {
  const { data } = await api.get<ExerciseFilters>("/exercises/filters");
  return data;
}

export async function fetchExercise(id: string): Promise<Exercise> {
  const { data } = await api.get<Exercise>(`/exercises/${encodeURIComponent(id)}`);
  return data;
}
