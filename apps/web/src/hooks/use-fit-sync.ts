"use client";

import { useEffect } from "react";

import { useAuth } from "@/hooks/use-auth";
import { flushQueue } from "@/services/fit-sessions.service";

/** Reenvia treinos pendentes ao abrir o app e quando a rede volta. */
export function useFitSync(onSynced?: () => void) {
  const { user } = useAuth();
  const uid = user?.id;
  useEffect(() => {
    if (!uid) return;
    const run = () => void flushQueue(uid).then(() => onSynced?.());
    run();
    window.addEventListener("online", run);
    return () => window.removeEventListener("online", run);
  }, [uid, onSynced]);
}
