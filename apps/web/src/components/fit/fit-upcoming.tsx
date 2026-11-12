"use client";

import { BedIcon, ChevronRightIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import type { FitPlan } from "@/lib/fit-plan";
import { upcomingDays, workoutLetter, type UpcomingDay } from "@/lib/fit-week";
import { cn } from "@/lib/utils";

const SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const LONG = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const dayLabel = (u: UpcomingDay) => (u.offset === 0 ? "Hoje" : u.offset === 1 ? "Amanhã" : LONG[u.weekday]);

type Pick = (index: number) => void;

function TomorrowCard({ item, onPick }: { item: UpcomingDay; onPick: Pick }) {
  const d = item.day;
  return (
    <div className="rounded-2xl border border-brl-purple/40 bg-linear-to-br from-brl-purple/20 to-brl-purple/5 p-5 md:p-6">
      <p className="text-xs font-semibold tracking-wide text-brl-purple uppercase">
        Amanhã · {LONG[item.weekday]}, {item.date}
      </p>
      {d ? (
        <>
          <h3 className="mt-2 font-display text-xl font-extrabold tracking-tight">{d.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {d.exercises.length} exercícios · {d.focus.join(" · ")}
          </p>
          <Button type="button" variant="outline" className="mt-4 h-11" onClick={() => onPick(d.index)}>
            Ver treino <ChevronRightIcon aria-hidden />
          </Button>
        </>
      ) : (
        <>
          <h3 className="mt-2 flex items-center gap-2 font-display text-xl font-extrabold tracking-tight">
            <BedIcon aria-hidden className="size-5 text-brl-purple" /> Descanso
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">Dia de recuperar: sono, água e uma caminhada leve.</p>
        </>
      )}
    </div>
  );
}

function CalendarDay({ u, onPick }: { u: UpcomingDay; onPick: Pick }) {
  const body = (
    <>
      <span className="sr-only">{`${dayLabel(u)}, dia ${u.date}: ${u.day ? u.day.name : "descanso"}`}</span>
      <span aria-hidden className="text-[11px] font-medium text-muted-foreground uppercase">
        {u.offset === 0 ? "Hoje" : SHORT[u.weekday]}
      </span>
      <span aria-hidden className="font-display text-lg leading-none font-extrabold tabular-nums">
        {u.date}
      </span>
      {u.day ? (
        <span aria-hidden className="grid size-7 place-items-center rounded-full bg-brl-purple text-xs font-bold text-white">
          {workoutLetter(u.day)}
        </span>
      ) : (
        <span aria-hidden className="grid size-7 place-items-center text-muted-foreground">
          <BedIcon className="size-4" />
        </span>
      )}
    </>
  );
  const box = cn(
    "flex min-h-24 w-full flex-col items-center justify-between gap-1 rounded-xl border px-1 py-2",
    u.offset === 1 ? "border-brl-purple/60 bg-brl-purple/10" : "border-foreground/10",
    u.offset === 0 && "bg-foreground/5",
  );
  const day = u.day;
  return (
    <li>
      {day ? (
        <button
          type="button"
          onClick={() => onPick(day.index)}
          className={cn(box, "outline-none transition-colors hover:border-brl-purple/50 focus-visible:ring-3 focus-visible:ring-ring/50")}
        >
          {body}
        </button>
      ) : (
        <div className={box}>{body}</div>
      )}
    </li>
  );
}

/** Amanhã em destaque + calendário dos próximos 7 dias; tocar num dia de treino abre esse treino. */
export function FitUpcoming({ plan, onPick }: { plan: FitPlan; onPick: Pick }) {
  const [now] = useState(() => new Date());
  const days = useMemo(() => upcomingDays(plan, now), [plan, now]);
  return (
    <section aria-labelledby="fit-upcoming" className="mt-8 flex flex-col gap-4">
      <h2 id="fit-upcoming" className="font-display text-xl font-extrabold tracking-tight">
        Próximos dias
      </h2>
      <TomorrowCard item={days[1]} onPick={onPick} />
      <ol aria-label="Calendário dos próximos 7 dias" className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((u) => (
          <CalendarDay key={u.offset} u={u} onPick={onPick} />
        ))}
      </ol>
    </section>
  );
}
