import type { Consultation } from "@/lib/consultations-store";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type ScheduleInput = {
  nutritionistId: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM */
  time: string;
};

/**
 * Agenda a consulta (mock). Simula a latência da rede e devolve a consulta já
 * com id e carimbo de criação — quem chamou persiste no `consultations-store`.
 */
export async function scheduleConsultation(
  input: ScheduleInput,
): Promise<Consultation> {
  await wait(1100);

  return {
    id: `c_${Date.now().toString(36)}`,
    nutritionistId: input.nutritionistId,
    date: input.date,
    time: input.time,
    createdAt: new Date().toISOString(),
  };
  // TODO: substituir por api.post('/consultations', input) na fase de backend
}
