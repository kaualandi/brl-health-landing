"use client";

import { useSyncExternalStore } from "react";

import {
  clearAuth,
  getAuthServerSnapshot,
  getAuthSnapshot,
  getRefreshToken,
  setAuth,
  subscribeAuth,
  type AuthState,
} from "@/lib/auth-store";
import { logoutUser } from "@/services/auth.service";
import type { User } from "@/types";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export type UseAuth = {
  /** undefined enquanto lê o localStorage; depois a sessão (ou null). */
  state: AuthState | undefined;
  user: User | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string, refreshToken: string) => void;
  logout: () => void;
};

/** Encerra a sessão no servidor (best-effort) e limpa o estado local. */
function logout(): void {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    void logoutUser(refreshToken).catch(() => {
      // Logout é best-effort: o token expira sozinho e a sessão local já caiu.
    });
  }
  clearAuth();
}

/** Hook de sessão. SSR-safe — devolve `loading` no primeiro paint. */
export function useAuth(): UseAuth {
  const state = useSyncExternalStore(
    subscribeAuth,
    getAuthSnapshot,
    getAuthServerSnapshot,
  );

  const status: AuthStatus =
    state === undefined
      ? "loading"
      : state
        ? "authenticated"
        : "unauthenticated";

  return {
    state,
    user: state?.user ?? null,
    status,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    login: setAuth,
    logout,
  };
}
