import type { FitForm } from "@/lib/fit-profile";

const KEY = "brl.fit.draft";

export type FitDraft = { userId: string; step: number; data: FitForm };

export function saveFitDraft(draft: FitDraft): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // storage indisponível: rascunho é só conveniência
  }
}

/** Só devolve o rascunho do próprio usuário (descarta o de outra conta). */
export function readFitDraft(userId: string): FitDraft | null {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? "null") as FitDraft | null;
    return parsed?.userId === userId && typeof parsed.step === "number" && parsed.data ? parsed : null;
  } catch {
    return null;
  }
}

export function clearFitDraft(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
