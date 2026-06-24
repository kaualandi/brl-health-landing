import { authTokenKey } from "@/lib/axios";
import type { User } from "@/types";

/**
 * Fonte única de verdade da sessão no client.
 * Mesmo padrão SSR-safe do perfil do Nutri (useSyncExternalStore), pra ler
 * o localStorage sem `setState` em effect e sem mismatch de hidratação.
 *
 * O token continua na chave usada pelo interceptor do axios (`authTokenKey`),
 * então a troca pelo backend real não muda nada aqui.
 */

const USER_STORAGE_KEY = "brl.auth.user";

export type AuthState = { user: User; token: string } | null;

type Listener = () => void;
const listeners = new Set<Listener>();

let cachedUserRaw: string | null | undefined;
let cachedToken: string | null | undefined;
let cachedState: AuthState = null;

function parseUser(raw: string): User | null {
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

/** Snapshot estável: só recalcula quando user ou token brutos mudam. */
function readSnapshot(): AuthState {
  const userRaw = window.localStorage.getItem(USER_STORAGE_KEY);
  const token = window.localStorage.getItem(authTokenKey);

  if (userRaw !== cachedUserRaw || token !== cachedToken) {
    cachedUserRaw = userRaw;
    cachedToken = token;
    const user = userRaw ? parseUser(userRaw) : null;
    cachedState = user && token ? { user, token } : null;
  }
  return cachedState;
}

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeAuth(listener: Listener): () => void {
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

/** Client: sessão atual (null = deslogado). */
export function getAuthSnapshot(): AuthState {
  if (typeof window === "undefined") return null;
  return readSnapshot();
}

/** Servidor / primeiro paint: undefined = ainda lendo o localStorage. */
export function getAuthServerSnapshot(): AuthState | undefined {
  return undefined;
}

/* --- escrita imperativa --- */

export function setAuth(user: User, token: string): void {
  if (typeof window === "undefined") return;
  const userRaw = JSON.stringify(user);
  window.localStorage.setItem(USER_STORAGE_KEY, userRaw);
  window.localStorage.setItem(authTokenKey, token);
  cachedUserRaw = userRaw;
  cachedToken = token;
  cachedState = { user, token };
  emit();
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(USER_STORAGE_KEY);
  window.localStorage.removeItem(authTokenKey);
  cachedUserRaw = null;
  cachedToken = null;
  cachedState = null;
  emit();
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(authTokenKey);
}
