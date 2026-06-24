"use client";

import { useSyncExternalStore } from "react";

import {
  addWeight,
  getHabitsServerSnapshot,
  getHabitsSnapshot,
  getStreakServerSnapshot,
  getStreakSnapshot,
  getWaterServerSnapshot,
  getWaterSnapshot,
  getWeightServerSnapshot,
  getWeightSnapshot,
  markDayComplete,
  setHabits,
  setWaterGlasses,
  subscribeTracking,
  type WeightEntry,
} from "@/lib/nutri-tracking";

export function useWater() {
  const glasses = useSyncExternalStore(
    subscribeTracking,
    getWaterSnapshot,
    getWaterServerSnapshot,
  );
  return {
    glasses,
    add: () => setWaterGlasses(getWaterSnapshot() + 1),
    remove: () => setWaterGlasses(getWaterSnapshot() - 1),
    set: setWaterGlasses,
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
