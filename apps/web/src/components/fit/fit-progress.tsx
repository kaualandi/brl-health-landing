"use client";

import { FlameIcon } from "lucide-react";

import { formatVolume } from "@/lib/fit-session";
import type { FitStats } from "@/services/fit-stats.service";

export const fmtDay = (date: string) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "America/Sao_Paulo" }).format(new Date(`${date}T12:00:00-03:00`));

function Card({ label, value, hint, icon }: { label: string; value: string; hint: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-foreground/10 bg-card p-4">
      <span className="text-xs font-semibold text-muted-foreground uppercase">{label}</span>
      <span className="flex items-center gap-1.5 font-display text-2xl font-extrabold tabular-nums">
        {icon}
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </div>
  );
}

function deltaHint(cur: number, prev: number) {
  if (!prev) return cur ? "Sem treino na semana anterior" : "Nenhum treino ainda";
  const pct = Math.round(((cur - prev) / prev) * 100);
  return `${pct >= 0 ? "+" : ""}${pct}% vs. semana anterior`;
}

/** Treinos, volume da semana (vs. anterior) e sequência semanal. */
export function SummaryCards({ stats }: { stats: FitStats }) {
  const [prev, cur] = stats.weeks.slice(-2);
  const { streak, totals } = stats;
  const weeks = (n: number) => `${n} ${n === 1 ? "semana" : "semanas"}`;
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Card label="Treinos" value={String(totals.sessions)} hint={`${cur.sessions} nesta semana`} />
      <Card label="Volume da semana" value={formatVolume(cur.volume)} hint={deltaHint(cur.volume, prev.volume)} />
      <Card
        label="Sequência"
        value={weeks(streak.current)}
        hint={`Melhor: ${weeks(streak.best)}`}
        icon={<FlameIcon aria-hidden className={streak.current ? "size-5 text-brl-orange" : "size-5 text-muted-foreground"} />}
      />
    </div>
  );
}

/** Volume por semana (8 semanas); a altura é relativa ao maior valor. */
export function WeeklyChart({ weeks }: { weeks: FitStats["weeks"] }) {
  const max = Math.max(...weeks.map((w) => w.volume), 1);
  return (
    <section aria-label="Volume semanal" className="rounded-2xl border border-foreground/10 bg-card p-4">
      <h3 className="mb-3 text-sm font-bold">Volume semanal</h3>
      <ul className="flex h-32 items-end gap-1.5">
        {weeks.map((w, i) => (
          <li key={w.start} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
            <span className="sr-only">{`Semana de ${fmtDay(w.start)}: ${formatVolume(w.volume)} em ${w.sessions} ${w.sessions === 1 ? "treino" : "treinos"}`}</span>
            <span aria-hidden className="w-full rounded-t-md bg-brl-purple/80 data-[now=true]:bg-brl-orange" data-now={i === weeks.length - 1} style={{ height: `${Math.max(2, (w.volume / max) * 100)}%` }} />
          </li>
        ))}
      </ul>
      <div aria-hidden className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
        <span>{fmtDay(weeks[0].start)}</span>
        <span>Esta semana</span>
      </div>
    </section>
  );
}
