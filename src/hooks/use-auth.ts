"use client";

import { useSyncExternalStore } from "react";

import {
  clearAuth,
  getAuthServerSnapshot,
  getAuthSnapshot,
  setAuth,
  subscribeAuth,
  type AuthState,
} from "@/lib/auth-store";
import type { User } from "@/types";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export type UseAuth = {
  /** undefined enquanto lê o localStorage; depois a sessão (ou null). */
  state: AuthState | undefined;
  user: User | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
};

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
    logout: clearAuth,
  };
}
