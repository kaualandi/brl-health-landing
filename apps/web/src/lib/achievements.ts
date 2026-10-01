/**
 * Conquistas (gamificação) — derivadas dos stores de tracking existentes.
 * Funções puras: recebem um retrato dos stores e devolvem a lista de
 * conquistas com `unlocked` e `progress` (0..1). A reatividade fica no
 * componente, que assina os stores e chama `computeAchievements`.
 */

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  /** Conquista batida. */
  unlocked: boolean;
  /** Progresso de 0 a 1 (clampado). */
  progress: number;
}

/** Retrato dos stores no momento, pra calcular as conquistas. */
export interface AchievementsInput {
  /** Pesagens registradas (histórico de peso). */
  weightCount: number;
  /** Registros de medidas corporais. */
  measurementCount: number;
  /** Água de hoje, em ml. */
  waterMl: number;
  /** Meta de água do plano, em ml. */
  waterGoalMl: number;
  /** Hábitos marcados hoje. */
  habitsDone: number;
  /** Total de hábitos do dia. */
  habitsTotal: number;
  /** Streak atual de dias completos. */
  streak: number;
  /** Itens salvos nos favoritos. */
  favoritesCount: number;
}

const STREAK_TARGET = 7;

/** 0..1 com proteção contra divisão por zero. */
function ratio(value: number, target: number): number {
  if (target <= 0) return value > 0 ? 1 : 0;
  return Math.min(1, Math.max(0, value / target));
}

export function computeAchievements(input: AchievementsInput): Achievement[] {
  const waterProgress = ratio(input.waterMl, input.waterGoalMl);
  const habitsProgress = ratio(input.habitsDone, input.habitsTotal);
  const streakProgress = ratio(input.streak, STREAK_TARGET);

  return [
    {
      id: "first-weigh-in",
      title: "Primeira pesagem",
      description: "Registre seu peso pela primeira vez.",
      emoji: "⚖️",
      unlocked: input.weightCount >= 1,
      progress: input.weightCount >= 1 ? 1 : 0,
    },
    {
      id: "first-measurement",
      title: "Primeira medida",
      description: "Anote uma medida corporal pra acompanhar além da balança.",
      emoji: "📏",
      unlocked: input.measurementCount >= 1,
      progress: input.measurementCount >= 1 ? 1 : 0,
    },
    {
      id: "hydrated",
      title: "Hidratação em dia",
      description: "Bata sua meta de água de hoje.",
      emoji: "💧",
      unlocked: waterProgress >= 1,
      progress: waterProgress,
    },
    {
      id: "habits-day",
      title: "Semana de hábitos",
      description: "Complete todos os hábitos do dia.",
      emoji: "✅",
      unlocked: input.habitsTotal > 0 && habitsProgress >= 1,
      progress: habitsProgress,
    },
    {
      id: "streak-7",
      title: "7 dias de streak",
      description: "Mantenha a chama acesa por uma semana seguida.",
      emoji: "🔥",
      unlocked: input.streak >= STREAK_TARGET,
      progress: streakProgress,
    },
    {
      id: "first-favorite",
      title: "Primeiro favorito",
      description: "Salve um conteúdo ou receita nos favoritos.",
      emoji: "🔖",
      unlocked: input.favoritesCount >= 1,
      progress: input.favoritesCount >= 1 ? 1 : 0,
    },
  ];
}
