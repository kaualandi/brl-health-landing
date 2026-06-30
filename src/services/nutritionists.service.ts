import { api } from "@/lib/axios";
import type { Nutritionist } from "@/lib/nutritionists";

/** Catálogo de nutricionistas (GET /nutritionists). */
export async function fetchNutritionists(): Promise<Nutritionist[]> {
  const { data } = await api.get<Nutritionist[]>("/nutritionists");
  return data;
}
