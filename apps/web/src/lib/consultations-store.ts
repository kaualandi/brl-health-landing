/**
 * Consultas agendadas com nutricionista (mock, localStorage). Persistente — não
 * reseta por dia. Mesmo padrão SSR-safe (useSyncExternalStore) dos outros stores,
 * com snapshot de array cacheado por conteúdo bruto pra manter referência estável.
 *
 * O "saldo de consultas" é derivado: cada tier dá um número de créditos e cada
 * consulta agendada consome um. Cancelar devolve o crédito.
 */

import type { PlanId } from "@/types";

const KEY = "brl.nutri.consultations";

export interface Consultation {
  id: string;
  nutritionistId: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM */
  time: string;
  createdAt: string;
}

/** Consultas incluídas em cada plano. */
const CREDITS_BY_TIER: Record<PlanId, number> = {
  free: 1,
  pro: 4,
  family: 8,
};

export function creditsForTier(tier: PlanId): number {
  return CREDITS_BY_TIER[tier] ?? 0;
}

type Listener = () => void;
const listeners = new Set<Listener>();

const EMPTY: Consultation[] = [];
let cachedRaw: string | null | undefined;
let cachedList: Consultation[] = EMPTY;

function read(): Consultation[] {
  const raw = window.localStorage.getItem(KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      const value = raw ? (JSON.parse(raw) as Consultation[]) : EMPTY;
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

function write(list: Consultation[]) {
  const raw = JSON.stringify(list);
  window.localStorage.setItem(KEY, raw);
  cachedRaw = raw;
  cachedList = list;
  emit();
}

export function subscribeConsultations(listener: Listener): () => void {
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

export function getConsultationsSnapshot(): Consultation[] {
  if (typeof window === "undefined") return EMPTY;
  return read();
}

export function getConsultationsServerSnapshot(): Consultation[] {
  return EMPTY;
}

export function addConsultation(consultation: Consultation): void {
  if (typeof window === "undefined") return;
  const current = read();
  // ordena por data + hora pra exibir as próximas primeiro
  const next = [...current, consultation].sort((a, b) =>
    `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
  );
  write(next);
}

export function removeConsultation(id: string): void {
  if (typeof window === "undefined") return;
  write(read().filter((c) => c.id !== id));
}

/** Substitui a lista inteira (usado na hidratação a partir do servidor). */
export function setConsultations(list: Consultation[]): void {
  if (typeof window === "undefined") return;
  const next = [...list].sort((a, b) =>
    `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
  );
  write(next);
}

/** Limpa as consultas em cache (logout). */
export function clearConsultations(): void {
  if (typeof window === "undefined") return;
  write([]);
}
