import { api } from "@/lib/axios";
import type { FitAlternative, FitPlan } from "@/lib/fit-plan";
import type { User } from "@/types";

const KEY = "brl.fit.plan";

type Listener = () => void;
const listeners = new Set<Listener>();
let cachedRaw: string | null | undefined;
let cached: FitPlan | null = null;

export function subscribeFitPlan(listener: Listener): () => void {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

/** Snapshot estável (só reparseia quando o texto muda). */
export function getFitPlanSnapshot(): FitPlan | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cached = raw ? (JSON.parse(raw) as FitPlan) : null;
    } catch {
      cached = null;
    }
  }
  return cached;
}

/** undefined = ainda carregando (servidor / primeiro paint). */
export const getFitPlanServerSnapshot = (): FitPlan | null | undefined => undefined;

function writeCache(plan: FitPlan | null): void {
  if (typeof window === "undefined") return;
  if (plan) window.localStorage.setItem(KEY, JSON.stringify(plan));
  else window.localStorage.removeItem(KEY);
  for (const listener of listeners) listener();
}

export const clearFitPlan = () => writeCache(null);

/** GET /fit/plan; 404 vira null. */
export async function getFitPlan(): Promise<FitPlan | null> {
  try {
    const { data } = await api.get<FitPlan>("/fit/plan");
    return data;
  } catch (error) {
    if ((error as { status?: number }).status === 404) return null;
    throw error;
  }
}

/** POST /fit/plan/generate (substitui o plano) e atualiza o cache. */
export async function generateFitPlan(): Promise<FitPlan> {
  const { data } = await api.post<FitPlan>("/fit/plan/generate");
  writeCache(data);
  return data;
}

let hydratedUserId: string | null = null;
let hydrating: Promise<void> | null = null;
let epoch = 0;

export const isFitPlanHydrated = (user: User) => hydratedUserId === user.id;

/** Carrega o plano do servidor pro cache, 1× por usuário/sessão (falha de rede mantém o cache). */
export function ensureFitPlanHydrated(user: User): Promise<void> {
  if (hydratedUserId === user.id) return Promise.resolve();
  if (hydrating) return hydrating;
  const generation = ++epoch;
  hydrating = getFitPlan()
    .then((plan) => {
      if (generation === epoch) writeCache(plan);
    })
    .catch(() => undefined)
    .finally(() => {
      if (generation !== epoch) return;
      hydratedUserId = user.id;
      hydrating = null;
    });
  return hydrating;
}

export function resetFitPlanHydration(): void {
  epoch++;
  hydratedUserId = null;
  hydrating = null;
}

const swapPath = (day: number, order: number) => `/fit/plan/days/${day}/exercises/${order}`;

export async function getSwapAlternatives(day: number, order: number): Promise<FitAlternative[]> {
  const { data } = await api.get<FitAlternative[]>(`${swapPath(day, order)}/alternatives`);
  return data;
}

/** PUT da troca; o plano atualizado vai pro cache (sem recarregar). */
export async function swapFitExercise(day: number, order: number, exerciseId: string): Promise<FitPlan> {
  const { data } = await api.put<FitPlan>(swapPath(day, order), { exerciseId });
  writeCache(data);
  return data;
}
