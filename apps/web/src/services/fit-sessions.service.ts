import { api } from "@/lib/axios";
import {
  dequeue,
  enqueue,
  overlayLoads,
  type ActiveSession,
  type Loads,
  type SessionPayload,
} from "@/lib/fit-session";

const PREFIX = "brl.fit.session.";
const activeKey = (uid: string) => `${PREFIX}active.${uid}`;
const queueKey = (uid: string) => `${PREFIX}queue.${uid}`;
const failedKey = (uid: string) => `${PREFIX}queue.failed.${uid}`;

export type SessionSummary = {
  id: string;
  clientId: string;
  date: string;
  dayIndex: number;
  dayName: string;
  durationSeconds: number | null;
  setsDone: number;
  volumeKg: number;
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  if (value === null) window.localStorage.removeItem(key);
  else window.localStorage.setItem(key, JSON.stringify(value));
}

export const loadActive = (uid: string) => read<ActiveSession | null>(activeKey(uid), null);
export const saveActive = (uid: string, s: ActiveSession | null) => write(activeKey(uid), s);
export const loadQueue = (uid: string) => read<SessionPayload[]>(queueKey(uid), []);

/** Exclusão de conta: apaga só o treino em andamento e as filas deste usuário. */
export function clearFitSessions(uid: string): void {
  write(activeKey(uid), null);
  write(queueKey(uid), null);
  write(failedKey(uid), null);
}

export type FailedSession = { payload: SessionPayload; error: string };

export const loadFailed = (uid: string) => read<FailedSession[]>(failedKey(uid), []);
export const pendingCount = (uid: string) => loadQueue(uid).length + loadFailed(uid).length;

export const discardFailed = (uid: string, clientId: string) =>
  write(failedKey(uid), loadFailed(uid).filter((f) => f.payload.clientId !== clientId));

/** Devolve o treino recusado pra fila e tenta de novo. */
export function retryFailed(uid: string, clientId: string): Promise<number> {
  const item = loadFailed(uid).find((f) => f.payload.clientId === clientId);
  if (item) write(queueKey(uid), enqueue(loadQueue(uid), item.payload));
  discardFailed(uid, clientId);
  return flushQueue(uid);
}

/** Resultado do envio: ok sai da fila; 4xx (menos 401/429) vai pros recusados; o resto fica pra tentar depois. */
export type Outcome = "sent" | "rejected" | "retry";
export function classify(status: number | undefined): Outcome {
  if (!status || status >= 500 || status === 401 || status === 429) return "retry";
  return status >= 400 ? "rejected" : "sent";
}

let flushing: Promise<number> | null = null;

/** Reenvia a fila em ordem; para na 1ª falha transitória. Devolve quantos seguem pendentes (fila + recusados). */
export function flushQueue(uid: string): Promise<number> {
  flushing ??= (async () => {
    for (const p of loadQueue(uid)) {
      let status: number | undefined = 200;
      let message = "";
      try {
        await api.post("/fit/sessions", p);
      } catch (e) {
        status = (e as { status?: number }).status;
        message = (e as Error).message;
      }
      const outcome = classify(status);
      if (outcome === "retry") break;
      if (outcome === "rejected") write(failedKey(uid), [...loadFailed(uid), { payload: p, error: message }]);
      write(queueKey(uid), dequeue(loadQueue(uid), p.clientId));
    }
    return pendingCount(uid);
  })().finally(() => {
    flushing = null;
  });
  return flushing;
}

/** Conclui: entra na fila (com clientId), limpa o treino em andamento e tenta enviar. */
export async function submitSession(uid: string, p: SessionPayload): Promise<number> {
  write(queueKey(uid), enqueue(loadQueue(uid), p));
  saveActive(uid, null);
  return flushQueue(uid);
}

export async function getHistory(limit = 30): Promise<SessionSummary[]> {
  const { data } = await api.get<SessionSummary[]>("/fit/sessions", { params: { limit } });
  return data;
}

/** Última carga por exercício (servidor + treinos pendentes); sem rede, só os pendentes. */
export async function getLastLoads(uid: string): Promise<Loads> {
  const base = await api.get<Loads>("/fit/sessions/last-loads").then((r) => r.data, () => ({}) as Loads);
  return overlayLoads(base, loadQueue(uid));
}
