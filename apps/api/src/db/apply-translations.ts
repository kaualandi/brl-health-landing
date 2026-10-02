import { eq, inArray } from "drizzle-orm";
import { db, schema } from ".";
import { chunk, planTranslations, type Current } from "./apply-translations.lib";

const { exercises } = schema;
const FILE = new URL("./data/exercises-pt.json", import.meta.url);

export async function applyTranslations(file: URL = FILE) {
  const raw = await Bun.file(file).json();
  const rows = await db
    .select({ id: exercises.id, instructions: exercises.instructions, namePt: exercises.namePt, instructionsPt: exercises.instructionsPt })
    .from(exercises);
  const current = new Map<string, Current>(rows.map((r) => [r.id, r]));
  const { updates, clears, report } = planTranslations(raw, current);
  for (const part of chunk(clears, 200)) await db.update(exercises).set({ instructionsPt: null }).where(inArray(exercises.id, part));
  for (const part of chunk(updates, 200)) {
    await db.transaction(async (tx) => {
      for (const u of part) await tx.update(exercises).set({ namePt: u.name, instructionsPt: u.instructions }).where(eq(exercises.id, u.id));
    });
  }
  console.log(
    `traduções: aplicadas ${report.applied}, inalteradas ${report.unchanged}, inválidas ${report.invalid}, ids desconhecidos ${report.unknown}, passos divergentes ${report.mismatched}`,
  );
  return report;
}

if (import.meta.main) {
  await applyTranslations();
  process.exit(0);
}
