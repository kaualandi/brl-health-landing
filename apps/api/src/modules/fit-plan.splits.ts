export type DayKind = "full" | "push" | "pull" | "legs" | "upper" | "lower";
export type FitSplit = { name: string; kinds: DayKind[] };

const FULL = [
  ["quadriceps", "pectorals", "latissimus dorsi", "deltoids", "glutes", "abdominals", "triceps", "biceps"],
  ["glutes", "upper back", "pectorals", "hamstrings", "deltoids", "abdominals", "biceps", "triceps"],
  ["quadriceps", "latissimus dorsi", "deltoids", "pectorals", "hamstrings", "upper back", "abdominals", "glutes"],
];
const PUSH = ["pectorals", "deltoids", "pectorals", "triceps", "deltoids", "triceps", "pectorals", "deltoids"];
const PULL = ["latissimus dorsi", "upper back", "latissimus dorsi", "biceps", "upper back", "biceps", "trapezius", "latissimus dorsi"];
const LEGS = ["quadriceps", "hamstrings", "glutes", "calves", "quadriceps", "glutes", "abdominals", "hamstrings"];
const UPPER = ["pectorals", "latissimus dorsi", "deltoids", "upper back", "triceps", "biceps", "pectorals", "latissimus dorsi"];
const LOWER = ["quadriceps", "hamstrings", "glutes", "calves", "abdominals", "quadriceps", "glutes", "hamstrings"];

const rotate = <T>(list: T[], by: number) => list.map((_, i) => list[(i + by) % list.length]);

/** Músculos-alvo (ordem de prioridade) do dia; repetições do mesmo tipo rodam a lista. */
export function dayTargets(kind: DayKind, occurrence: number): string[] {
  if (kind === "full") return FULL[occurrence % FULL.length];
  const base = { push: PUSH, pull: PULL, legs: LEGS, upper: UPPER, lower: LOWER }[kind];
  return rotate(base, occurrence);
}

export const KIND_TITLE: Record<DayKind, string> = {
  full: "Corpo inteiro",
  push: "Empurrar (peito, ombros e tríceps)",
  pull: "Puxar (costas e bíceps)",
  legs: "Pernas e glúteos",
  upper: "Superior",
  lower: "Inferior",
};

const PPL: DayKind[] = ["push", "pull", "legs"];

export function chooseSplit(days: number, level: string): FitSplit {
  if (days <= 2) return { name: "Full body A/B", kinds: ["full", "full"] };
  if (days === 3) {
    return level === "beginner"
      ? { name: "Full body A/B/C", kinds: ["full", "full", "full"] }
      : { name: "Push/Pull/Legs", kinds: PPL };
  }
  if (days === 4) return { name: "Superior/Inferior ×2", kinds: ["upper", "lower", "upper", "lower"] };
  if (days === 5) return { name: "PPL + Superior/Inferior", kinds: [...PPL, "upper", "lower"] };
  return { name: "Push/Pull/Legs ×2", kinds: [...PPL, ...PPL] };
}
