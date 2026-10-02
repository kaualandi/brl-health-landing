import type { FitPlan, FitPlanDay } from "@/lib/fit-plan";

export const FIT_TABS = ["hoje", "plano", "progresso", "biblioteca"] as const;
export type FitTab = (typeof FIT_TABS)[number];

/** Lê `?aba=`; qualquer valor desconhecido cai em "hoje". */
export function parseFitTab(value: string | null | undefined): FitTab {
  return FIT_TABS.find((t) => t === value) ?? "hoje";
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Dia da semana (0 = domingo) no fuso de São Paulo, como o today() da API. */
export function weekdayInSaoPaulo(date: Date = new Date()): number {
  const short = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "America/Sao_Paulo" }).format(date);
  return WEEKDAYS.indexOf(short);
}

const TRAINING_WEEKDAYS: Record<number, number[]> = {
  1: [1],
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 4, 5],
  6: [1, 2, 3, 4, 5, 6],
  7: [0, 1, 2, 3, 4, 5, 6],
};

/** Treino do dia da semana (0 = domingo) ou null = descanso; dias fixos por nº de treinos. */
export function workoutForWeekday(plan: FitPlan, weekday: number): FitPlanDay | null {
  const days = TRAINING_WEEKDAYS[Math.min(Math.max(plan.days.length, 1), 7)];
  const slot = days.indexOf(weekday);
  return slot === -1 ? null : (plan.days[slot] ?? null);
}

/** Tecla de navegação do tablist (APG) → índice da próxima aba; null = ignorar. */
export function nextTabIndex(key: string, current: number, count: number): number | null {
  if (key === "ArrowRight") return (current + 1) % count;
  if (key === "ArrowLeft") return (current - 1 + count) % count;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  return null;
}
