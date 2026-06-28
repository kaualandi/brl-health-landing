"use client";

import { MoonIcon, SunIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

/**
 * Botão acessível de alternância claro/escuro. Pra não haver mismatch de
 * hidratação, fica num estado neutro (placeholder do tamanho do ícone) até o
 * tema ser resolvido no client (`resolvedTheme` undefined no SSR/primeiro
 * paint, definido após a hidratação via useSyncExternalStore).
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  const mounted = resolvedTheme !== undefined;
  // Sem valor resolvido (primeiro paint) tratamos como escuro, o default.
  const isDark = resolvedTheme !== "light";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={className}
      aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {mounted ? (
        isDark ? (
          <SunIcon aria-hidden="true" />
        ) : (
          <MoonIcon aria-hidden="true" />
        )
      ) : (
        <span className="size-4" aria-hidden="true" />
      )}
    </Button>
  );
}
