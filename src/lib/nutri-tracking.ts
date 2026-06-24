/**
 * Tracking diário do BRL Nutri (mock, localStorage): água, peso e hábitos.
 * Mesmo padrão SSR-safe (useSyncExternalStore) dos outros stores, com um
 * conjunto de listeners compartilhado. Snapshots primitivos (number) são
 * recalculados a cada leitura (Object.is evita re-render à toa); snapshots de
 * objeto/array são cacheados por conteúdo bruto pra manter a referência estável.
 *
 * O "reset diário" acontece na leitura: se a data guardada não é hoje, zera.
 */

const WATER_KEY = "brl.nutri.water";
const WEIGHT_KEY = "brl.nutri.weights";
const HABITS_KEY = "brl.nutri.habits";
const STREAK_KEY = "brl.nutri.streak";

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeTracking(listener: Listener): () => void {
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

/* --- datas (locais, não UTC) --- */

function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayKey(): string {
  return dayKey(new Date());
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dayKey(d);
}

/* ------------------------------------------------------------------ */
/* Água — copos de hoje (snapshot = number)                            */
/* ------------------------------------------------------------------ */

export function getWaterSnapshot(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(WATER_KEY);
    if (!raw) return 0;
    const value = JSON.parse(raw) as { date: string; glasses: number };
    return value.date === todayKey() ? Math.max(0, value.glasses ?? 0) : 0;
  } catch {
    return 0;
  }
}

export function getWaterServerSnapshot(): number {
  return 0;
}

export function setWaterGlasses(glasses: number): void {
  if (typeof window === "undefined") return;
  const next = Math.max(0, Math.round(glasses));
  window.localStorage.setItem(
    WATER_KEY,
    JSON.stringify({ date: todayKey(), glasses: next }),
  );
  emit();
}

/* ------------------------------------------------------------------ */
/* Peso — histórico (snapshot = array, cacheado)                       */
/* ------------------------------------------------------------------ */

export type WeightEntry = { date: string; kg: number };

const EMPTY_WEIGHTS: WeightEntry[] = [];
let weightRaw: string | null | undefined;
let weightSnap: WeightEntry[] = EMPTY_WEIGHTS;

function readWeights(): WeightEntry[] {
  const raw = window.localStorage.getItem(WEIGHT_KEY);
  if (raw !== weightRaw) {
    weightRaw = raw;
    try {
      weightSnap = raw ? (JSON.parse(raw) as WeightEntry[]) : EMPTY_WEIGHTS;
    } catch {
      weightSnap = EMPTY_WEIGHTS;
    }
  }
  return weightSnap;
}

export function getWeightSnapshot(): WeightEntry[] {
  if (typeof window === "undefined") return EMPTY_WEIGHTS;
  return readWeights();
}

export function getWeightServerSnapshot(): WeightEntry[] {
  return EMPTY_WEIGHTS;
}

/** Registra (ou substitui) o peso de hoje. */
export function addWeight(kg: number): void {
  if (typeof window === "undefined") return;
  const date = todayKey();
  const next = [...readWeights().filter((e) => e.date !== date), { date, kg }].sort(
    (a, b) => a.date.localeCompare(b.date),
  );
  const raw = JSON.stringify(next);
  window.localStorage.setItem(WEIGHT_KEY, raw);
  weightRaw = raw;
  weightSnap = next;
  emit();
}

/* ------------------------------------------------------------------ */
/* Hábitos — marcados hoje (objeto, cacheado) + streak (number)        */
/* ------------------------------------------------------------------ */

const EMPTY_HABITS: Record<string, boolean> = {};
let habitsRaw: string | null | undefined;
let habitsDay: string | undefined;
let habitsSnap: Record<string, boolean> = EMPTY_HABITS;

function readHabits(): Record<string, boolean> {
  const raw = window.localStorage.getItem(HABITS_KEY);
  const day = todayKey();
  if (raw !== habitsRaw || day !== habitsDay) {
    habitsRaw = raw;
    habitsDay = day;
    try {
      const value = raw
        ? (JSON.parse(raw) as { date: string; done: Record<string, boolean> })
        : null;
      habitsSnap = value && value.date === day ? (value.done ?? {}) : EMPTY_HABITS;
    } catch {
      habitsSnap = EMPTY_HABITS;
    }
  }
  return habitsSnap;
}

export function getHabitsSnapshot(): Record<string, boolean> {
  if (typeof window === "undefined") return EMPTY_HABITS;
  return readHabits();
}

export function getHabitsServerSnapshot(): Record<string, boolean> {
  return EMPTY_HABITS;
}

export function setHabits(done: Record<string, boolean>): void {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify({ date: todayKey(), done });
  window.localStorage.setItem(HABITS_KEY, raw);
  habitsRaw = raw;
  habitsDay = todayKey();
  habitsSnap = done;
  emit();
}

export function getStreakSnapshot(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(STREAK_KEY);
    if (!raw) return 0;
    const value = JSON.parse(raw) as { count: number; lastDate: string };
    // Conta como ativo se o último dia completo foi hoje ou ontem.
    if (value.lastDate === todayKey() || value.lastDate === yesterdayKey()) {
      return value.count ?? 0;
    }
    return 0;
  } catch {
    return 0;
  }
}

export function getStreakServerSnapshot(): number {
  return 0;
}

/** Marca o dia como completo e avança o streak (idempotente no mesmo dia). */
export function markDayComplete(): void {
  if (typeof window === "undefined") return;
  let count = 0;
  let lastDate = "";
  try {
    const raw = window.localStorage.getItem(STREAK_KEY);
    if (raw) {
      const value = JSON.parse(raw) as { count: number; lastDate: string };
      count = value.count ?? 0;
      lastDate = value.lastDate ?? "";
    }
  } catch {
    // começa do zero
  }
  if (lastDate === todayKey()) return;
  const nextCount = lastDate === yesterdayKey() ? count + 1 : 1;
  window.localStorage.setItem(
    STREAK_KEY,
    JSON.stringify({ count: nextCount, lastDate: todayKey() }),
  );
  emit();
}
