/**
 * Rascunho do onboarding: persiste o progresso do wizard no localStorage pra
 * que um refresh retome de onde parou. É limpo ao concluir (clearOnboardingDraft).
 *
 * Mesmo espírito SSR-safe do calc-draft: tudo dentro de try/catch e no-op no
 * servidor — é conveniência, nunca quebra o fluxo se o storage falhar.
 */

import type {
  ActivityLevel,
  BiologicalSex,
  DietStyle,
  Goal,
  MealEntry,
  Restriction,
} from "@/types";

const KEY = "brl.onboarding.draft";

/** Estado serializável do wizard (mesmos campos editados passo a passo). */
export type WizardData = {
  name: string;
  email: string;
  password: string;
  sex: BiologicalSex | null;
  age: string;
  heightCm: string;
  weightKg: string;
  goalWeightKg: string;
  goal: Goal | null;
  activity: ActivityLevel | null;
  diet: DietStyle | null;
  restrictions: Restriction[];
  meals: MealEntry[];
  wakeTime: string;
  sleepTime: string;
  trainTime: string;
  waterGlasses: string;
};

export interface OnboardingDraft {
  /** Índice do passo atual (relativo aos passos visíveis). */
  step: number;
  data: WizardData;
}

export function saveOnboardingDraft(draft: OnboardingDraft): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // localStorage indisponível — segue o jogo, é só conveniência.
  }
}

export function readOnboardingDraft(): OnboardingDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OnboardingDraft;
    // Sanidade mínima: precisa de step numérico e data como objeto.
    if (
      typeof parsed?.step !== "number" ||
      typeof parsed?.data !== "object" ||
      parsed.data === null
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearOnboardingDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
