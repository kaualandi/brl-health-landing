import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

import {
  authTokenKey,
  clearAuth,
  getRefreshToken,
  setAuth,
} from "@/lib/auth-store";

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5226";

export const api = axios.create({
  baseURL,
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
});

/** Shape de erro do backend: 401 → { error }, 400 validação → { errors: [] }. */
type ApiError = { error?: string; errors?: string[]; message?: string };

/** Config interna + flag pra não tentar o refresh mais de uma vez por request. */
type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window === "undefined") return config;

  const token = window.localStorage.getItem(authTokenKey);
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

/**
 * Renova a sessão via refresh token rotativo. Usa um axios "cru" (sem este
 * interceptor) pra não recursar, e compartilha uma única promessa entre requests
 * concorrentes que esbarrem no 401 ao mesmo tempo.
 */
let refreshPromise: Promise<string | null> | null = null;

async function refreshSession(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const { data } = await axios.post<{
      user: Parameters<typeof setAuth>[0];
      token: string;
      refreshToken: string;
    }>(
      `${baseURL}/auth/refresh`,
      { refreshToken },
      { headers: { "Content-Type": "application/json" } },
    );
    setAuth(data.user, data.token, data.refreshToken);
    return data.token;
  } catch {
    clearAuth();
    return null;
  }
}

function extractMessage(error: AxiosError<ApiError>): string {
  const data = error.response?.data;
  if (data) {
    if (typeof data.error === "string") return data.error;
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      return String(data.errors[0]);
    }
    if (typeof data.message === "string") return data.message;
  }
  if (error.response?.status === 429) {
    return "Muitas tentativas. Aguarde um instante e tente de novo.";
  }
  return error.message ?? "Algo deu errado na requisição.";
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const url = original?.url ?? "";
    // Rotas /auth/* não renovam (login/refresh/etc. não têm sessão a renovar).
    const isAuthRoute = url.includes("/auth/");

    if (
      status === 401 &&
      original &&
      !original._retry &&
      !isAuthRoute &&
      typeof window !== "undefined" &&
      getRefreshToken()
    ) {
      original._retry = true;
      refreshPromise ??= refreshSession();
      const newToken = await refreshPromise.finally(() => {
        refreshPromise = null;
      });

      if (newToken) {
        original.headers.set("Authorization", `Bearer ${newToken}`);
        return api.request(original);
      }
    }

    // Refresh não rolou (ou nem se aplica): encerra a sessão local no 401.
    if (status === 401 && typeof window !== "undefined") {
      clearAuth();
    }

    // Preserva o status no Error (services distinguem 404, 400, etc.); os forms
    // seguem lendo `error.message` normalmente.
    const rejection = new Error(extractMessage(error)) as Error & {
      status?: number;
    };
    rejection.status = status;
    return Promise.reject(rejection);
  },
);
