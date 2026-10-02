import { avoidLevel, OLYMPIC, patternsOf } from "./fit-plan.rules";
import { isUsable, type Candidate, type PlanProfile } from "./fit-plan.engine";

export const MAX_ALTERNATIVES = 8;

const shared = <A>(a: A[], b: A[]) => a.filter((x) => b.includes(x)).length;

/** Troca válida: mesmo padrão de movimento (músculo principal relacionado) ou mesmo músculo principal; regras do motor; fora do dia. */
export function alternativesFor<T extends Candidate>(profile: PlanProfile, current: Candidate, candidates: T[], dayIds: Set<string>): T[] {
  const have = new Set(profile.equipment);
  const [main] = current.targetMuscles;
  const related = [...current.targetMuscles, ...current.secondaryMuscles];
  const patterns = patternsOf(current.name);
  const dayNames = new Set(candidates.filter((c) => dayIds.has(c.id)).map((c) => c.name.toLowerCase()));
  const oly = (c: Candidate) => (OLYMPIC.test(c.name) && !OLYMPIC.test(current.name) ? 1 : 0);
  const sim = (c: T) => ({
    pat: shared(patternsOf(c.name), patterns),
    same: c.targetMuscles.includes(main) ? 1 : 0,
    sec: shared(c.secondaryMuscles, current.secondaryMuscles),
  });
  return candidates
    .filter(
      (c) =>
        !dayIds.has(c.id) &&
        !dayNames.has(c.name.toLowerCase()) &&
        (c.targetMuscles.includes(main) || (sim(c).pat > 0 && related.includes(c.targetMuscles[0]))) &&
        isUsable(c, profile, have) &&
        avoidLevel(c.name, profile.limitations) !== "hard",
    )
    .sort((a, b) => {
      const [x, y] = [sim(a), sim(b)];
      return oly(a) - oly(b) || y.pat - x.pat || y.same - x.same || y.sec - x.sec || a.id.localeCompare(b.id);
    })
    .filter((c, i, all) => all.findIndex((o) => o.name.toLowerCase() === c.name.toLowerCase()) === i)
    .slice(0, MAX_ALTERNATIVES);
}
