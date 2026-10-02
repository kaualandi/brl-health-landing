import { describe, expect, test } from "bun:test";
import { alternativesFor } from "./fit-plan.swap";
import type { Candidate, PlanProfile } from "./fit-plan.engine";

const profile: PlanProfile = { goal: "health", level: "beginner", daysPerWeek: 3, location: "home", equipment: ["dumbbell", "bodyweight"], sessionMinutes: 45, limitations: ["knee"] };
const ex = (id: string, name: string, secondary: string[] = [], equipments = ["dumbbell"], target = "biceps"): Candidate => ({
  id, name, targetMuscles: [target], secondaryMuscles: secondary, equipments,
});
const current = ex("cur", "dumbbell curl", ["forearms", "deltoids"]);

describe("alternativesFor", () => {
  test("ordena por secundários em comum e exclui o do dia", () => {
    const list = [current, ex("a", "hammer curl"), ex("b", "incline curl", ["forearms"]), ex("c", "zottman curl", ["forearms", "deltoids"]), ex("inday", "preacher curl")];
    const r = alternativesFor(profile, current, list, new Set(["cur", "inday"]));
    expect(r.map((c) => c.id)).toEqual(["c", "b", "a"]);
  });

  test("exige mesmo músculo e equipamento do perfil", () => {
    const list = [ex("t", "tricep ext", [], ["dumbbell"], "triceps"), ex("bar", "barbell curl", [], ["barbell"]), ex("ok", "hammer curl")];
    expect(alternativesFor(profile, current, list, new Set(["cur"])).map((c) => c.id)).toEqual(["ok"]);
  });

  test("respeita limitação, nível e local", () => {
    const list = [
      ex("k", "jump curl"),
      ex("adv", "weighted curl"),
      ex("bar", "hanging curl", [], ["bodyweight"]),
      ex("ok", "hammer curl"),
    ];
    expect(alternativesFor(profile, current, list, new Set(["cur"])).map((c) => c.id)).toEqual(["ok"]);
  });

  test("limita a 8", () => {
    const list = Array.from({ length: 12 }, (_, i) => ex(`x${i}`, `curl v${i}`));
    expect(alternativesFor(profile, current, list, new Set(["cur"]))).toHaveLength(8);
  });

  test("padrão de movimento com músculo principal relacionado vem antes de só mesmo músculo", () => {
    const squat = ex("sq", "goblet squat", ["glutes"], ["dumbbell"], "quadriceps");
    const glute = ex("gl", "dumbbell sumo squat", [], ["dumbbell"], "glutes");
    const kick = ex("kick", "kick push-up", ["glutes", "hamstrings"], ["dumbbell"], "quadriceps");
    const other = ex("ot", "leg extension", ["glutes"], ["dumbbell"], "hamstrings");
    const cur = ex("cur2", "dumbbell squat", ["glutes", "hamstrings"], ["dumbbell"], "quadriceps");
    const r = alternativesFor(profile, cur, [cur, kick, glute, squat, other], new Set(["cur2"]));
    expect(r.map((c) => c.id)).toEqual(["sq", "gl", "kick"]);
  });

  test("sem padrão em comum, cai no mesmo músculo principal", () => {
    const cur = ex("cur3", "cable crunch", [], ["dumbbell"], "abdominals");
    const same = ex("s", "sit up", [], ["dumbbell"], "abdominals");
    const rel = ex("r", "dumbbell squat", [], ["dumbbell"], "quadriceps");
    expect(alternativesFor(profile, cur, [cur, same, rel], new Set(["cur3"])).map((c) => c.id)).toEqual(["s"]);
  });

  test("remove nomes repetidos", () => {
    const list = [ex("d1", "inverted curl"), ex("d2", "Inverted Curl"), ex("o", "hammer curl")];
    expect(alternativesFor(profile, current, list, new Set(["cur"])).map((c) => c.id)).toEqual(["d1", "o"]);
  });

  test("levantamento olímpico vai por último, salvo se o atual for olímpico", () => {
    const adv = { ...profile, level: "intermediate" };
    const list = [ex("ol", "dumbbell snatch", ["forearms", "deltoids"]), ex("n", "hammer curl")];
    expect(alternativesFor(adv, current, list, new Set(["cur"])).map((c) => c.id)).toEqual(["n", "ol"]);
    const cur = ex("cs", "dumbbell clean", ["forearms", "deltoids"]);
    expect(alternativesFor(adv, cur, [cur, ...list], new Set(["cs"])).map((c) => c.id)).toEqual(["ol", "n"]);
  });
});
