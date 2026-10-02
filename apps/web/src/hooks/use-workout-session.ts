"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useToast } from "@/components/ui/toast";
import { useFitPlan } from "@/hooks/use-fit-plan";
import { createSession, skipRest, toPayload, type ActiveSession } from "@/lib/fit-session";
import { weekdayInSaoPaulo, workoutForWeekday } from "@/lib/fit-week";
import { fitProgressionQuery } from "@/hooks/use-fit-progression";
import { getLastLoads, loadActive, saveActive, submitSession } from "@/services/fit-sessions.service";

/** Retoma o treino salvo ou começa o de hoje (snapshot do plano); undefined = carregando, null = nada hoje. */
export function useActiveSession(uid: string | undefined) {
  const plan = useFitPlan();
  const qc = useQueryClient();
  const [session, setSession] = useState<ActiveSession | null | undefined>(undefined);
  useEffect(() => {
    if (!uid || !plan) return;
    let live = true;
    const start = async () => {
      const existing = loadActive(uid);
      if (existing) return existing;
      const day = workoutForWeekday(plan, weekdayInSaoPaulo());
      if (!day) return null;
      const [loads, prog] = await Promise.all([
        getLastLoads(uid),
        qc.fetchQuery({ ...fitProgressionQuery(uid), staleTime: 0 }).then((p) => p.exercises, () => ({})),
      ]);
      const fresh = createSession(day, loads, new Date(), crypto.randomUUID(), prog);
      saveActive(uid, fresh);
      return fresh;
    };
    void start().then((s) => live && setSession(s));
    return () => {
      live = false;
    };
  }, [uid, plan, qc]);
  return { ready: !!plan, session, setSession };
}

type SetSession = (fn: (s: ActiveSession | null | undefined) => ActiveSession | null | undefined) => void;

/** Ao fim do descanso (timer sobrevive ao reload via endsAt): zera, marca e avisa. */
export function useRestEnd(session: ActiveSession | null | undefined, setSession: SetSession, fire: () => void) {
  const [restDone, setRestDone] = useState(false);
  const rest = session?.rest;
  useEffect(() => {
    if (!rest || rest.endsAt === null) return;
    const id = window.setTimeout(() => {
      setSession((s) => (s ? skipRest(s) : s));
      setRestDone(true);
      fire();
    }, Math.max(0, rest.endsAt - Date.now()));
    return () => window.clearTimeout(id);
  }, [rest, fire, setSession]);
  return { restDone, setRestDone };
}

/** Autosave do treino em andamento + concluir (fila com clientId) e descartar. */
export function useWorkoutActions(uid: string | undefined, session: ActiveSession | null | undefined) {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (uid && session && !busy) saveActive(uid, session);
  }, [uid, session, busy]);

  async function finish() {
    if (!uid || !session) return;
    setBusy(true);
    const { left, rejected } = await submitSession(uid, toPayload(session, new Date()));
    if (rejected) toast({ variant: "error", title: "Treino não enviado", description: `O servidor recusou: ${rejected} — ficou em não sincronizados.` });
    else if (left > 0) toast({ variant: "info", title: "Treino salvo no aparelho", description: "Sem conexão agora: enviamos assim que a rede voltar." });
    await qc.invalidateQueries({ queryKey: ["fit-progression"] });
    router.replace("/fit/app?aba=progresso");
  }

  function cancel() {
    if (!uid || !window.confirm("Descartar este treino? As séries registradas serão perdidas.")) return;
    saveActive(uid, null);
    router.replace("/fit/app");
  }
  return { busy, finish, cancel };
}
