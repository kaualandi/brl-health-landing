"use client";

import { useSyncExternalStore } from "react";

import {
  getResolvedThemeServerSnapshot,
  getResolvedThemeSnapshot,
  getThemeChoiceSnapshot,
  getThemeServerSnapshot,
  setThemeChoice,
  subscribeTheme,
  type ResolvedTheme,
  type ThemeChoice,
} from "@/lib/theme-store";

export type UseTheme = {
  /** Escolha do usuário; undefined no primeiro paint (SSR-safe). */
  choice: ThemeChoice | undefined;
  /** Tema concreto aplicado; undefined no primeiro paint. */
  resolvedTheme: ResolvedTheme | undefined;
  setTheme: (choice: ThemeChoice) => void;
};

/** Hook de tema. SSR-safe — devolve undefined no primeiro paint. */
export function useTheme(): UseTheme {
  const choice = useSyncExternalStore(
    subscribeTheme,
    getThemeChoiceSnapshot,
    getThemeServerSnapshot,
  );

  const resolvedTheme = useSyncExternalStore(
    subscribeTheme,
    getResolvedThemeSnapshot,
    getResolvedThemeServerSnapshot,
  );

  return { choice, resolvedTheme, setTheme: setThemeChoice };
}
