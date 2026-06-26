/**
 * Banco de nutricionistas (mock) e geração de agenda. O caminho "humano" do
 * BRL Nutri — escolher um profissional e marcar uma consulta por vídeo.
 *
 * A agenda é derivada da data atual: próximos dias úteis com horários fixos por
 * profissional. Os horários já ocupados (do `consultations-store`) são filtrados
 * na hora de exibir, então não dá pra marcar dois no mesmo slot.
 */

import type { DietStyle, Goal } from "@/types";

export interface Nutritionist {
  id: string;
  name: string;
  /** Emoji de avatar — placeholder até ter foto real. */
  avatar: string;
  /** Registro no conselho (fictício). */
  crn: string;
  /** Especialidade resumida, exibida no card. */
  focus: string;
  bio: string;
  /** 0–5, uma casa decimal. */
  rating: number;
  reviews: number;
  years: number;
  /** Objetivos com que mais combina — pra recomendar o profissional certo. */
  goals: Goal[];
  /** Estilos de dieta que domina — reforça a recomendação. */
  diets: DietStyle[];
}

export const NUTRITIONISTS: Nutritionist[] = [
  {
    id: "ana-prado",
    name: "Ana Prado",
    avatar: "👩🏻‍⚕️",
    crn: "CRN-3 12345",
    focus: "Emagrecimento e reeducação alimentar",
    bio: "Ajuda a perder gordura sem dietas malucas, ajustando o plano à sua rotina.",
    rating: 4.9,
    reviews: 212,
    years: 9,
    goals: ["lose", "health"],
    diets: ["omnivore", "lowcarb", "mediterranean"],
  },
  {
    id: "rafael-couto",
    name: "Rafael Couto",
    avatar: "👨🏽‍⚕️",
    crn: "CRN-4 23456",
    focus: "Nutrição esportiva e ganho de massa",
    bio: "Foco em performance e hipertrofia — periodiza a dieta junto com o treino.",
    rating: 4.8,
    reviews: 168,
    years: 7,
    goals: ["gain", "performance", "recomp"],
    diets: ["omnivore", "lowcarb"],
  },
  {
    id: "bianca-rios",
    name: "Bianca Rios",
    avatar: "👩🏾‍⚕️",
    crn: "CRN-1 34567",
    focus: "Alimentação vegetariana e vegana",
    bio: "Monta planos 100% vegetais equilibrados, sem deixar nenhum nutriente pra trás.",
    rating: 5.0,
    reviews: 143,
    years: 6,
    goals: ["health", "recomp", "lose"],
    diets: ["vegetarian", "vegan", "mediterranean"],
  },
  {
    id: "diego-martins",
    name: "Diego Martins",
    avatar: "🧑🏼‍⚕️",
    crn: "CRN-2 45678",
    focus: "Nutrição clínica e saúde metabólica",
    bio: "Cuida de quem busca saúde no longo prazo — colesterol, glicemia e bem-estar.",
    rating: 4.7,
    reviews: 97,
    years: 12,
    goals: ["health", "performance", "gain"],
    diets: ["omnivore", "mediterranean", "lowcarb"],
  },
];

export function nutritionistById(id: string): Nutritionist | undefined {
  return NUTRITIONISTS.find((n) => n.id === id);
}

/** O profissional que mais combina com o objetivo + dieta do usuário. */
export function recommendedNutritionist(
  goal: Goal,
  diet: DietStyle,
): Nutritionist {
  let best = NUTRITIONISTS[0];
  let bestScore = -1;
  for (const n of NUTRITIONISTS) {
    const score = (n.goals.includes(goal) ? 2 : 0) + (n.diets.includes(diet) ? 1 : 0);
    if (score > bestScore) {
      best = n;
      bestScore = score;
    }
  }
  return best;
}

/* ------------------------------------------------------------------ */
/* Agenda — dias e horários disponíveis a partir de hoje               */
/* ------------------------------------------------------------------ */

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

/** Grade de horários por profissional — varia pra cada um parecer real. */
const SLOTS_BY_NUTRI: Record<string, string[]> = {
  "ana-prado": ["08:00", "09:00", "10:00", "14:00", "15:00"],
  "rafael-couto": ["07:00", "12:00", "18:00", "19:00", "20:00"],
  "bianca-rios": ["09:00", "10:00", "11:00", "16:00", "17:00"],
  "diego-martins": ["08:30", "11:30", "13:30", "16:30", "18:30"],
};

function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export interface AgendaDay {
  /** YYYY-MM-DD */
  iso: string;
  /** "Seg", "Ter"... */
  weekday: string;
  /** Número do dia no mês. */
  day: number;
  /** "jun", "jul"... */
  month: string;
  /** É a data de hoje? */
  isToday: boolean;
}

/** Próximos `count` dias úteis (pula domingo), a partir de amanhã. */
export function agendaDays(count = 5): AgendaDay[] {
  const days: AgendaDay[] = [];
  const cursor = new Date();
  const todayIso = dateKey(new Date());
  cursor.setDate(cursor.getDate() + 1); // começa amanhã
  while (days.length < count) {
    if (cursor.getDay() !== 0) {
      const iso = dateKey(cursor);
      days.push({
        iso,
        weekday: WEEKDAYS[cursor.getDay()],
        day: cursor.getDate(),
        month: MONTHS[cursor.getMonth()],
        isToday: iso === todayIso,
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

/** Horários do profissional num dia, menos os já ocupados (`taken`). */
export function slotsForDay(nutritionistId: string, taken: string[] = []): string[] {
  const all = SLOTS_BY_NUTRI[nutritionistId] ?? SLOTS_BY_NUTRI["ana-prado"];
  return all.filter((slot) => !taken.includes(slot));
}

/** Formata YYYY-MM-DD para algo legível, ex.: "Qua, 8 jul". */
export function formatAgendaDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${WEEKDAYS[date.getDay()]}, ${d} ${MONTHS[m - 1]}`;
}
