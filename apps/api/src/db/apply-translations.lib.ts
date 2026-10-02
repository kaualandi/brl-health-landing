export type Entry = { id: string; name: string; instructions: string[] };
export type Current = { instructions: string[]; namePt: string | null; instructionsPt: string[] | null };
export type Report = { applied: number; unchanged: number; invalid: number; unknown: number; mismatched: number };

const filled = (x: unknown) => typeof x === "string" && x.trim() !== "";
const isEntry = (x: any): x is Entry =>
  !!x && filled(x.id) && filled(x.name) && Array.isArray(x.instructions) && x.instructions.every(filled);

const same = (a: string[] | null, b: string[]) => a !== null && a.length === b.length && a.every((s, i) => s === b[i]);

/** Valida as entradas contra o banco; devolve updates e ids com passos PT obsoletos a limpar. */
export function planTranslations(raw: unknown, current: Map<string, Current>) {
  const report: Report = { applied: 0, unchanged: 0, invalid: 0, unknown: 0, mismatched: 0 };
  const updates: Entry[] = [];
  const clears: string[] = [];
  for (const item of Array.isArray(raw) ? raw : []) {
    if (!isEntry(item)) {
      report.invalid++;
      continue;
    }
    const cur = current.get(item.id);
    if (!cur) report.unknown++;
    else if (cur.instructions.length !== item.instructions.length) {
      report.mismatched++;
      if (cur.instructionsPt) clears.push(item.id);
    }
    else if (cur.namePt === item.name && same(cur.instructionsPt, item.instructions)) report.unchanged++;
    else updates.push(item);
  }
  report.applied = updates.length;
  return { updates, clears, report };
}

export const chunk = <T>(xs: T[], n: number) => Array.from({ length: Math.ceil(xs.length / n) }, (_, i) => xs.slice(i * n, i * n + n));
