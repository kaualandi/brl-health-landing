/**
 * Tracking de saúde (mock, localStorage): sono e passos. Histórico por dia pra
 * mostrar a semana. Mesmo padrão SSR-safe (useSyncExternalStore) dos outros
 * stores, com snapshots de array cacheados por conteúdo bruto pra manter a
 * referência estável. Registrar no mesmo dia faz upsert (substitui o do dia).
 */

const SLEEP_KEY = "brl.nutri.sleep";
const STEPS_KEY = "brl.nutri.steps";

export interface SleepEntry {
  /** YYYY-MM-DD (a "noite" registrada). */
  date: string;
  hours: number;
}

export interface StepEntry {
  /** YYYY-MM-DD */
  date: string;
  count: number;
}

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeHealth(listener: Listener): () => void {
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

function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayKey(): string {
  return dayKey(new Date());
}

/** Os últimos `n` dias (incluindo hoje), do mais antigo pro mais recente. */
export function lastNDays(n: number): string[] {
  const out: string[] = [];
  const cursor = new Date();
  cursor.setDate(cursor.getDate() - (n - 1));
  for (let i = 0; i < n; i++) {
    out.push(dayKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Sono — histórico (array cacheado)                                   */
/* ------------------------------------------------------------------ */

const EMPTY_SLEEP: SleepEntry[] = [];
let sleepRaw: string | null | undefined;
let sleepSnap: SleepEntry[] = EMPTY_SLEEP;

function readSleep(): SleepEntry[] {
  const raw = window.localStorage.getItem(SLEEP_KEY);
  if (raw !== sleepRaw) {
    sleepRaw = raw;
    try {
      const value = raw ? (JSON.parse(raw) as SleepEntry[]) : EMPTY_SLEEP;
      sleepSnap = Array.isArray(value) ? value : EMPTY_SLEEP;
    } catch {
      sleepSnap = EMPTY_SLEEP;
    }
  }
  return sleepSnap;
}

export function getSleepSnapshot(): SleepEntry[] {
  if (typeof window === "undefined") return EMPTY_SLEEP;
  return readSleep();
}

export function getSleepServerSnapshot(): SleepEntry[] {
  return EMPTY_SLEEP;
}

/** Registra (ou substitui) o sono de hoje. */
export function recordSleep(hours: number): void {
  if (typeof window === "undefined") return;
  const date = todayKey();
  const next = [
    ...readSleep().filter((e) => e.date !== date),
    { date, hours: Math.max(0, hours) },
  ].sort((a, b) => a.date.localeCompare(b.date));
  const raw = JSON.stringify(next);
  window.localStorage.setItem(SLEEP_KEY, raw);
  sleepRaw = raw;
  sleepSnap = next;
  emit();
}

/* ------------------------------------------------------------------ */
/* Passos — histórico (array cacheado)                                 */
/* ------------------------------------------------------------------ */

const EMPTY_STEPS: StepEntry[] = [];
let stepsRaw: string | null | undefined;
let stepsSnap: StepEntry[] = EMPTY_STEPS;

function readSteps(): StepEntry[] {
  const raw = window.localStorage.getItem(STEPS_KEY);
  if (raw !== stepsRaw) {
    stepsRaw = raw;
    try {
      const value = raw ? (JSON.parse(raw) as StepEntry[]) : EMPTY_STEPS;
      stepsSnap = Array.isArray(value) ? value : EMPTY_STEPS;
    } catch {
      stepsSnap = EMPTY_STEPS;
    }
  }
  return stepsSnap;
}

export function getStepsSnapshot(): StepEntry[] {
  if (typeof window === "undefined") return EMPTY_STEPS;
  return readSteps();
}

export function getStepsServerSnapshot(): StepEntry[] {
  return EMPTY_STEPS;
}

/** Define os passos de hoje (substitui). */
export function setSteps(count: number): void {
  if (typeof window === "undefined") return;
  const date = todayKey();
  const next = [
    ...readSteps().filter((e) => e.date !== date),
    { date, count: Math.max(0, Math.round(count)) },
  ].sort((a, b) => a.date.localeCompare(b.date));
  const raw = JSON.stringify(next);
  window.localStorage.setItem(STEPS_KEY, raw);
  stepsRaw = raw;
  stepsSnap = next;
  emit();
}

/** Soma (ou subtrai) passos ao total de hoje. */
export function addSteps(delta: number): void {
  const today = readSteps().find((e) => e.date === todayKey());
  setSteps((today?.count ?? 0) + delta);
}
