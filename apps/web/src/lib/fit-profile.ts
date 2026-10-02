import type { Goal } from "@/types";

export type FitGoal = "hypertrophy" | "strength" | "fatloss" | "health";
export type FitLevel = "beginner" | "intermediate" | "advanced";
export type FitLocation = "home" | "gym";
export type FitLimitation = "knee" | "shoulder" | "lower_back" | "wrist" | "hip" | "none";

/** Espelha o body/resposta de GET/PUT /fit/profile. */
export type FitProfile = {
  goal: FitGoal;
  level: FitLevel;
  daysPerWeek: number;
  location: FitLocation;
  equipment: string[];
  sessionMinutes: number;
  limitations: FitLimitation[];
};

/** Estado editável (campos de escolha começam vazios). */
export type FitForm = Omit<FitProfile, "goal" | "level" | "location"> & {
  goal: FitGoal | null;
  level: FitLevel | null;
  location: FitLocation | null;
};

export type FitOption<T extends string> = { value: T; label: string; description?: string; emoji: string };

export const FIT_GOALS: FitOption<FitGoal>[] = [
  { value: "hypertrophy", label: "Ganhar massa", description: "Hipertrofia: músculos maiores.", emoji: "💪" },
  { value: "strength", label: "Ficar mais forte", description: "Cargas maiores, poucas repetições.", emoji: "🏋️" },
  { value: "fatloss", label: "Perder gordura", description: "Gasto calórico e definição.", emoji: "🔥" },
  { value: "health", label: "Saúde e disposição", description: "Movimento regular e bem-estar.", emoji: "🌿" },
];

export const FIT_LEVELS: FitOption<FitLevel>[] = [
  { value: "beginner", label: "Iniciante", description: "Menos de 6 meses de treino regular.", emoji: "🌱" },
  { value: "intermediate", label: "Intermediário", description: "De 6 meses a 2 anos de treino.", emoji: "⚡" },
  { value: "advanced", label: "Avançado", description: "Mais de 2 anos, domina a técnica.", emoji: "🚀" },
];

export const FIT_LOCATIONS: FitOption<FitLocation>[] = [
  { value: "home", label: "Em casa", description: "Com o que você tiver por aí.", emoji: "🏠" },
  { value: "gym", label: "Academia", description: "Acesso a máquinas e pesos livres.", emoji: "🏢" },
];

/** Valor cru do ExerciseDB → rótulo PT (subconjunto exibido nos cards). */
export const FIT_EQUIPMENT_OPTIONS: FitOption<string>[] = [
  { value: "bodyweight", label: "Peso corporal", emoji: "🧍" },
  { value: "dumbbell", label: "Halteres", emoji: "🏋️" },
  { value: "barbell", label: "Barra", emoji: "➖" },
  { value: "olympic barbell", label: "Barra olímpica", emoji: "🏅" },
  { value: "EZ bar", label: "Barra W", emoji: "〰️" },
  { value: "trap bar", label: "Barra hexagonal", emoji: "⬡" },
  { value: "cable", label: "Cabo", emoji: "🔗" },
  { value: "leverage machine", label: "Máquina", emoji: "⚙️" },
  { value: "smith machine", label: "Smith", emoji: "🏗️" },
  { value: "kettlebell", label: "Kettlebell", emoji: "🔔" },
  { value: "resistance band", label: "Elástico", emoji: "🎗️" },
  { value: "suspension trainer", label: "Suspensão (TRX)", emoji: "⛓️" },
  { value: "stability ball", label: "Bola suíça", emoji: "🔵" },
  { value: "medicine ball", label: "Medicine ball", emoji: "🏀" },
  { value: "assisted", label: "Máquina assistida", emoji: "🤝" },
  { value: "stationary bike", label: "Bicicleta", emoji: "🚴" },
];

export const FIT_LIMITATION_OPTIONS: FitOption<FitLimitation>[] = [
  { value: "none", label: "Nenhuma", emoji: "✅" },
  { value: "knee", label: "Joelho", emoji: "🦵" },
  { value: "shoulder", label: "Ombro", emoji: "💪" },
  { value: "lower_back", label: "Lombar", emoji: "🧘" },
  { value: "wrist", label: "Punho", emoji: "🤲" },
  { value: "hip", label: "Quadril", emoji: "🦴" },
];

export const SESSION_MINUTES = [30, 45, 60, 75, 90];
export const DAYS_PER_WEEK = [2, 3, 4, 5, 6];

export const INITIAL_FIT_FORM: FitForm = {
  goal: null,
  level: null,
  daysPerWeek: 3,
  location: null,
  equipment: [],
  sessionMinutes: 60,
  limitations: [],
};

const NUTRI_TO_FIT_GOAL: Record<Goal, FitGoal> = {
  lose: "fatloss",
  gain: "hypertrophy",
  recomp: "hypertrophy",
  performance: "strength",
  health: "health",
};

export const fitGoalFromNutri = (goal: Goal): FitGoal => NUTRI_TO_FIT_GOAL[goal];

/** Equipamento sugerido ao escolher o local (só quando ainda não há seleção). */
export function defaultEquipment(location: FitLocation): string[] {
  return location === "home" ? ["bodyweight"] : ["barbell", "dumbbell", "cable", "leverage machine"];
}

/** Troca o local; ao mudar, reseta os equipamentos pro padrão do novo local. */
export function withLocation(f: FitForm, location: FitLocation): FitForm {
  return f.location === location ? f : { ...f, location, equipment: defaultEquipment(location) };
}

export function labelOf<T extends string>(options: FitOption<T>[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

/** Mensagem do 1º problema que impede avançar/salvar, ou null se válido. */
export function fitFormError(f: FitForm, step: "goal" | "level" | "location" | "all"): string | null {
  const need = (ok: boolean, msg: string) => (ok ? null : msg);
  const checks = {
    goal: () => need(f.goal !== null, "Escolha um objetivo."),
    level: () => need(f.level !== null, "Escolha seu nível."),
    location: () =>
      need(f.location !== null, "Escolha onde você treina.") ??
      need(f.equipment.length > 0, "Selecione ao menos um equipamento."),
  };
  if (step !== "all") return checks[step]();
  return checks.goal() ?? checks.level() ?? checks.location();
}

/** Garante que o form completo virou um FitProfile (null se faltar algo). */
export function toFitProfile(f: FitForm): FitProfile | null {
  if (fitFormError(f, "all") || !f.goal || !f.level || !f.location) return null;
  return { ...f, goal: f.goal, level: f.level, location: f.location };
}
