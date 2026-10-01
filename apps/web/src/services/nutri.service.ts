import { api } from "@/lib/axios";
import { setAuth } from "@/lib/auth-store";
import { registerUser } from "@/services/auth.service";
import type { MealEntry, NutriProfile, Restriction, User } from "@/types";

const PROFILE_STORAGE_KEY = "brl.nutri.profile";

export type OnboardingInput = Omit<NutriProfile, "createdAt"> & {
  password: string;
};

/* --- store p/ useSyncExternalStore (leitura SSR-safe, sem setState em effect) --- */

type Listener = () => void;
const listeners = new Set<Listener>();

let cachedRaw: string | null | undefined;
let cachedProfile: NutriProfile | null = null;

function parseProfile(raw: string): NutriProfile | null {
  try {
    return JSON.parse(raw) as NutriProfile;
  } catch {
    return null;
  }
}

/** Snapshot estável: só recalcula quando o conteúdo bruto muda. */
function readSnapshot(): NutriProfile | null {
  const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedProfile = raw ? parseProfile(raw) : null;
  }
  return cachedProfile;
}

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeNutriProfile(listener: Listener): () => void {
  listeners.add(listener);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", listener);
  }
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", listener);
    }
  };
}

/** Cliente: perfil atual (null = sem plano). */
export function getNutriProfileSnapshot(): NutriProfile | null {
  if (typeof window === "undefined") return null;
  return readSnapshot();
}

/** Servidor / primeiro paint: undefined = ainda carregando. */
export function getNutriProfileServerSnapshot(): NutriProfile | null | undefined {
  return undefined;
}

/* --- leitura/escrita imperativa --- */

export function getNutriProfile(): NutriProfile | null {
  if (typeof window === "undefined") return null;
  return readSnapshot();
}

export function saveNutriProfile(profile: NutriProfile): void {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(profile);
  window.localStorage.setItem(PROFILE_STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedProfile = profile;
  emit();
}

export function clearNutriProfile(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PROFILE_STORAGE_KEY);
  cachedRaw = null;
  cachedProfile = null;
  emit();
}

/* --- ponte com a API (PUT/GET /nutri/profile) --- */

/** Corpo do PUT /nutri/profile — espelha o ProfileRequest do backend. */
type ProfileRequestBody = {
  sex: NutriProfile["sex"];
  age: number;
  heightCm: number;
  weightKg: number;
  goalWeightKg: number | null;
  goal: NutriProfile["goal"];
  activity: NutriProfile["activity"];
  diet: NutriProfile["diet"];
  restrictions: Restriction[];
  mealsPerDay: number;
  waterGlasses: number;
  meals: MealEntry[];
  wakeTime: string | null;
  trainTime: string | null;
  sleepTime: string | null;
};

/** Resposta de GET/PUT /nutri/profile (sem name/email/createdAt, que vêm da sessão). */
type ProfileResponse = ProfileRequestBody;

function toRequest(profile: NutriProfile): ProfileRequestBody {
  return {
    sex: profile.sex,
    age: profile.age,
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
    goalWeightKg: profile.goalWeightKg ?? null,
    goal: profile.goal,
    activity: profile.activity,
    diet: profile.diet,
    restrictions: profile.restrictions,
    mealsPerDay: profile.mealsPerDay,
    waterGlasses: profile.waterGlasses,
    meals: profile.meals ?? [],
    wakeTime: profile.wakeTime ?? null,
    trainTime: profile.trainTime ?? null,
    sleepTime: profile.sleepTime ?? null,
  };
}

function fromResponse(res: ProfileResponse, user: User): NutriProfile {
  return {
    name: user.name,
    email: user.email,
    sex: res.sex,
    age: res.age,
    heightCm: res.heightCm,
    weightKg: res.weightKg,
    goalWeightKg: res.goalWeightKg ?? undefined,
    goal: res.goal,
    activity: res.activity,
    diet: res.diet,
    restrictions: res.restrictions,
    mealsPerDay: res.mealsPerDay,
    waterGlasses: res.waterGlasses,
    meals: res.meals,
    wakeTime: res.wakeTime ?? undefined,
    trainTime: res.trainTime ?? undefined,
    sleepTime: res.sleepTime ?? undefined,
    // Preserva o createdAt do cache (o backend não guarda esse campo).
    createdAt: getNutriProfile()?.createdAt ?? new Date().toISOString(),
  };
}

/** Persiste o perfil no servidor (PUT) e atualiza o cache local. */
export async function pushNutriProfile(profile: NutriProfile): Promise<void> {
  await api.put("/nutri/profile", toRequest(profile));
  saveNutriProfile(profile);
}

/* --- hidratação do perfil a partir do servidor (uma vez por sessão/usuário) --- */

let hydratedUserId: string | null = null;
let hydrating: Promise<void> | null = null;

/** Carrega o perfil do servidor pro cache. 404 = ainda sem onboarding (cache vira null). */
async function fetchNutriProfile(user: User): Promise<void> {
  try {
    const { data } = await api.get<ProfileResponse>("/nutri/profile");
    saveNutriProfile(fromResponse(data, user));
  } catch (error) {
    if ((error as { status?: number }).status === 404) {
      clearNutriProfile();
    }
    // Outros erros (rede): mantém o cache, falha silenciosa.
  }
}

/** True se o perfil deste usuário já foi hidratado nesta sessão. */
export function isNutriProfileHydrated(user: User): boolean {
  return hydratedUserId === user.id;
}

/** Garante (uma única vez por usuário) que o perfil foi carregado do servidor. */
export function ensureNutriProfileHydrated(user: User): Promise<void> {
  if (hydratedUserId === user.id) return Promise.resolve();
  if (hydrating) return hydrating;
  hydrating = fetchNutriProfile(user).finally(() => {
    hydratedUserId = user.id;
    hydrating = null;
  });
  return hydrating;
}

/** Zera a hidratação (chamado no logout pra o próximo usuário recarregar). */
export function resetNutriProfileHydration(): void {
  hydratedUserId = null;
  hydrating = null;
}

/**
 * Cria a conta e persiste o perfil do BRL Nutri no servidor.
 * O onboarding é o cadastro completo: registra, abre sessão e grava o plano.
 */
export async function completeOnboarding({
  password,
  ...profileInput
}: OnboardingInput): Promise<NutriProfile> {
  const auth = await registerUser(
    profileInput.name,
    profileInput.email,
    password,
  );

  setAuth(auth.user, auth.token, auth.refreshToken);

  const profile: NutriProfile = {
    ...profileInput,
    createdAt: new Date().toISOString(),
  };

  await pushNutriProfile(profile);
  // Já temos o perfil em mãos — evita um refetch ao cair no /nutri.
  hydratedUserId = auth.user.id;
  return profile;
}

/**
 * Salva o plano pra um usuário JÁ autenticado — sem criar conta de novo.
 * Usado quando alguém logado monta (ou refaz) o plano pelo onboarding.
 */
export async function saveNutriProfileForCurrentUser(
  input: Omit<NutriProfile, "createdAt">,
): Promise<NutriProfile> {
  const existing = getNutriProfile();
  const profile: NutriProfile = {
    ...input,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
  await pushNutriProfile(profile);
  return profile;
}
