"use client";

import { useSyncExternalStore } from "react";

import {
  addWeight,
  getHabitsServerSnapshot,
  getHabitsSnapshot,
  getMealsServerSnapshot,
  getMealsSnapshot,
  getStreakServerSnapshot,
  getStreakSnapshot,
  getWaterServerSnapshot,
  getWaterSnapshot,
  getWeightServerSnapshot,
  getWeightSnapshot,
  markDayComplete,
  setHabits,
  setMeals,
  setWaterMl,
  subscribeTracking,
  type WeightEntry,
} from "@/lib/nutri-tracking";

export function useWater() {
  const ml = useSyncExternalStore(
    subscribeTracking,
    getWaterSnapshot,
    getWaterServerSnapshot,
  );
  return {
    ml,
    add: (amount: number) => setWaterMl(getWaterSnapshot() + amount),
    remove: (amount: number) => setWaterMl(getWaterSnapshot() - amount),
    set: setWaterMl,
  };
}

export function useWeightLog() {
  const entries = useSyncExternalStore(
    subscribeTracking,
    getWeightSnapshot,
    getWeightServerSnapshot,
  );
  return { entries, add: addWeight };
}

export type { WeightEntry };

export function useHabits() {
  const done = useSyncExternalStore(
    subscribeTracking,
    getHabitsSnapshot,
    getHabitsServerSnapshot,
  );
  const streak = useSyncExternalStore(
    subscribeTracking,
    getStreakSnapshot,
    getStreakServerSnapshot,
  );
  return { done, streak, setHabits, markDayComplete };
}

export function useMeals() {
  const done = useSyncExternalStore(
    subscribeTracking,
    getMealsSnapshot,
    getMealsServerSnapshot,
  );
  return {
    done,
    toggle: (name: string) =>
      setMeals({ ...getMealsSnapshot(), [name]: !getMealsSnapshot()[name] }),
  };
}
