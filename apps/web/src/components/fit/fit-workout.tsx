"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";

import { ExerciseCard } from "@/components/fit/workout-sets";
import { RestBar, useAlerts, useNow } from "@/components/fit/workout-rest";
import { WorkoutSummary } from "@/components/fit/workout-summary";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/use-auth";
import { useFitPlan } from "@/hooks/use-fit-plan";
import { workoutForWeekday, weekdayInSaoPaulo } from "@/lib/fit-week";
import {
  createSession, doneCount, elapsedSeconds, formatClock, pauseRest, resumeRest,
  skipRest, toggleDone, toPayload, updateSet, type ActiveSession, type SessionSet,
} from "@/lib/fit-session";
import { getLastLoads, loadActive, saveActive, submitSession } from "@/services/fit-sessions.service";

/** undefined = carregando, null = nada pra executar hoje. */
function useActiveSession(uid: string | undefined) {
  const plan = useFitPlan();
  const [session, setSession] = useState<ActiveSession | null | undefined>(undefined);
  useEffect(() => {
    if (!uid || !plan) return;
    let live = true;
    const start = async () => {
      const existing = loadActive(uid);
      if (existing) return existing;
      const day = workoutForWeekday(plan, weekdayInSaoPaulo());
      if (!day) return null;
      const fresh = createSession(day, await getLastLoads(uid), new Date(), crypto.randomUUID());
      saveActive(uid, fresh);
      return fresh;
    };
    void start().then((s) => live && setSession(s));
    return () => {
      live = false;
    };
  }, [uid, plan]);
  return { plan, session, setSession };
}

function Header({ name, seconds, onCancel }: { name: string; seconds: number; onCancel: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 pt-6">
      <div className="min-w-0">
        <Link href="/fit/app" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeftIcon aria-hidden className="size-3.5" /> Hoje
        </Link>
        <h1 className="line-clamp-2 font-display text-lg leading-tight font-extrabold tracking-tight">{name}</h1>
      </div>
      <div className="text-right">
        <p className="text-xs text-muted-foreground">Tempo</p>
        <p className="font-display text-xl font-extrabold tabular-nums">{formatClock(seconds)}</p>
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
        Descartar
      </Button>
    </div>
  );
}

export function FitWorkout() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const { plan, session, setSession } = useActiveSession(user?.id);
  const [finishing, setFinishing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [restDone, setRestDone] = useState(false);
  const now = useNow();
  const alerts = useAlerts();

  useEffect(() => {
    if (session === null) router.replace("/fit/app");
  }, [session, router]);

  useEffect(() => {
    if (user && session && !busy) saveActive(user.id, session);
  }, [user, session, busy]);

  const rest = session?.rest;
  const fire = alerts.fire;
  useEffect(() => {
    if (!rest || rest.endsAt === null) return;
    const id = window.setTimeout(() => {
      setSession((s) => (s ? skipRest(s) : s));
      setRestDone(true);
      fire();
    }, Math.max(0, rest.endsAt - Date.now()));
    return () => window.clearTimeout(id);
  }, [rest, fire, setSession]);

  if (!user || !plan || !session) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2Icon className="size-6 animate-spin text-brl-purple" aria-label="Carregando" />
      </div>
    );
  }
  const day = plan.days.find((d) => d.index === session.dayIndex);
  const seconds = elapsedSeconds(session.startedAt, now);
  const edit = (fn: (s: ActiveSession) => ActiveSession) => setSession(fn(session));
  const patch = (order: number, n: number, p: Partial<SessionSet>) => edit((s) => updateSet(s, order, n, p));
  const toggle = (order: number, n: number) => {
    setRestDone(false);
    edit((s) => toggleDone(s, order, n, Date.now()));
  };

  async function finish() {
    if (!user || !session) return;
    setBusy(true);
    const left = await submitSession(user.id, toPayload(session, new Date()));
    if (left > 0) toast({ variant: "info", title: "Treino salvo no aparelho", description: "Sem conexão agora: enviamos assim que a rede voltar." });
    router.replace("/fit/app?aba=progresso");
  }

  function cancel() {
    if (!user || !window.confirm("Descartar este treino? As séries registradas serão perdidas.")) return;
    saveActive(user.id, null);
    router.replace("/fit/app");
  }

  return (
    <div className="min-h-dvh bg-background pb-40">
      <main className="mx-auto w-full max-w-3xl px-4 md:px-6">
        {finishing ? (
          <WorkoutSummary sets={session.sets} seconds={seconds} busy={busy} onBack={() => setFinishing(false)} onConfirm={finish} />
        ) : (
          <>
            <Header name={session.dayName} seconds={seconds} onCancel={cancel} />
            <div className="mt-5 flex flex-col gap-4">
              {day?.exercises.map((item) => (
                <ExerciseCard
                  key={item.order}
                  item={item}
                  sets={session.sets.filter((s) => s.exerciseOrder === item.order)}
                  onChange={(n, p) => patch(item.order, n, p)}
                  onToggle={(n) => toggle(item.order, n)}
                />
              ))}
            </div>
            <Button type="button" className="mt-6 h-12 w-full" onClick={() => setFinishing(true)}>
              Concluir treino ({doneCount(session.sets)}/{session.sets.length})
            </Button>
          </>
        )}
      </main>
      {finishing ? null : (
        <RestBar
          rest={session.rest}
          done={restDone}
          now={now}
          alerts={alerts}
          onPause={() => edit((s) => pauseRest(s, Date.now()))}
          onResume={() => edit((s) => resumeRest(s, Date.now()))}
          onSkip={() => edit(skipRest)}
        />
      )}
    </div>
  );
}
