export const AGENDA: Record<string, string[]> = {
  "ana-prado": ["08:00", "09:00", "10:00", "14:00", "15:00"],
  "rafael-couto": ["07:00", "12:00", "18:00", "19:00", "20:00"],
  "bianca-rios": ["09:00", "10:00", "11:00", "16:00", "17:00"],
  "diego-martins": ["08:30", "11:30", "13:30", "16:30", "18:30"],
};

export type ScheduleContext = {
  nutritionistId: string;
  date: string;
  time: string;
  today: string;
  activeCount: number;
  credits: number;
  slotTaken: boolean;
};

/** Dia da semana de YYYY-MM-DD, independente do fuso do servidor. */
export const isSunday = (date: string) => new Date(`${date}T12:00:00Z`).getUTCDay() === 0;

/** Data real do calendário (rejeita 2026-02-31). */
export const isRealDate = (date: string) => {
  const d = new Date(`${date}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === date;
};

export function scheduleErrors(c: ScheduleContext) {
  const errors: string[] = [];
  if (c.activeCount >= c.credits) errors.push("Sem saldo de consultas no seu plano.");
  if (c.slotTaken) errors.push("Horário já ocupado para este nutricionista.");
  if (isSunday(c.date)) errors.push("Não há atendimento aos domingos.");
  if (!AGENDA[c.nutritionistId]?.includes(c.time)) errors.push("Horário fora da agenda do profissional.");
  if (c.date < c.today) errors.push("A data não pode estar no passado.");
  return errors;
}
