"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { useAuth } from "@/hooks/use-auth";
import {
  ensureFitProfileHydrated,
  getFitProfileServerSnapshot,
  getFitProfileSnapshot,
  isFitProfileHydrated,
  subscribeFitProfile,
} from "@/services/fit.service";

/** Perfil de treino do usuário logado: undefined = carregando, null = sem perfil. */
export function useFitProfile() {
  const { user } = useAuth();
  const cached = useSyncExternalStore(subscribeFitProfile, getFitProfileSnapshot, getFitProfileServerSnapshot);
  const [, setReady] = useState(false);

  useEffect(() => {
    if (user) void ensureFitProfileHydrated(user).then(() => setReady(true));
  }, [user]);

  return user && isFitProfileHydrated(user) ? cached : undefined;
}
