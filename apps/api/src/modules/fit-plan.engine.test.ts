import { describe, expect, test } from "bun:test";
import { equipmentLabels } from "./exercises.labels";
import { exerciseCount, generatePlan, prescribe, type Candidate, type PlanProfile } from "./fit-plan.engine";
import { FIT_EQUIPMENT } from "./fit-profile";

const MUSCLES = ["pectorals", "deltoids", "triceps", "latissimus dorsi", "upper back", "biceps", "quadriceps", "hamstrings", "glutes", "calves", "abdominals", "trapezius"];
const EQUIP = ["bodyweight", "barbell", "dumbbell", "cable"];

const catalog: Candidate[] = MUSCLES.flatMap((m) =>
  EQUIP.flatMap((q) =>
    Array.from({ length: 6 }, (_, i) => ({
      id: `${m}-${q}-${i}`,
      name: `${q} ${m} move ${i}`,
      targetMuscles: [m],
      secondaryMuscles: Array.from({ length: i % 3 }, (_, k) => `s${k}`),
      equipments: [q],
    })),
  ),
);

const base: PlanProfile = {
  goal: "hypertrophy",
  level: "intermediate",
  daysPerWeek: 4,
  equipment: EQUIP,
  sessionMinutes: 60,
  limitations: [],
};
const all = (p: ReturnType<typeof generatePlan>) => p.days.flatMap((d) => d.exercises);
const byId = new Map(catalog.map((c) => [c.id, c]));

describe("fit-plan engine", () => {
  test("divisão por dias e nível", () => {
    const split = (daysPerWeek: number, level = "intermediate") => generatePlan({ ...base, daysPerWeek, level }, catalog, 1);
    expect(split(2).split).toBe("Full body A/B");
    expect(split(3, "beginner").split).toBe("Full body A/B/C");
    expect(split(3).split).toBe("Push/Pull/Legs");
    expect(split(4).split).toBe("Superior/Inferior ×2");
    expect(split(5).split).toBe("PPL + Superior/Inferior");
    expect(split(6).split).toBe("Push/Pull/Legs ×2");
    for (const d of [2, 3, 4, 5, 6]) expect(split(d).days).toHaveLength(d);
  });

  test("prescrição por objetivo e nível", () => {
    expect(prescribe("hypertrophy", "advanced")).toMatchObject({ sets: 4, repsMin: 8, repsMax: 12, restSeconds: 75 });
    expect(prescribe("strength", "advanced")).toMatchObject({ sets: 5, repsMin: 3, repsMax: 6, restSeconds: 150 });
    expect(prescribe("fatloss", "intermediate")).toMatchObject({ sets: 3, repsMin: 12, repsMax: 15, restSeconds: 45 });
    expect(prescribe("health", "intermediate")).toMatchObject({ sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60 });
    expect(prescribe("hypertrophy", "beginner").sets).toBe(3);
    expect(prescribe("fatloss", "beginner").sets).toBe(2);
    expect(prescribe("health", "beginner").sets).toBe(2);
    const plan = generatePlan({ ...base, goal: "strength", level: "beginner" }, catalog, 1);
    expect(all(plan).every((e) => e.sets === 4 && e.restSeconds === 150)).toBe(true);
  });

  test("duração define a quantidade de exercícios (3 a 8)", () => {
    expect([20, 30, 45, 60, 90, 120].map(exerciseCount)).toEqual([3, 3, 5, 7, 8, 8]);
    for (const m of [30, 60, 120]) {
      const plan = generatePlan({ ...base, sessionMinutes: m }, catalog, 1);
      expect(plan.days.every((d) => d.exercises.length === exerciseCount(m))).toBe(true);
    }
  });

  test("equipamento: só o que o perfil tem", () => {
    const plan = generatePlan({ ...base, equipment: ["bodyweight"], daysPerWeek: 6 }, catalog, 3);
    expect(all(plan).length).toBeGreaterThan(0);
    expect(all(plan).every((e) => byId.get(e.exerciseId)!.equipments.every((q) => q === "bodyweight"))).toBe(true);
  });

  test("sem repetir exercício na semana e ordem sequencial", () => {
    const plan = generatePlan({ ...base, daysPerWeek: 6 }, catalog, 9);
    const ids = all(plan).map((e) => e.exerciseId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const d of plan.days) expect(d.exercises.map((e) => e.order)).toEqual(d.exercises.map((_, i) => i + 1));
  });

  test("compostos primeiro", () => {
    const plan = generatePlan(base, catalog, 4);
    for (const d of plan.days) {
      const sec = d.exercises.map((e) => byId.get(e.exerciseId)!.secondaryMuscles.length);
      expect(sec).toEqual([...sec].sort((a, b) => b - a));
    }
  });

  test("limitações evitam exercícios por nome", () => {
    const named: Candidate[] = [
      ...catalog,
      ...["walking lunge", "jump squat", "deadlift", "overhead press", "handstand push-up", "push-up"].map((name, i) => ({
        id: `x${i}`,
        name,
        targetMuscles: ["quadriceps", "glutes", "hamstrings", "deltoids", "pectorals", "triceps", "erector spinae"],
        secondaryMuscles: ["a", "b", "c", "d"],
        equipments: ["bodyweight"],
      })),
    ];
    const risky = /lunge|jump|deadlift|overhead|handstand|push-up/;
    const plan = generatePlan({ ...base, daysPerWeek: 6, limitations: ["knee", "lower_back", "shoulder", "wrist"] }, named, 5);
    const names = all(plan).map((e) => named.find((c) => c.id === e.exerciseId)!.name);
    expect(names.some((n) => risky.test(n))).toBe(false);
  });

  test("punho: flexão só quando não há alternativa", () => {
    const onlyPushUp: Candidate[] = [{ id: "p", name: "push-up", targetMuscles: ["pectorals"], secondaryMuscles: [], equipments: ["bodyweight"] }];
    const profile = { ...base, equipment: ["bodyweight"], limitations: ["wrist"] };
    expect(all(generatePlan(profile, onlyPushUp, 1)).map((e) => e.exerciseId)).toContain("p");
    expect(all(generatePlan(profile, [...catalog, ...onlyPushUp], 1)).map((e) => e.exerciseId)).not.toContain("p");
  });

  test("determinístico por seed", () => {
    const a = generatePlan(base, catalog, 42);
    expect(generatePlan(base, catalog, 42)).toEqual(a);
    expect(generatePlan(base, catalog, 43)).not.toEqual(a);
  });
});

