import { api } from "@/lib/axios";

export type TodayEnergy = { date: string; workoutKcal: number; bonusKcal: number; sessions: number; locked?: boolean };

export async function getTodayEnergy(): Promise<TodayEnergy> {
  const { data } = await api.get<TodayEnergy>("/nutri/today-energy");
  return data;
}
