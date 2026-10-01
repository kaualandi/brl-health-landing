import type { DailyRoutine, MealEntry, MealSlice } from "@/types";

/** Refeições que o usuário pode escolher, com horário e peso calórico padrão. */
export type MealOption = {
  name: string;
  emoji: string;
  defaultTime: string;
  /** Peso relativo na distribuição de calorias do dia. */
  weight: number;
};

export const MEAL_OPTIONS: MealOption[] = [
  { name: "Café da manhã", emoji: "☕", defaultTime: "07:00", weight: 1.0 },
  { name: "Lanche da manhã", emoji: "🍌", defaultTime: "10:00", weight: 0.5 },
  { name: "Almoço", emoji: "🍽️", defaultTime: "12:30", weight: 1.3 },
  { name: "Lanche da tarde", emoji: "🥪", defaultTime: "16:00", weight: 0.5 },
  { name: "Pré-treino", emoji: "⚡", defaultTime: "17:30", weight: 0.4 },
  { name: "Pós-treino", emoji: "💪", defaultTime: "19:00", weight: 0.6 },
  { name: "Jantar", emoji: "🌙", defaultTime: "20:30", weight: 1.2 },
  { name: "Ceia", emoji: "🍵", defaultTime: "22:30", weight: 0.4 },
];

const WEIGHT_BY_NAME = new Map(MEAL_OPTIONS.map((m) => [m.name, m.weight]));

/** Seleção padrão (4 refeições) pra quem começa. */
export function defaultSchedule(): MealEntry[] {
  return ["Café da manhã", "Almoço", "Lanche da tarde", "Jantar"].map((name) => ({
    name,
    time: MEAL_OPTIONS.find((m) => m.name === name)!.defaultTime,
  }));
}

/** Rotina padrão — acorda 7h, dorme 23h, sem treino fixo. */
export function defaultRoutine(): DailyRoutine {
  return { wakeTime: "07:00", sleepTime: "23:00", trainTime: "" };
}

/** Refeições que dependem de um horário de treino pra fazer sentido. */
const TRAINING_MEALS = new Set(["Pré-treino", "Pós-treino"]);

/** Estas refeições precisam de horário de treino pra serem encaixadas? */
export function needsTrainTime(meals: MealEntry[]): boolean {
  return meals.some((m) => TRAINING_MEALS.has(m.name));
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function toClock(minutes: number): string {
  const wrapped = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const round5 = (n: number) => Math.round(n / 5) * 5;

/**
 * Distribui os horários das refeições escolhidas a partir da rotina do usuário.
 * O café gruda no acordar, jantar/ceia perto de dormir, pré/pós-treino ao redor
 * do treino e os lanches caem no meio. Mantém o horário atual de refeições sem
 * âncora (ex.: pré-treino quando não há horário de treino informado).
 */
export function autoScheduleMeals(
  meals: MealEntry[],
  routine: DailyRoutine,
): MealEntry[] {
  const wake = toMinutes(routine.wakeTime);
  let sleep = toMinutes(routine.sleepTime);
  if (sleep <= wake) sleep += 24 * 60; // dorme depois da meia-noite
  const span = sleep - wake;

  const cafe = wake + 30;
  const almoco = wake + Math.round(span * 0.34);
  const jantar = sleep - 150;
  const ceia = sleep - 45;

  let train: number | null = null;
  if (routine.trainTime) {
    train = toMinutes(routine.trainTime);
    if (train < wake) train += 24 * 60; // treino noturno
  }

  const anchorByName: Record<string, number> = {
    "Café da manhã": cafe,
    "Lanche da manhã": Math.round((cafe + almoco) / 2),
    Almoço: almoco,
    "Lanche da tarde": Math.round((almoco + jantar) / 2),
    Jantar: jantar,
    Ceia: ceia,
  };

  const lo = wake + 10;
  const hi = sleep - 10;

  return meals.map((meal) => {
    let target: number | undefined;
    if (meal.name === "Pré-treino") {
      target = train != null ? train - 60 : undefined;
    } else if (meal.name === "Pós-treino") {
      target = train != null ? train + 45 : undefined;
    } else {
      target = anchorByName[meal.name];
    }
    if (target == null) return meal; // sem âncora → preserva o horário atual
    const clamped = Math.min(Math.max(target, lo), hi);
    return { ...meal, time: toClock(round5(clamped)) };
  });
}

/**
 * Distribui as calorias do dia entre as refeições escolhidas (por peso),
 * ordenadas por horário. Cada fatia carrega o horário.
 */
export function buildScheduledMeals(
  schedule: MealEntry[],
  targetCalories: number,
): MealSlice[] {
  const ordered = [...schedule].sort((a, b) => a.time.localeCompare(b.time));
  const totalWeight =
    ordered.reduce((sum, m) => sum + (WEIGHT_BY_NAME.get(m.name) ?? 1), 0) || 1;

  return ordered.map((meal) => {
    const weight = WEIGHT_BY_NAME.get(meal.name) ?? 1;
    return {
      name: meal.name,
      time: meal.time,
      kcal: Math.round((targetCalories * weight) / totalWeight / 5) * 5,
    };
  });
}