const mk = (name: string, target: string): Candidate => ({
  id: name, name, targetMuscles: [target], secondaryMuscles: ["a"], equipments: ["bodyweight"],
});
const names = (profile: PlanProfile, pool: Candidate[]) => all(generatePlan(profile, pool, 1)).map((e) => e.exerciseId);

describe("regras de nome", () => {
  const bw = { ...base, equipment: ["bodyweight"], daysPerWeek: 6 };

  test("levantamentos olímpicos só para intermediário+", () => {
    const pool = ["power clean", "snatch", "clean and jerk", "high pull"].map((n) => mk(n, "glutes")).concat(mk("hip raise", "glutes"));
    expect(names({ ...bw, level: "beginner" }, pool).filter((n) => n !== "hip raise")).toEqual([]);
    expect(names({ ...bw, level: "intermediate" }, pool)).toContain("power clean");
  });

  test("em casa, sem barra fixa/paralelas/argolas", () => {
    const pool = ["pull-up", "chin-up", "chest dip", "hanging leg raise", "rings row"].map((n) => mk(n, "latissimus dorsi")).concat(mk("pushdown", "latissimus dorsi"));
    const home = names({ ...bw, location: "home" }, pool);
    expect(home).toEqual(["pushdown"]);
    expect(names({ ...bw, location: "gym" }, pool).length).toBeGreaterThan(1);
  });

  test("joelho evita agachamento sobre os joelhos e lunge de deslizamento", () => {
    const pool = ["squat (on knees)", "platform slide lunge", "slide reverse step"].map((n) => mk(n, "quadriceps")).concat(mk("wall sit", "quadriceps"));
    expect(names({ ...bw, limitations: ["knee"] }, pool)).toEqual(["wall sit"]);
  });
});

describe("contrato de equipamento", () => {
  test("todo FIT_EQUIPMENT existe no dicionário do catálogo", () => {
    for (const e of FIT_EQUIPMENT) expect(equipmentLabels[e]).toBeDefined();
  });
});
