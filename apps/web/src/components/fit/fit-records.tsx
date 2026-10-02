"use client";

import { ChevronRightIcon, Loader2Icon } from "lucide-react";
import { useRef, useState } from "react";

import { fmtDay } from "@/components/fit/fit-progress";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useExerciseHistory, useFitRecords } from "@/hooks/use-fit-stats";
import { formatVolume } from "@/lib/fit-session";
import type { ExerciseHistory, FitRecord } from "@/services/fit-stats.service";

const W = 320;
const H = 120;
const PAD = 12;

/** Linha da maior carga por sessão; um ponto só vira marcador. */
function LoadChart({ points }: { points: ExerciseHistory["points"] }) {
  const kgs = points.map((p) => p.maxWeightKg);
  const min = Math.min(...kgs);
  const range = Math.max(...kgs) - min || 1;
  const xy = points.map((p, i) => [points.length > 1 ? PAD + (i * (W - PAD * 2)) / (points.length - 1) : W / 2, PAD + (1 - (p.maxWeightKg - min) / range) * (H - PAD * 2)]);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-32 w-full" preserveAspectRatio="none" aria-hidden>
      {xy.length > 1 ? <path d={xy.map(([x, y], i) => `${i ? "L" : "M"} ${x} ${y}`).join(" ")} fill="none" stroke="#9656a1" strokeWidth={2} vectorEffect="non-scaling-stroke" /> : null}
      {xy.map(([x, y], i) => (
        <circle key={points[i].date} cx={x} cy={y} r={4} fill={i === xy.length - 1 ? "#ff8906" : "#9656a1"} />
      ))}
    </svg>
  );
}

function HistoryBody({ id }: { id: string }) {
  const q = useExerciseHistory(id);
  if (q.isError) return <p role="alert" className="text-sm text-destructive">Não foi possível carregar o gráfico.</p>;
  if (!q.data) return <Loader2Icon aria-label="Carregando" className="mx-auto animate-spin" />;
  const pts = q.data.points;
  return (
    <div className="flex flex-col gap-3">
      <LoadChart points={pts} />
      <ul className="flex flex-col gap-1 text-sm">
        {[...pts].reverse().map((p) => (
          <li key={p.date} className="flex justify-between border-b border-foreground/5 py-1.5 tabular-nums">
            <span className="text-muted-foreground">{fmtDay(p.date)}</span>
            <span>
              <strong>{formatVolume(p.maxWeightKg)}</strong>{p.e1rmKg === null ? "" : ` · e1RM ${formatVolume(p.e1rmKg)}`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RecordRow({ r, onOpen }: { r: FitRecord; onOpen: (el: HTMLButtonElement) => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={(e) => onOpen(e.currentTarget)}
        aria-label={`${r.name}: ver gráfico de carga`}
        className="flex min-h-12 w-full items-center gap-3 rounded-2xl border border-foreground/10 bg-card p-4 text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{r.name}</span>
          <span className="text-xs text-muted-foreground">
            {fmtDay(r.maxWeightDate)}{r.e1rmKg === null ? "" : ` · e1RM ${formatVolume(r.e1rmKg)}`} · série {formatVolume(r.maxSetVolumeKg)}
          </span>
        </span>
        <span className="font-display text-lg font-extrabold tabular-nums">{formatVolume(r.maxWeightKg)}</span>
        <ChevronRightIcon aria-hidden className="size-4 text-muted-foreground" />
      </button>
    </li>
  );
}

/** Recordes pessoais; tocar abre o gráfico de carga do exercício. */
export function RecordsList() {
  const q = useFitRecords();
  const [sel, setSel] = useState<FitRecord | null>(null);
  const back = useRef<HTMLElement | null>(null);
  if (q.isError) return <p role="alert" className="text-sm text-destructive">Não foi possível carregar seus recordes.</p>;
  if (!q.data?.length) return null;
  return (
    <section aria-label="Recordes pessoais" className="flex flex-col gap-2">
      <h3 className="text-sm font-bold">Recordes pessoais</h3>
      <ul className="flex flex-col gap-2">
        {q.data.map((r) => (
          <RecordRow key={r.exerciseId} r={r} onOpen={(el) => { back.current = el; setSel(r); }} />
        ))}
      </ul>
      <Sheet open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md" finalFocus={back}>
          <SheetHeader className="border-b border-foreground/10 p-6">
            <SheetTitle className="font-display text-xl font-extrabold tracking-tight">{sel?.name}</SheetTitle>
            <SheetDescription>Maior carga por treino (kg), do mais antigo ao mais recente.</SheetDescription>
          </SheetHeader>
          <div className="overflow-y-auto p-6">{sel ? <HistoryBody id={sel.exerciseId} /> : null}</div>
        </SheetContent>
      </Sheet>
    </section>
  );
}
