import type { RecipeFull } from "@/lib/nutri-content";
import type { DietStyle, Goal } from "@/types";

/**
 * Conteúdo editorial vindo da API (catálogos públicos). Usa `fetch` nativo com
 * ISR (`revalidate`) para preservar SSG/SEO nas páginas server e atualizar do
 * banco sem redeploy. Em falha, devolve vazio/null para a build não quebrar
 * (as páginas caem em geração sob demanda via `dynamicParams`).
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5226";
const REVALIDATE_SECONDS = 3600;

/* --- Receitas (GET /recipes, /recipes/{id}) --- */

// O endpoint já devolve a forma do RecipeFull (time, macros aninhado); só os
// enums chegam como string, então o mapeamento é um cast.
type RecipeResponse = Omit<RecipeFull, "diet" | "goals"> & {
  diet: string;
  goals: string[];
};

function toRecipe(r: RecipeResponse): RecipeFull {
  return { ...r, diet: r.diet as DietStyle, goals: r.goals as Goal[] };
}

export async function fetchRecipes(): Promise<RecipeFull[]> {
  try {
    const res = await fetch(`${API_BASE}/recipes`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return [];
    const rows = (await res.json()) as RecipeResponse[];
    return rows.map(toRecipe);
  } catch {
    return [];
  }
}

export async function fetchRecipe(id: string): Promise<RecipeFull | null> {
  try {
    const res = await fetch(`${API_BASE}/recipes/${encodeURIComponent(id)}`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    return toRecipe((await res.json()) as RecipeResponse);
  } catch {
    return null;
  }
}

/** Receitas relacionadas — mesma categoria/dieta primeiro (espelha `relatedRecipes`). */
export function relatedRecipesFrom(
  list: RecipeFull[],
  id: string,
  count = 3,
): RecipeFull[] {
  const current = list.find((r) => r.id === id);
  if (!current) return list.slice(0, count);
  const preferred = list.filter(
    (r) =>
      r.id !== id &&
      (r.category === current.category || r.diet === current.diet),
  );
  const rest = list.filter((r) => r.id !== id && !preferred.includes(r));
  return [...preferred, ...rest].slice(0, count);
}

/** Categorias únicas de receita (pra montar os filtros). */
export function recipeCategoriesFrom(list: RecipeFull[]): string[] {
  return Array.from(new Set(list.map((r) => r.category)));
}
