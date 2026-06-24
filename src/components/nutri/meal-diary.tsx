"use client";

import {
  CheckIcon,
  ChevronRightIcon,
  RefreshCwIcon,
  UtensilsCrossedIcon,
} from "lucide-react";
import { useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMeals } from "@/hooks/use-nutri-tracking";
import { useMenu } from "@/hooks/use-menu";
import { alternativesCount, buildMealFoods, sumMeal } from "@/lib/foods";
import { cn } from "@/lib/utils";
import type { MealSlice, NutriPlan, NutriProfile } from "@/types";

function MealDetail({
  meal,
  profile,
  overrides,
  swap,
  eaten,
  onToggle,
}: {
  meal: MealSlice;
  profile: NutriProfile;
  overrides: Record<string, number>;
  swap: (key: string) => void;
  eaten: boolean;
  onToggle: () => void;
}) {
  const foods = buildMealFoods(
    meal.name,
    profile.diet,
    profile.restrictions,
    overrides,
  );
  const totals = sumMeal(foods);

  const macros = [
    { label: "Proteína", value: totals.protein, color: "text-brl-purple" },
    { label: "Carbo", value: totals.carb, color: "text-brl-orange" },
    { label: "Gordura", value: totals.fat, color: "text-emerald-400" },
  ];

  return (
    <>
      <SheetHeader className="border-b border-white/5 p-6">
        <p className="text-xs font-medium tracking-wide text-brl-purple uppercase">
          Detalhe da refeição
        </p>
        <SheetTitle className="font-display text-2xl font-extrabold tracking-tight">
          {meal.name}
        </SheetTitle>
        <SheetDescription>
          Sugestão pra ~{meal.kcal} kcal · {foods.length} itens
        </SheetDescription>
      </SheetHeader>

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 pb-4">
        {/* Totais do prato */}
        <div className="rounded-2xl border border-white/5 bg-brl-card p-5 text-center">
          <p className="font-display text-3xl font-extrabold tabular-nums text-foreground">
            {totals.kcal}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              kcal
            </span>
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {macros.map((m) => (
              <div
                key={m.label}
                className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5"
              >
                <p
                  className={cn(
                    "font-display text-lg font-bold tabular-nums",
                    m.color,
                  )}
                >
                  {m.value}
                  <span className="text-xs font-normal text-muted-foreground">
                    g
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Alimentos */}
        <ul className="flex flex-col gap-1">
          {foods.map((mf, i) => {
            const canSwap =
              alternativesCount(
                meal.name,
                i,
                profile.diet,
                profile.restrictions,
              ) > 1;
            return (
              <li key={mf.key} className="flex items-center gap-3 py-1.5">
                <span className="text-xl" aria-hidden>
                  {mf.food.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">
                    {mf.food.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {mf.food.portion} · {mf.food.kcal} kcal
                  </span>
                </span>
                {canSwap ? (
                  <button
                    type="button"
                    onClick={() => swap(mf.key)}
                    aria-label={`Trocar ${mf.food.name}`}
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 text-muted-foreground transition-colors outline-none hover:border-brl-purple/40 hover:text-brl-purple focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    <RefreshCwIcon className="size-4" />
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="border-t border-white/5 p-4">
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={eaten}
          className={cn(
            "flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            eaten
              ? "border border-emerald-400/40 bg-emerald-400/10 text-emerald-400"
              : "bg-brl-purple text-white hover:bg-brl-purple/90",
          )}
        >
          <CheckIcon className="size-4" />
          {eaten ? "Refeição feita" : "Marcar como feita"}
        </button>
      </div>
    </>
  );
}

export function MealDiary({
  plan,
  profile,
}: {
  plan: NutriPlan;
  profile: NutriProfile;
}) {
  const { done, toggle } = useMeals();
  const { overrides, swap } = useMenu();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<MealSlice | null>(null);

  const consumed = plan.meals.reduce(
    (sum, meal) => sum + (done[meal.name] ? meal.kcal : 0),
    0,
  );
  const target = plan.targetCalories;
  const pct = target > 0 ? Math.min(100, Math.round((consumed / target) * 100)) : 0;
  const remaining = Math.max(0, target - consumed);
  const reached = consumed >= target;
  const over = consumed > target;

  function openMeal(meal: MealSlice) {
    setActive(meal);
    setOpen(true);
  }

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
              <div
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3 transition-colors",
                  checked
                    ? "border-emerald-400/40 bg-emerald-400/10"
                    : "border-white/8",
                )}
              >
                <button
                  type="button"
                  onClick={() => toggle(meal.name)}
                  aria-pressed={checked}
                  aria-label={`Marcar ${meal.name} como feita`}
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    checked
                      ? "bg-emerald-400 text-brl-dark"
                      : "bg-brl-purple/15 text-brl-purple hover:bg-brl-purple/25",
                  )}
                >
                  {checked ? (
                    <CheckIcon className="size-4" />
                  ) : (
                    <UtensilsCrossedIcon className="size-3.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => openMeal(meal)}
                  aria-label={`Ver detalhe de ${meal.name}`}
                  className="flex flex-1 items-center justify-between gap-2 rounded-md text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <span
                    className={cn(
                      "text-sm font-medium md:text-base",
                      checked
                        ? "text-muted-foreground line-through"
                        : "text-foreground",
                    )}
                  >
                    {meal.name}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="font-display text-base font-bold tabular-nums text-foreground">
                      {meal.kcal}{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        kcal
                      </span>
                    </span>
                    <ChevronRightIcon className="size-4 text-muted-foreground" />
                  </span>
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <Sheet open={open} onOpenChange={(next) => setOpen(next)}>
        <SheetContent
          side="right"
          className="w-full gap-0 p-0 sm:max-w-md"
        >
          {active ? (
            <MealDetail
              meal={active}
              profile={profile}
              overrides={overrides}
              swap={swap}
              eaten={Boolean(done[active.name])}
              onToggle={() => toggle(active.name)}
            />
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
