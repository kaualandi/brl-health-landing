"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useAuth } from "@/hooks/use-auth";
import { TODAY_ENERGY_KEY } from "@/hooks/use-today-energy";
import { flushQueue } from "@/services/fit-sessions.service";

/** Reenvia treinos pendentes ao abrir o app e quando a rede volta. */
export function useFitSync(onSynced?: () => void) {
  const { user } = useAuth();
  const uid = user?.id;
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!uid) return;
    const run = () => void flushQueue(uid).then(() => {
      void queryClient.invalidateQueries({ queryKey: TODAY_ENERGY_KEY });
      onSynced?.();
    });
    run();
    window.addEventListener("online", run);
    return () => window.removeEventListener("online", run);
  }, [uid, onSynced, queryClient]);
}
