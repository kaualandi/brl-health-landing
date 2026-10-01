"use client";

import { useEffect } from "react";

/**
 * Registra o service worker (`/sw.js`) — habilitando offline e cache de assets.
 * Só roda em produção e quando a API existe, pra não interferir no dev nem
 * quebrar em navegadores sem suporte. Não renderiza nada.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      typeof navigator === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        // TODO: enviar para serviço de monitoramento (Sentry) na fase de produção.
        console.error("Falha ao registrar o service worker:", error);
      });
    };

    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
