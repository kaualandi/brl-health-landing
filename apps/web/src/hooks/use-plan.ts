"use client";

import { useSyncExternalStore } from "react";

import {
  dismissUpgradeNudge,
  getPlanServerSnapshot,
  getPlanSnapshot,
  setPlanTier,
  subscribePlan,
  type PlanState,
  type PlanTier,
} from "@/lib/plan-store";

export type UsePlan = {
  /** undefined enquanto lê o localStorage. */
  state: PlanState | undefined;
  tier: PlanTier;
  isLoading: boolean;
  /** O nudge de upgrade do tier atual já foi dispensado? */
  nudgeDismissed: boolean;
  setTier: (tier: PlanTier) => void;
  dismissNudge: (tier: PlanTier) => void;
};

export function usePlan(): UsePlan {
  const state = useSyncExternalStore(
    subscribePlan,
    getPlanSnapshot,
    getPlanServerSnapshot,
  );

  const tier = state?.tier ?? "free";

  return {
    state,
    tier,
    isLoading: state === undefined,
    nudgeDismissed: Boolean(state?.dismissed.includes(tier)),
    setTier: setPlanTier,
    dismissNudge: dismissUpgradeNudge,
  };
}
