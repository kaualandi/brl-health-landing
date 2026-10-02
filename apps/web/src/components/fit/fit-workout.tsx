"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";

import { ExerciseCard } from "@/components/fit/workout-sets";
import { RestBar, useAlerts, useNow } from "@/components/fit/workout-rest";
import { WorkoutSummary } from "@/components/fit/workout-summary";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useActiveSession, useRestEnd, useWorkoutActions } from "@/hooks/use-workout-session";
import {
  doneCount, elapsedSeconds, formatClock, pauseRest, resumeRest, skipRest, toggleDone, updateSet,
  type ActiveSession,
} from "@/lib/fit-session";

function Spinner() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Loader2Icon className="size-6 animate-spin text-brl-purple" aria-label="Carregando" />
    </div>
  );
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

type BodyProps = {
  session: ActiveSession;
  now: number;
  alerts: ReturnType<typeof useAlerts>;
  restDone: boolean;
  onEdit: (fn: (s: ActiveSession) => ActiveSession) => void;
  onToggle: (order: number, n: number) => void;
  actions: ReturnType<typeof useWorkoutActions>;
};

type ListProps = Pick<BodyProps, "session" | "onEdit" | "onToggle">;

function ExerciseList({ session, onEdit, onToggle }: ListProps) {
  return (
    <div className="mt-5 flex flex-col gap-4">
      {session.exercises.map((item) => (
        <ExerciseCard
          key={item.order}
          item={item}
          sets={session.sets.filter((s) => s.exerciseOrder === item.order)}
          onChange={(n, p) => onEdit((s) => updateSet(s, item.order, n, p))}
          onToggle={(n) => onToggle(item.order, n)}
        />
      ))}
    </div>
  );
}

function WorkoutBody({ session, now, alerts, restDone, onEdit, onToggle, actions }: BodyProps) {
  const [finishing, setFinishing] = useState(false);
  const seconds = elapsedSeconds(session.startedAt, now);
  if (finishing) {
    return <WorkoutSummary sets={session.sets} seconds={seconds} busy={actions.busy} onBack={() => setFinishing(false)} onConfirm={actions.finish} />;
  }
  return (
    <>
      <Header name={session.dayName} seconds={seconds} onCancel={actions.cancel} />
      <ExerciseList session={session} onEdit={onEdit} onToggle={onToggle} />
      <Button type="button" className="mt-6 h-12 w-full" onClick={() => setFinishing(true)}>
        Concluir treino ({doneCount(session.sets)}/{session.sets.length})
      </Button>
      <RestBar
        rest={session.rest}
        done={restDone}
        now={now}
        alerts={alerts}
        onPause={() => onEdit((s) => pauseRest(s, Date.now()))}
        onResume={() => onEdit((s) => resumeRest(s, Date.now()))}
        onSkip={() => onEdit(skipRest)}
      />
    </>
  );
}

export function FitWorkout() {
  const { user } = useAuth();
  const router = useRouter();
  const { ready, session, setSession } = useActiveSession(user?.id);
  const alerts = useAlerts();
  const { restDone, setRestDone } = useRestEnd(session, setSession, alerts.fire);
  const actions = useWorkoutActions(user?.id, session);
  const now = useNow();

  useEffect(() => {
    if (session === null) router.replace("/fit/app");
  }, [session, router]);

  if (!user || !ready || !session) return <Spinner />;
  const edit = (fn: (s: ActiveSession) => ActiveSession) => setSession(fn(session));
  const toggle = (order: number, n: number) => {
    setRestDone(false);
    edit((s) => toggleDone(s, order, n, Date.now()));
  };
  return (
    <div className="min-h-dvh bg-background pb-40">
      <main className="mx-auto w-full max-w-3xl px-4 md:px-6">
        <WorkoutBody session={session} now={now} alerts={alerts} restDone={restDone} onEdit={edit} onToggle={toggle} actions={actions} />
      </main>
    </div>
  );
}
