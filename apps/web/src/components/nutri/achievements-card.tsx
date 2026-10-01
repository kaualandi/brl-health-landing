"use client";

import { TrophyIcon } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { Confetti } from "@/components/ui/confetti";
import { useFavorites } from "@/hooks/use-favorites";
import { useHabits, useWater, useWeightLog } from "@/hooks/use-nutri-tracking";
import { computeAchievements } from "@/lib/achievements";
import {
  getMeasurementsServerSnapshot,
  getMeasurementsSnapshot,
  subscribeMeasurements,
} from "@/lib/measurements-store";
import { DAILY_HABITS } from "@/lib/nutri-content";
import { cn } from "@/lib/utils";

export function AchievementsCard({ waterGoalMl }: { waterGoalMl: number }) {
  const { entries } = useWeightLog();
  const { done, streak } = useHabits();
  const { ml } = useWater();
  const { favorites } = useFavorites();
  const measurements = useSyncExternalStore(
    subscribeMeasurements,
    getMeasurementsSnapshot,
    getMeasurementsServerSnapshot,
  );

  const habitsDone = DAILY_HABITS.filter((habit) => done[habit.id]).length;

  const achievements = computeAchievements({
    weightCount: entries.length,
    measurementCount: measurements.length,
    waterMl: ml,
    waterGoalMl,
    habitsDone,
    habitsTotal: DAILY_HABITS.length,
    streak,
    favoritesCount: favorites.length,
  });

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const total = achievements.length;

  // Confete quando uma nova conquista é desbloqueada — sem disparar no primeiro
  // paint (a primeira leitura do store apenas registra o baseline).
  const [fireKey, setFireKey] = useState(0);
  const prevUnlocked = useRef<number | null>(null);
  useEffect(() => {
    if (prevUnlocked.current === null) {
      prevUnlocked.current = unlockedCount;
      return;
    }
    if (unlockedCount > prevUnlocked.current) {
      setFireKey((k) => k + 1);
    }
    prevUnlocked.current = unlockedCount;
  }, [unlockedCount]);

  return (
    <div className="rounded-2xl border border-foreground/5 bg-brl-card p-6 md:p-8">
      <Confetti fireKey={fireKey} />
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-display text-lg font-bold">
          <TrophyIcon className="size-4 text-brl-orange" />
          Conquistas
        </h3>
        <span className="shrink-0 text-sm font-medium tabular-nums text-muted-foreground">
          {unlockedCount}/{total}
        </span>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {achievements.map((achievement) => {
          const pct = Math.round(achievement.progress * 100);
          return (
            <li
              key={achievement.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 transition-colors",
                achievement.unlocked
                  ? "border-brl-orange/40 bg-brl-orange/10"
                  : "border-foreground/8 bg-foreground/[0.02]",
              )}
            >
              <span
                className={cn(
                  "text-2xl transition-opacity",
                  achievement.unlocked ? "opacity-100" : "opacity-40 grayscale",
                )}
                aria-hidden
              >
                {achievement.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={cn(
                      "truncate text-sm font-semibold",
                      achievement.unlocked
                        ? "text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {achievement.title}
                  </p>
                  {achievement.unlocked ? (
                    <span className="shrink-0 text-xs font-semibold text-brl-orange">
                      ✓
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                      {pct}%
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {achievement.description}
                </p>
                {!achievement.unlocked ? (
                  <div
                    className="mt-2 h-1.5 overflow-hidden rounded-full bg-foreground/10"
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Progresso: ${achievement.title}`}
                  >
                    <div
                      className="h-full rounded-full bg-brl-orange/70 transition-[width] duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
