"use client";

import { useEffect } from "react";

import { useTheme } from "@/hooks/use-theme";

/**
 * Mantém a classe `dark` do <html> em sincronia com o store em TODA a app,
 * inclusive nas telas sem o toggle (ex.: /nutri) e quando a preferência do SO
 * muda com a escolha em "system". O script inline no <head> cuida do primeiro
 * paint; este watcher cobre as mudanças subsequentes. Não renderiza nada.
 */
export function ThemeWatcher() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!resolvedTheme) return;
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  }, [resolvedTheme]);

  return null;
}
