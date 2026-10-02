/** Espelha GET /fit/progression. */
export type ProgressionReason = "up" | "hold" | "down" | "deload" | "new";
export type ProgressionItem = { weightKg: number | null; reps: number; sets: number; reason: ProgressionReason };
export type Progression = { deload: boolean; week: number; exercises: Record<string, ProgressionItem> };

const kg = (n: number) => `${n.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg`;

/** Texto "na próxima" por exercício; null quando ainda não há histórico. */
export function nextLabel(s: ProgressionItem | undefined): string | null {
  if (!s || s.reason === "new") return null;
  if (s.reason === "deload") return `Deload: ${s.weightKg === null ? `${s.reps} reps` : `${kg(s.weightKg)} × ${s.reps}`} · ${s.sets} ${s.sets === 1 ? "série" : "séries"}`;
  if (s.weightKg === null) return s.reason === "up" ? `Próxima: +1 rep (${s.reps})` : `Próxima: ${s.reps} reps`;
  return `Próxima: ${kg(s.weightKg)} × ${s.reps}`;
}
