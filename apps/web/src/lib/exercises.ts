export type Option = { value: string; label: string };

export type Exercise = {
  id: string;
  name: string;
  gifUrl: string;
  bodyParts: Option[];
  targetMuscles: Option[];
  secondaryMuscles: Option[];
  equipments: Option[];
  instructions: string[];
};

export type ExercisePage = { total: number; items: Exercise[]; hasMore: boolean };
export type ExerciseFilters = {
  bodyParts: Option[];
  muscles: Option[];
  equipments: Option[];
  attribution: string;
};
export type ExerciseQuery = { q: string; bodyPart: string; equipment: string };

export const PAGE_SIZE = 24;

type Params = Record<string, string | string[] | undefined> | URLSearchParams;

/** Lê q/bodyPart/equipment dos searchParams (ausente vira string vazia). */
export function parseExerciseQuery(params: Params): ExerciseQuery {
  const get = (k: string) => {
    const v = params instanceof URLSearchParams ? params.get(k) : params[k];
    return (Array.isArray(v) ? v[0] : v) ?? "";
  };
  return { q: get("q").trim(), bodyPart: get("bodyPart"), equipment: get("equipment") };
}

/** Monta a query string só com os filtros preenchidos (+ extras como limit/offset). */
export function buildExerciseSearch(query: ExerciseQuery, extra: Record<string, number> = {}): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...query, ...extra })) if (v !== "" && v != null) sp.set(k, String(v));
  return sp.toString();
}

/** Query da biblioteca; embutida na aba do app, preserva `aba=biblioteca`. */
export function librarySearch(query: ExerciseQuery, embedded: boolean): string {
  return [embedded ? "aba=biblioteca" : "", buildExerciseSearch(query)].filter(Boolean).join("&");
}

/** Sentence case: só a primeira letra maiúscula. */
export function sentenceCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
