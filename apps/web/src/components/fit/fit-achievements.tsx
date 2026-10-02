"use client";

import { TrophyIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Confetti } from "@/components/ui/confetti";
import { useAuth } from "@/hooks/use-auth";
import { computeFitAchievements, loadSeen, newlyUnlocked, saveSeen } from "@/lib/fit-achievements";
import { cn } from "@/lib/utils";
import type { FitStats } from "@/services/fit-stats.service";

/** Confete uma vez por conquista (ids vistos ficam no aparelho, por usuário). */
function useCelebrate(uid: string | undefined, list: ReturnType<typeof computeFitAchievements>) {
  const [fireKey, setFireKey] = useState(0);
  useEffect(() => {
    if (!uid) return;
    // setTimeout(0): evita setState síncrono no effect (e o salvar+disparar fica atômico).
    const id = window.setTimeout(() => {
      const seen = loadSeen(uid) ?? [];
      const fresh = newlyUnlocked(list, seen);
      if (!fresh.length) return;
      saveSeen(uid, [...seen, ...fresh]);
      setFireKey((k) => k + 1);
    }, 0);
    return () => window.clearTimeout(id);
  }, [uid, list]);
  return fireKey;
}

export function FitAchievements({ stats }: { stats: FitStats }) {
  const { user } = useAuth();
  const list = useMemo(() => computeFitAchievements(stats), [stats]);
  const fireKey = useCelebrate(user?.id, list);
  return (
    <section aria-label="Conquistas" className="flex flex-col gap-2">
      <Confetti fireKey={fireKey} />
      <h3 className="flex items-center gap-2 text-sm font-bold">
        <TrophyIcon aria-hidden className="size-4 text-brl-orange" />
        Conquistas
        <span className="ml-auto text-muted-foreground tabular-nums">
          {list.filter((a) => a.unlocked).length}/{list.length}
        </span>
      </h3>
      <ul className="grid gap-2 sm:grid-cols-2">
        {list.map((a) => (
          <li key={a.id} className={cn("flex items-center gap-3 rounded-xl border p-3", a.unlocked ? "border-brl-orange/40 bg-brl-orange/10" : "border-foreground/10 bg-foreground/[0.02]")}>
            <span aria-hidden className={cn("text-2xl", !a.unlocked && "opacity-40 grayscale")}>
              {a.emoji}
            </span>
            <span className="min-w-0 flex-1">
              <span className={cn("block text-sm font-semibold", !a.unlocked && "text-muted-foreground")}>
                {a.title}
                <span className="sr-only">{a.unlocked ? " (desbloqueada)" : " (bloqueada)"}</span>
              </span>
              <span className="block text-xs text-muted-foreground">{a.description}</span>
            </span>
            {a.unlocked ? <span aria-hidden className="text-xs font-semibold text-brl-orange">✓</span> : <span className="text-xs text-muted-foreground tabular-nums">{Math.round(a.progress * 100)}%</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}
