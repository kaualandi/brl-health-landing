/**
 * Ponte da calculadora pública pro onboarding: guarda as respostas num rascunho
 * de sessão pra pré-preencher o /cadastro, evitando redigitar tudo.
 *
 * Usa sessionStorage (e não query string) porque são dados pessoais — não devem
 * ir pra URL. Some sozinho ao fechar a aba; refazer a calculadora sobrescreve.
 */

import type { ActivityLevel, BiologicalSex, Goal } from "@/types";

const KEY = "brl.calc.draft";

export interface CalcDraft {
  sex: BiologicalSex;
  /** strings, no mesmo formato dos campos do wizard. */
  age: string;
  heightCm: string;
  weightKg: string;
  activity: ActivityLevel;
  goal: Goal;
}

export function saveCalcDraft(draft: CalcDraft): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // sessionStorage indisponível — segue o jogo, é só conveniência.
  }
}

export function readCalcDraft(): CalcDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CalcDraft) : null;
  } catch {
    return null;
  }
}

export function clearCalcDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
