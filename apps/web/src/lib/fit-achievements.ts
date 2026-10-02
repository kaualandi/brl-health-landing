import type { FitStats } from "@/services/fit-stats.service";

export type FitAchievement = { id: string; title: string; description: string; emoji: string; unlocked: boolean; progress: number };

const ratio = (v: number, target: number) => Math.min(1, Math.max(0, v / target));
const make = (id: string, emoji: string, title: string, description: string, value: number, target: number): FitAchievement => ({
  id, emoji, title, description, unlocked: value >= target, progress: ratio(value, target),
});

/** Conquistas derivadas das estatísticas do servidor (volume total em kg). */
export function computeFitAchievements(s: FitStats): FitAchievement[] {
  const n = s.totals.sessions;
  return [
    make("first-workout", "💪", "Primeiro treino", "Conclua seu primeiro treino.", n, 1),
    make("workouts-5", "🏃", "5 treinos", "Conclua 5 treinos.", n, 5),
    make("workouts-25", "🏅", "25 treinos", "Conclua 25 treinos.", n, 25),
    make("workouts-100", "🏆", "100 treinos", "Conclua 100 treinos.", n, 100),
    make("streak-4", "🔥", "4 semanas seguidas", "Treine ao menos 1 vez por semana, 4 semanas em fila.", s.streak.best, 4),
    make("first-record", "📈", "Primeiro recorde", "Supere sua maior carga em um exercício.", s.recordsBroken, 1),
    make("volume-10t", "🏋️", "10 toneladas", "Some 10 t de volume levantado.", s.totals.volume, 10_000),
  ];
}

const key = (uid: string) => `brl.fit.achievements.${uid}`;

export function loadSeen(uid: string): string[] | null {
  try {
    const raw = window.localStorage.getItem(key(uid));
    return raw ? (JSON.parse(raw) as string[]) : null;
  } catch {
    return null;
  }
}

export const saveSeen = (uid: string, ids: string[]) => window.localStorage.setItem(key(uid), JSON.stringify(ids));

/** Exclusão de conta: apaga os ids de conquistas já celebradas deste usuário. */
export const clearFitAchievements = (uid: string) => window.localStorage.removeItem(key(uid));

/** Ids desbloqueados que o usuário ainda não viu (confete uma vez por conquista). */
export const newlyUnlocked = (list: FitAchievement[], seen: string[]) => list.filter((a) => a.unlocked && !seen.includes(a.id)).map((a) => a.id);
