import type { User } from "@/types";

/**
 * Fonte única de verdade da sessão no client.
 * Padrão SSR-safe (useSyncExternalStore) pra ler o localStorage sem `setState`
 * em effect e sem mismatch de hidratação.
 *
 * As chaves de storage vivem aqui (não no axios) pra evitar ciclo de import: o
 * `axios.ts` importa as chaves + `setAuth`/`clearAuth`/`getRefreshToken` deste
 * módulo (uma direção só) para anexar o Bearer e fazer o refresh rotativo no 401.
 */

const USER_STORAGE_KEY = "brl.auth.user";
const TOKEN_STORAGE_KEY = "brl.auth.token";
const REFRESH_STORAGE_KEY = "brl.auth.refresh";

/** Chave do access token (lida pelo interceptor do axios). */
export const authTokenKey = TOKEN_STORAGE_KEY;
/** Chave do refresh token (usada no fluxo de renovação do axios). */
export const authRefreshKey = REFRESH_STORAGE_KEY;

export type AuthState = {
  user: User;
  token: string;
  refreshToken: string;
} | null;

type Listener = () => void;
const listeners = new Set<Listener>();

let cachedUserRaw: string | null | undefined;
let cachedToken: string | null | undefined;
let cachedRefresh: string | null | undefined;
let cachedState: AuthState = null;

function parseUser(raw: string): User | null {
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

/** Snapshot estável: só recalcula quando user/token/refresh brutos mudam. */
function readSnapshot(): AuthState {
  const userRaw = window.localStorage.getItem(USER_STORAGE_KEY);
  const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
  const refreshToken = window.localStorage.getItem(REFRESH_STORAGE_KEY);

  if (
    userRaw !== cachedUserRaw ||
    token !== cachedToken ||
    refreshToken !== cachedRefresh
  ) {
    cachedUserRaw = userRaw;
    cachedToken = token;
    cachedRefresh = refreshToken;
    const user = userRaw ? parseUser(userRaw) : null;
    cachedState =
      user && token ? { user, token, refreshToken: refreshToken ?? "" } : null;
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

export function setAuth(user: User, token: string, refreshToken: string): void {
  if (typeof window === "undefined") return;
  const userRaw = JSON.stringify(user);
  window.localStorage.setItem(USER_STORAGE_KEY, userRaw);
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  window.localStorage.setItem(REFRESH_STORAGE_KEY, refreshToken);
  cachedUserRaw = userRaw;
  cachedToken = token;
  cachedRefresh = refreshToken;
  cachedState = { user, token, refreshToken };
  emit();
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(USER_STORAGE_KEY);
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(REFRESH_STORAGE_KEY);
  cachedUserRaw = null;
  cachedToken = null;
  cachedRefresh = null;
  cachedState = null;
  emit();
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_STORAGE_KEY);
}
