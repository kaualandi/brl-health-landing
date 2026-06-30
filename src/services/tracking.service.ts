import { api } from "@/lib/axios";
import { hydrateSleep, hydrateSteps } from "@/lib/health-store";
import {
  hydrateMeasurements,
  type MeasurementEntry,
  type MeasurementKey,
} from "@/lib/measurements-store";
import {
  hydrateHabits,
  hydrateMeals,
  hydrateWater,
  hydrateWeights,
} from "@/lib/nutri-tracking";
import type { User } from "@/types";

/* Shapes dos GETs de tracking (ver backend TrackingEndpoints/Repository). */
type WaterRes = { ml: number };
type WeightRes = { date: string; kg: number };
type SleepRes = { date: string; hours: number };
type StepRes = { date: string; count: number };
type MeasurementRes = {
  date: string;
  waist: number | null;
  hip: number | null;
  chest: number | null;
  arm: number | null;
  thigh: number | null;
};
type DayMap = Record<string, boolean>;

const MEASUREMENT_KEYS: MeasurementKey[] = [
  "waist",
  "hip",
  "chest",
  "arm",
  "thigh",
];

/** Flat {date, waist, hip, ...} do servidor → {date, values:{...}} do front (sem nulls). */
function toMeasurementEntry(row: MeasurementRes): MeasurementEntry {
  const values: Partial<Record<MeasurementKey, number>> = {};
  for (const key of MEASUREMENT_KEYS) {
    const v = row[key];
    if (typeof v === "number") values[key] = v;
  }
  return { date: row.date, values };
}

let hydratedUserId: string | null = null;
let hydrating: Promise<void> | null = null;

async function fetchAll(): Promise<void> {
  const [water, weight, sleep, steps, measurements, habits, diary] =
    await Promise.allSettled([
      api.get<WaterRes>("/nutri/water"),
      api.get<WeightRes[]>("/nutri/weight"),
      api.get<SleepRes[]>("/nutri/sleep"),
      api.get<StepRes[]>("/nutri/steps"),
      api.get<MeasurementRes[]>("/nutri/measurements"),
      api.get<DayMap>("/nutri/habits"),
      api.get<DayMap>("/nutri/diary"),
    ]);

  if (water.status === "fulfilled") hydrateWater(water.value.data.ml);
  if (weight.status === "fulfilled") hydrateWeights(weight.value.data);
  if (sleep.status === "fulfilled") hydrateSleep(sleep.value.data);
  if (steps.status === "fulfilled") hydrateSteps(steps.value.data);
  if (measurements.status === "fulfilled") {
    hydrateMeasurements(measurements.value.data.map(toMeasurementEntry));
  }
  if (habits.status === "fulfilled") hydrateHabits(habits.value.data ?? {});
  if (diary.status === "fulfilled") hydrateMeals(diary.value.data ?? {});
}

/** Carrega todo o tracking do servidor (uma vez por usuário/sessão). */
export function ensureTrackingHydrated(user: User): Promise<void> {
  if (hydratedUserId === user.id) return Promise.resolve();
  if (hydrating) return hydrating;
  hydrating = fetchAll().finally(() => {
    hydratedUserId = user.id;
    hydrating = null;
  });
  return hydrating;
}

/** Limpa o tracking em cache e zera a hidratação (logout). */
export function resetTracking(): void {
  hydratedUserId = null;
  hydrating = null;
  hydrateWater(0);
  hydrateWeights([]);
  hydrateSleep([]);
  hydrateSteps([]);
  hydrateMeasurements([]);
  hydrateHabits({});
  hydrateMeals({});
}
