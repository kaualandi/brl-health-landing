import type { MeasurementEntry, MeasurementKey } from "@/lib/measurements-store";

/** Definição de cada medida — rótulo, emoji e faixa válida (cm). */
export interface MeasurementDef {
  key: MeasurementKey;
  label: string;
  emoji: string;
  min: number;
  max: number;
}

export const MEASUREMENTS: MeasurementDef[] = [
  { key: "waist", label: "Cintura", emoji: "📏", min: 40, max: 200 },
  { key: "hip", label: "Quadril", emoji: "🍑", min: 40, max: 200 },
  { key: "chest", label: "Peito", emoji: "👕", min: 40, max: 200 },
  { key: "arm", label: "Braço", emoji: "💪", min: 15, max: 80 },
  { key: "thigh", label: "Coxa", emoji: "🦵", min: 30, max: 120 },
];

/** Série temporal de uma medida (só as datas em que ela foi registrada). */
export function seriesFor(
  entries: MeasurementEntry[],
  key: MeasurementKey,
): { date: string; value: number }[] {
  const out: { date: string; value: number }[] = [];
  for (const entry of entries) {
    const value = entry.values[key];
    if (typeof value === "number") out.push({ date: entry.date, value });
  }
  return out;
}

/** Último valor registrado de uma medida (undefined se nunca registrou). */
export function latestFor(
  entries: MeasurementEntry[],
  key: MeasurementKey,
): number | undefined {
  const series = seriesFor(entries, key);
  return series.length ? series[series.length - 1].value : undefined;
}
