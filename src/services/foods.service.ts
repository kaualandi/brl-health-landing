import { api } from "@/lib/axios";
import type { Food } from "@/lib/foods";

/** Catálogo de alimentos (GET /foods). Os enums chegam como string (valores válidos). */
export async function fetchFoods(): Promise<Food[]> {
  const { data } = await api.get<Food[]>("/foods");
  return data;
}
