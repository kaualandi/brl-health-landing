"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import type { FitPlan } from "@/lib/fit-plan";
import { monthGrid, shiftMonth, todayInSaoPaulo, workoutLetter, type MonthCell, type YearMonth } from "@/lib/fit-week";
import { cn } from "@/lib/utils";

const WEEK = [
  ["D", "Domingo"],
  ["S", "Segunda"],
  ["T", "Terça"],
  ["Q", "Quarta"],
  ["Q", "Quinta"],
  ["S", "Sexta"],
  ["S", "Sábado"],
];

const monthName = ({ year, month }: YearMonth) =>
  new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month, 1)));

function Cell({ cell }: { cell: MonthCell | null }) {
  if (!cell) return <td />;
  return (
    <td className="p-0.5 sm:p-1">
      <div
        className={cn(
          "flex h-12 flex-col items-center justify-center gap-1 rounded-lg text-sm tabular-nums sm:h-14",
          cell.today && "ring-2 ring-brl-purple",
          cell.day && "bg-brl-purple/10",
          cell.past && "text-muted-foreground",
        )}
      >
        <span className="sr-only">{`${WEEK[cell.weekday][1]}, dia ${cell.date}${cell.today ? " (hoje)" : ""}: ${cell.day ? cell.day.name : "descanso"}`}</span>
        <span aria-hidden className={cn("leading-none", cell.today && "font-bold")}>
          {cell.date}
        </span>
        {cell.day ? (
          <span
            aria-hidden
            className={cn("grid size-5 place-items-center rounded-full text-[10px] font-bold", cell.past ? "bg-brl-purple/35 text-foreground" : "bg-brl-purple text-white")}
          >
            {workoutLetter(cell.day)}
          </span>
        ) : (
          <span aria-hidden className="size-5" />
        )}
      </div>
    </td>
  );
}

/** Mês inteiro com o treino de cada dia (mesma regra de dias fixos da aba Hoje); navega entre meses. */
export function FitMonthCalendar({ plan }: { plan: FitPlan }) {
  const [today] = useState(() => todayInSaoPaulo());
  const [cursor, setCursor] = useState<YearMonth>({ year: today.year, month: today.month });
  const cells = useMemo(() => monthGrid(plan, cursor, today), [plan, cursor, today]);
  const weeks = Array.from({ length: Math.ceil(cells.length / 7) }, (_, w) => cells.slice(w * 7, w * 7 + 7));
  const label = monthName(cursor);
  return (
    <section aria-labelledby="fit-month" className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4 md:p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 id="fit-month" aria-live="polite" className="font-display text-base font-bold first-letter:uppercase">
          {label}
        </h3>
        <div className="flex gap-1">
          <Button type="button" variant="ghost" size="icon-lg" onClick={() => setCursor((c) => shiftMonth(c, -1))} aria-label="Mês anterior">
            <ChevronLeftIcon aria-hidden />
          </Button>
          <Button type="button" variant="ghost" size="icon-lg" onClick={() => setCursor((c) => shiftMonth(c, 1))} aria-label="Próximo mês">
            <ChevronRightIcon aria-hidden />
          </Button>
        </div>
      </div>
      <table className="mt-3 w-full table-fixed border-collapse">
        <caption className="sr-only">Treinos de {label}</caption>
        <thead>
          <tr>
            {WEEK.map(([short, long]) => (
              <th key={long} scope="col" className="pb-2 text-xs font-medium text-muted-foreground">
                <span aria-hidden>{short}</span>
                <span className="sr-only">{long}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, w) => (
            <tr key={w}>
              {week.map((cell, i) => (
                <Cell key={i} cell={cell} />
              ))}
              {Array.from({ length: 7 - week.length }, (_, i) => (
                <td key={`end-${i}`} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="mt-4 flex flex-col gap-1.5 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-4">
        {plan.days.map((d) => (
          <li key={d.index} className="flex items-center gap-1.5">
            <span className="grid size-5 place-items-center rounded-full bg-brl-purple text-[10px] font-bold text-white">
              {workoutLetter(d)}
            </span>
            {d.name.split(" — ")[1] ?? d.name}
          </li>
        ))}
      </ul>
    </section>
  );
}
