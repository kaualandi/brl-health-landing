import { ADVANCED_ONLY, avoidLevel, NEEDS_BAR, NOT_STRENGTH, OLYMPIC, PATTERN_CAP, PATTERNS, patternsOf } from "./fit-plan.rules";
import { chooseSplit, dayTargets, KIND_TITLE, type DayKind } from "./fit-plan.splits";

export type PlanProfile = {
  goal: string;
  level: string;
  daysPerWeek: number;
  location?: string;
  equipment: string[];
  sessionMinutes: number;
  limitations: string[];
};
export type Candidate = {
  id: string;
  name: string;
  targetMuscles: string[];
  secondaryMuscles: string[];
  equipments: string[];
};
export type PlanExercise = { order: number; exerciseId: string; sets: number; repsMin: number; repsMax: number; restSeconds: number };
export type PlanDay = { index: number; name: string; focus: string[]; exercises: PlanExercise[] };
export type GeneratedPlan = { split: string; days: PlanDay[] };

type Rx = { sets: number; repsMin: number; repsMax: number; restSeconds: number };
const RX: Record<string, Rx> = {
  hypertrophy: { sets: 4, repsMin: 8, repsMax: 12, restSeconds: 75 },
  strength: { sets: 5, repsMin: 3, repsMax: 6, restSeconds: 150 },
  fatloss: { sets: 3, repsMin: 12, repsMax: 15, restSeconds: 45 },
  health: { sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60 },
};

/** Prescrição por objetivo; iniciante perde 1 série (mínimo 2). */
export const prescribe = (goal: string, level: string): Rx => {
  const rx = RX[goal] ?? RX.health;
  return level === "beginner" ? { ...rx, sets: Math.max(2, rx.sets - 1) } : rx;
};

/** ~1 exercício a cada 9 min, entre 3 e 8. */
export const exerciseCount = (minutes: number) => Math.min(8, Math.max(3, Math.round(minutes / 9)));

/** PRNG determinístico (mulberry32). */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TOP = 6;
const GROUP_ORDER = (a: Candidate, b: Candidate) =>
  b.secondaryMuscles.length - a.secondaryMuscles.length || a.id.localeCompare(b.id);

type DayState = { count: number[]; ids: Set<string> };
// [soft permitido, cap de padrão aplicado, repetir exercício de outro dia]
const RELAX: [boolean, boolean, boolean][] = [[false, true, false], [true, true, false], [true, true, true], [true, false, true]];

function pool(ctx: Ctx, muscle: string, day: DayState, [soft, capped, reuse]: [boolean, boolean, boolean]) {
  return ctx.usable.filter((c) => {
    if (capped && patternsOf(c.name).some((i) => day.count[i] >= PATTERN_CAP)) return false;
    const seen = reuse ? day.ids : ctx.used;
    if (seen.has(c.id) || seen.has(c.name.toLowerCase()) || !c.targetMuscles.includes(muscle)) return false;
    const level = avoidLevel(c.name, ctx.limitations);
    return level === "ok" || (soft && level === "soft");
  });
}

function pick(muscles: string[], ctx: Ctx, day: DayState) {
  for (const relax of RELAX) {
    for (const m of muscles) {
      const options = pool(ctx, m, day, relax).sort(GROUP_ORDER).slice(0, TOP);
      if (options.length) return options[Math.floor(ctx.rand() * options.length)];
    }
  }
  return undefined;
}

type Ctx = { usable: Candidate[]; used: Set<string>; limitations: string[]; rand: () => number; count: number; rx: Rx };

function buildDay(ctx: Ctx, kind: DayKind, occurrence: number, index: number): PlanDay {
  const targets = dayTargets(kind, occurrence);
  const picked: Candidate[] = [];
  const day: DayState = { count: Array<number>(PATTERNS.length).fill(0), ids: new Set() };
  for (let i = 0; i < ctx.count; i++) {
    const order = [...targets.slice(i % targets.length), ...targets.slice(0, i % targets.length)];
    const found = pick(order, ctx, day);
    if (!found) break;
    for (const set of [ctx.used, day.ids]) set.add(found.id).add(found.name.toLowerCase());
    picked.push(found);
    for (const i of patternsOf(found.name)) day.count[i]++;
  }
  picked.sort((a, b) => b.secondaryMuscles.length - a.secondaryMuscles.length);
  return {
    index,
    name: `Treino ${String.fromCharCode(65 + index)} — ${KIND_TITLE[kind]}`,
    focus: [...new Set(targets)],
    exercises: picked.map((c, o) => ({ order: o + 1, exerciseId: c.id, ...ctx.rx })),
  };
}

export const isUsable = (c: Candidate, p: PlanProfile, have: Set<string>) =>
  c.equipments.length > 0 &&
  c.equipments.every((e) => have.has(e)) &&
  !NOT_STRENGTH.test(c.name) &&
  (p.level === "advanced" || !ADVANCED_ONLY.test(c.name)) &&
  (p.level !== "beginner" || !OLYMPIC.test(c.name)) &&
  (p.location === "gym" || !NEEDS_BAR.test(c.name));

/** Gera a semana. Puro: mesmo perfil + candidatos + seed => mesmo plano. */
export function generatePlan(profile: PlanProfile, candidates: Candidate[], seed: number): GeneratedPlan {
  const have = new Set(profile.equipment);
  const usable = candidates.filter((c) => isUsable(c, profile, have)).sort((a, b) => a.id.localeCompare(b.id));
  const split = chooseSplit(profile.daysPerWeek, profile.level);
  const ctx: Ctx = {
    usable,
    used: new Set(),
    limitations: profile.limitations,
    rand: rng(seed),
    count: exerciseCount(profile.sessionMinutes),
    rx: prescribe(profile.goal, profile.level),
  };
  const seen: Partial<Record<DayKind, number>> = {};
  const days = split.kinds.map((kind, index) => buildDay(ctx, kind, (seen[kind] = (seen[kind] ?? -1) + 1), index));
  return { split: split.name, days };
}
