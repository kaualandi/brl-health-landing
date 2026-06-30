import { setAuth } from "@/lib/auth-store";
import { registerUser } from "@/services/auth.service";
import type { NutriProfile } from "@/types";

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

/**
 * Cria a conta global (mock) e salva o perfil do BRL Nutri localmente.
 * Substitui o registro simples — o onboarding é o cadastro completo.
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

  saveNutriProfile(profile);
  return profile;
  // TODO: substituir por api.post('/auth/register') + api.put('/nutri/profile')
}

/**
 * Salva o plano pra um usuário JÁ autenticado — sem criar conta de novo.
 * Usado quando alguém logado monta (ou refaz) o plano pelo onboarding.
 */
export function saveNutriProfileForCurrentUser(
  input: Omit<NutriProfile, "createdAt">,
): NutriProfile {
  const profile: NutriProfile = {
    ...input,
    createdAt: new Date().toISOString(),
  };
  saveNutriProfile(profile);
  return profile;
  // TODO: substituir por api.put('/nutri/profile') na fase de backend
}
