import type { PlanId } from "@/types";

/**
 * Tier de assinatura do usuário no client (mock). Tudo começa em `free`.
 * Guarda também quais nudges de upgrade já foram dispensados — pra não
 * ficar empurrando o mesmo plano e parecer chato.
 *
 * Mesmo padrão SSR-safe (useSyncExternalStore) dos outros stores.
 */

export type PlanTier = PlanId; // "free" | "pro" | "family"

const TIER_KEY = "brl.plan.tier";
const DISMISS_KEY = "brl.plan.nudgeDismissed";

export type PlanState = { tier: PlanTier; dismissed: PlanTier[] };

type Listener = () => void;
const listeners = new Set<Listener>();

let cachedTierRaw: string | null | undefined;
let cachedDismissRaw: string | null | undefined;
let cachedState: PlanState = { tier: "free", dismissed: [] };

function parseDismissed(raw: string | null): PlanTier[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? (value as PlanTier[]) : [];
  } catch {
    return [];
  }
}

function readSnapshot(): PlanState {
  const tierRaw = window.localStorage.getItem(TIER_KEY);
  const dismissRaw = window.localStorage.getItem(DISMISS_KEY);

  if (tierRaw !== cachedTierRaw || dismissRaw !== cachedDismissRaw) {
    cachedTierRaw = tierRaw;
    cachedDismissRaw = dismissRaw;
    cachedState = {
      tier: (tierRaw as PlanTier | null) ?? "free",
      dismissed: parseDismissed(dismissRaw),
    };
  }
  return cachedState;
}

function emit() {
  for (const listener of listeners) listener();
}

export function subscribePlan(listener: Listener): () => void {
  listeners.add(listener);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", listener);
  }
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", listener);
    }
  };
}

export function getPlanSnapshot(): PlanState {
  if (typeof window === "undefined") return cachedState;
  return readSnapshot();
}

/** undefined = ainda lendo (servidor / primeiro paint). */
export function getPlanServerSnapshot(): PlanState | undefined {
  return undefined;
}

export function setPlanTier(tier: PlanTier): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TIER_KEY, tier);
  cachedTierRaw = tier;
  cachedState = { ...readSnapshot(), tier };
  emit();
  // TODO: na fase de backend, o tier vem da assinatura real (Stripe).
}

export function dismissUpgradeNudge(tier: PlanTier): void {
  if (typeof window === "undefined") return;
  const current = readSnapshot().dismissed;
  if (current.includes(tier)) return;
  const next = [...current, tier];
  const raw = JSON.stringify(next);
  window.localStorage.setItem(DISMISS_KEY, raw);
  cachedDismissRaw = raw;
  cachedState = { ...cachedState, dismissed: next };
  emit();
}
