import { api } from "@/lib/axios";

export type FitStats = {
  weeks: { start: string; sessions: number; volume: number }[];
  streak: { current: number; best: number };
  totals: { sessions: number; volume: number; minutes: number };
  recordsBroken: number;
};

export type FitRecord = {
  exerciseId: string;
  name: string;
  maxWeightKg: number;
  maxWeightDate: string;
  maxSetVolumeKg: number;
  maxSetVolumeDate: string;
  e1rmKg: number | null;
  e1rmDate: string | null;
};

export type ExerciseHistory = {
  exerciseId: string;
  name: string;
  points: { date: string; maxWeightKg: number; e1rmKg: number | null }[];
};

export const getFitStats = () => api.get<FitStats>("/fit/stats").then((r) => r.data);
export const getFitRecords = () => api.get<FitRecord[]>("/fit/records").then((r) => r.data);
export const getExerciseHistory = (id: string) =>
  api.get<ExerciseHistory>(`/fit/exercises/${encodeURIComponent(id)}/history`).then((r) => r.data);
