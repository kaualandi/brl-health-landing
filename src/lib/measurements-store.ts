/**
 * Medidas corporais (mock, localStorage). Histórico de circunferências pra
 * acompanhar a evolução além da balança. Persistente — não reseta por dia.
 * Mesmo padrão SSR-safe (useSyncExternalStore) dos outros stores, com snapshot
 * de array cacheado por conteúdo bruto pra manter referência estável.
 *
 * Registrar no mesmo dia faz upsert: mescla as medidas com as já guardadas
 * naquela data, em vez de criar uma entrada duplicada.
 */

const KEY = "brl.nutri.measurements";

export type MeasurementKey = "waist" | "hip" | "chest" | "arm" | "thigh";

/** Um registro: as medidas (em cm) tiradas numa data. */
export interface MeasurementEntry {
  /** YYYY-MM-DD */
  date: string;
  values: Partial<Record<MeasurementKey, number>>;
}

type Listener = () => void;
const listeners = new Set<Listener>();

const EMPTY: MeasurementEntry[] = [];
let cachedRaw: string | null | undefined;
let cachedList: MeasurementEntry[] = EMPTY;

function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function read(): MeasurementEntry[] {
  const raw = window.localStorage.getItem(KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      const value = raw ? (JSON.parse(raw) as MeasurementEntry[]) : EMPTY;
      cachedList = Array.isArray(value) ? value : EMPTY;
    } catch {
      cachedList = EMPTY;
    }
  }
  return cachedList;
}

function emit() {
  for (const listener of listeners) listener();
}

function write(list: MeasurementEntry[]) {
  const raw = JSON.stringify(list);
  window.localStorage.setItem(KEY, raw);
  cachedRaw = raw;
  cachedList = list;
  emit();
}

export function subscribeMeasurements(listener: Listener): () => void {
  listeners.add(listener);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", listener);
  }
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", listener);
    }
  };
}

export function getMeasurementsSnapshot(): MeasurementEntry[] {
  if (typeof window === "undefined") return EMPTY;
  return read();
}

export function getMeasurementsServerSnapshot(): MeasurementEntry[] {
  return EMPTY;
}

/** Registra (ou mescla) as medidas de hoje. */
export function recordMeasurements(
  values: Partial<Record<MeasurementKey, number>>,
): void {
  if (typeof window === "undefined") return;
  const date = dayKey(new Date());
  const current = read();
  const existing = current.find((e) => e.date === date);
  const merged: MeasurementEntry = {
    date,
    values: { ...(existing?.values ?? {}), ...values },
  };
  const next = [...current.filter((e) => e.date !== date), merged].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  write(next);
}
