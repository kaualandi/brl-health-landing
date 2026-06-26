"use client";

import { useSyncExternalStore } from "react";

import {
  addSteps,
  getSleepServerSnapshot,
  getSleepSnapshot,
  getStepsServerSnapshot,
  getStepsSnapshot,
  recordSleep,
  setSteps,
  subscribeHealth,
} from "@/lib/health-store";

export function useSleep() {
  const entries = useSyncExternalStore(
    subscribeHealth,
    getSleepSnapshot,
    getSleepServerSnapshot,
  );
  return { entries, record: recordSleep };
}

export function useSteps() {
  const entries = useSyncExternalStore(
    subscribeHealth,
    getStepsSnapshot,
    getStepsServerSnapshot,
  );
  return { entries, set: setSteps, add: addSteps };
}
