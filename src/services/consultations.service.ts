import { api } from "@/lib/axios";
import {
  type Consultation,
  removeConsultation,
  setConsultations,
} from "@/lib/consultations-store";
import type { User } from "@/types";

export type ScheduleInput = {
  nutritionistId: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM */
  time: string;
};

/** Saída do JOIN de GET /consultations/me (consultations × nutritionists × users). */
type ConsultationView = {
  id: number;
  nutritionistId: string;
  date: string;
  time: string;
  nutritionistName: string;
  nutritionistFocus: string;
  crn: string;
  userName: string;
};

function fromView(v: ConsultationView): Consultation {
  return {
    id: String(v.id),
    nutritionistId: v.nutritionistId,
    date: v.date,
    time: v.time,
    createdAt: "",
  };
}

/**
 * Agenda a consulta (POST /consultations). O backend roda 5 validações → 400
 * com mensagem específica (sem crédito, slot ocupado, data passada, etc.) e
 * devolve o id; montamos o `Consultation` do front a partir do input + id.
 */
export async function scheduleConsultation(
  input: ScheduleInput,
): Promise<Consultation> {
  const { data } = await api.post<{ id: number }>("/consultations", input);
  return {
    id: String(data.id),
    nutritionistId: input.nutritionistId,
    date: input.date,
    time: input.time,
    createdAt: new Date().toISOString(),
  };
}

/** Cancela a consulta (DELETE /consultations/{id}) e devolve o crédito; atualiza o cache. */
export async function cancelConsultation(id: string): Promise<void> {
  await api.delete(`/consultations/${id}`);
  removeConsultation(id);
}

/* --- hidratação das consultas a partir do servidor (uma vez por usuário/sessão) --- */

let hydratedUserId: string | null = null;
let hydrating: Promise<void> | null = null;

async function fetchConsultations(): Promise<void> {
  try {
    const { data } = await api.get<ConsultationView[]>("/consultations/me");
    setConsultations(data.map(fromView));
  } catch {
    // Falha de rede: mantém o cache, silencioso.
  }
}

export function ensureConsultationsHydrated(user: User): Promise<void> {
  if (hydratedUserId === user.id) return Promise.resolve();
  if (hydrating) return hydrating;
  hydrating = fetchConsultations().finally(() => {
    hydratedUserId = user.id;
    hydrating = null;
  });
  return hydrating;
}

/** Zera a hidratação das consultas (logout). */
export function resetConsultationsHydration(): void {
  hydratedUserId = null;
  hydrating = null;
}
