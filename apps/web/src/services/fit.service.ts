import { api } from "@/lib/axios";
import type { FitProfile } from "@/lib/fit-profile";
import type { User } from "@/types";

const KEY = "brl.fit.profile";

type Listener = () => void;
const listeners = new Set<Listener>();
let cachedRaw: string | null | undefined;
let cached: FitProfile | null = null;

export function subscribeFitProfile(listener: Listener): () => void {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

/** Snapshot estável (só reparseia quando o texto muda). */
export function getFitProfileSnapshot(): FitProfile | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cached = raw ? (JSON.parse(raw) as FitProfile) : null;
    } catch {
      cached = null;
    }
  }
  return cached;
}

/** undefined = ainda carregando (servidor / primeiro paint). */
export const getFitProfileServerSnapshot = (): FitProfile | null | undefined => undefined;

function writeCache(profile: FitProfile | null): void {
  if (typeof window === "undefined") return;
  if (profile) window.localStorage.setItem(KEY, JSON.stringify(profile));
  else window.localStorage.removeItem(KEY);
  for (const listener of listeners) listener();
}

export const clearFitProfile = () => writeCache(null);

/** GET /fit/profile; 404 vira null. */
export async function getFitProfile(): Promise<FitProfile | null> {
  try {
    const { data } = await api.get<FitProfile>("/fit/profile");
    return data;
  } catch (error) {
    if ((error as { status?: number }).status === 404) return null;
    throw error;
  }
}

/** PUT /fit/profile (upsert) e atualiza o cache. */
export async function saveFitProfile(profile: FitProfile): Promise<FitProfile> {
  const { data } = await api.put<FitProfile>("/fit/profile", profile);
  writeCache(data);
  return data;
}

let hydratedUserId: string | null = null;
let hydrating: Promise<void> | null = null;
let epoch = 0;

export const isFitProfileHydrated = (user: User) => hydratedUserId === user.id;

/** Carrega o perfil do servidor pro cache, 1× por usuário/sessão (falha de rede mantém o cache). */
export function ensureFitProfileHydrated(user: User): Promise<void> {
  if (hydratedUserId === user.id) return Promise.resolve();
  if (hydrating) return hydrating;
  const generation = ++epoch;
  hydrating = getFitProfile()
    .then((profile) => {
      if (generation === epoch) writeCache(profile);
    })
    .catch(() => undefined)
    .finally(() => {
      if (generation !== epoch) return;
      hydratedUserId = user.id;
      hydrating = null;
    });
  return hydrating;
}

export function resetFitProfileHydration(): void {
  epoch++;
  hydratedUserId = null;
  hydrating = null;
}
