"use client";

import { CheckIcon, UtensilsCrossedIcon } from "lucide-react";

import { useMeals } from "@/hooks/use-nutri-tracking";
import { cn } from "@/lib/utils";
import type { NutriPlan } from "@/types";

export function MealDiary({ plan }: { plan: NutriPlan }) {
  const { done, toggle } = useMeals();

  const consumed = plan.meals.reduce(
    (sum, meal) => sum + (done[meal.name] ? meal.kcal : 0),
    0,
  );
  const target = plan.targetCalories;
  const pct = target > 0 ? Math.min(100, Math.round((consumed / target) * 100)) : 0;
  const remaining = Math.max(0, target - consumed);
  const reached = consumed >= target;
  const over = consumed > target;

  return (
    <div className="rounded-2xl border border-white/5 bg-brl-card p-6 md:p-8">
      <div className="mb-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="flex items-center gap-2 font-display text-lg font-bold">
            <UtensilsCrossedIcon className="size-4 text-brl-purple" />
            Diário de hoje
          </h3>
          <span className="text-sm tabular-nums text-muted-foreground">
            <span
              className={cn(
                "font-semibold",
                over
                  ? "text-brl-orange"
                  : reached
                    ? "text-emerald-400"
                    : "text-foreground",
              )}
            >
              {consumed}
            </span>{" "}
            / {target} kcal
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-500",
              over ? "bg-brl-orange" : "bg-brl-purple",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {over
            ? `${consumed - target} kcal acima da meta`
            : reached
              ? "Meta do dia batida 🎯"
              : `faltam ${remaining} kcal`}
        </p>
      </div>

      <ul className="flex flex-col gap-2.5">
        {plan.meals.map((meal) => {
          const checked = Boolean(done[meal.name]);
          return (
            <li key={meal.name}>
              <button
                type="button"
                onClick={() => toggle(meal.name)}
                aria-pressed={checked}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  checked
                    ? "border-emerald-400/40 bg-emerald-400/10"
                    : "border-white/8 hover:border-white/15",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors",
                    checked
                      ? "bg-emerald-400 text-brl-dark"
                      : "bg-brl-purple/15 text-brl-purple",
                  )}
                >
                  {checked ? (
                    <CheckIcon className="size-4" />
                  ) : (
                    <UtensilsCrossedIcon className="size-3.5" />
                  )}
                </span>
                <span
                  className={cn(
                    "flex-1 text-sm font-medium md:text-base",
                    checked
                      ? "text-muted-foreground line-through"
                      : "text-foreground",
                  )}
                >
                  {meal.name}
                </span>
                <span className="font-display text-base font-bold tabular-nums text-foreground">
                  {meal.kcal}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    kcal
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
