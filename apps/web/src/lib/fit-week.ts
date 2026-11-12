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

export type UpcomingDay = { offset: number; weekday: number; date: number; day: FitPlanDay | null };

const dayOfMonth = new Intl.DateTimeFormat("en-US", { day: "numeric", timeZone: "America/Sao_Paulo" });

/** Hoje (offset 0) e os próximos dias no fuso de São Paulo, com o treino de cada um (null = descanso). */
export function upcomingDays(plan: FitPlan, now: Date, count = 7): UpcomingDay[] {
  return Array.from({ length: count }, (_, offset) => {
    const at = new Date(now.getTime() + offset * 86_400_000);
    const weekday = weekdayInSaoPaulo(at);
    return { offset, weekday, date: Number(dayOfMonth.format(at)), day: workoutForWeekday(plan, weekday) };
  });
}

/** "Treino A — Empurrar…" → "A". */
export const workoutLetter = (d: FitPlanDay) => d.name.split(" — ")[0].replace(/^Treino\s+/, "");

export type YearMonth = { year: number; month: number };
export type MonthCell = { date: number; day: FitPlanDay | null; past: boolean; today: boolean };

/** Ano, mês (0–11) e dia de "hoje" em São Paulo. */
export function todayInSaoPaulo(now: Date = new Date()) {
  const [year, month, date] = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(now).split("-").map(Number);
  return { year, month: month - 1, date };
}

export const shiftMonth = ({ year, month }: YearMonth, by: number): YearMonth => {
  const m = month + by;
  return { year: year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
};

/** Grade do mês com semanas começando no domingo; null = célula vazia antes do dia 1. */
export function monthGrid(plan: FitPlan, { year, month }: YearMonth, today = todayInSaoPaulo()): (MonthCell | null)[] {
  const lead = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const length = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const key = (y: number, m: number, d: number) => y * 10_000 + m * 100 + d;
  const now = key(today.year, today.month, today.date);
  const cells = Array.from({ length }, (_, i) => {
    const date = i + 1;
    const at = key(year, month, date);
    return { date, day: workoutForWeekday(plan, (lead + i) % 7), past: at < now, today: at === now };
  });
  return [...Array<null>(lead).fill(null), ...cells];
}

/** Tecla de navegação do tablist (APG) → índice da próxima aba; null = ignorar. */
export function nextTabIndex(key: string, current: number, count: number): number | null {
  if (key === "ArrowRight") return (current + 1) % count;
  if (key === "ArrowLeft") return (current - 1 + count) % count;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  return null;
}
