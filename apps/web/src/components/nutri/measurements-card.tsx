"use client";

import {
  PlusIcon,
  RulerIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react";
import { useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useMeasurements } from "@/hooks/use-measurements";
import {
  latestFor,
  MEASUREMENTS,
  type MeasurementDef,
  seriesFor,
} from "@/lib/measurements";
import type { MeasurementEntry, MeasurementKey } from "@/lib/measurements-store";
import { cn } from "@/lib/utils";

function MiniSparkline({ values }: { values: number[] }) {
  const w = 100;
  const h = 28;
  const pad = 3;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = values.length > 1 ? (w - pad * 2) / (values.length - 1) : 0;
  const pts = values.map((v, i) => ({
    x: pad + i * stepX,
    y: pad + (1 - (v - min) / range) * (h - pad * 2),
  }));
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");
  const last = pts[pts.length - 1];

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="mt-2 h-7 w-full"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d={line}
        fill="none"
        stroke="#9656a1"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={last.x} cy={last.y} r={2.5} fill="#ff8906" />
    </svg>
  );
}

function MeasureTile({
  def,
  entries,
}: {
  def: MeasurementDef;
  entries: MeasurementEntry[];
}) {
  const series = seriesFor(entries, def.key);
  const latest = series.length ? series[series.length - 1].value : undefined;
  const first = series.length ? series[0].value : undefined;
  const delta =
    latest != null && first != null ? Number((latest - first).toFixed(1)) : 0;
  const shrank = delta < 0;

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
          <span aria-hidden>{def.emoji}</span>
          {def.label}
        </span>
        {series.length > 1 && delta !== 0 ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums",
              shrank ? "text-emerald-400" : "text-brl-orange",
            )}
          >
            {shrank ? (
              <TrendingDownIcon className="size-3.5" />
            ) : (
              <TrendingUpIcon className="size-3.5" />
            )}
            {shrank ? "" : "+"}
            {delta} cm
          </span>
        ) : null}
      </div>

      <div className="mt-1.5 flex items-baseline gap-1">
        {latest != null ? (
          <>
            <span className="font-display text-2xl font-bold tabular-nums text-foreground">
              {latest}
            </span>
            <span className="text-xs text-muted-foreground">cm</span>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </div>

      {series.length > 1 ? (
        <MiniSparkline values={series.map((p) => p.value)} />
      ) : null}
    </div>
  );
}

/**
 * Formulário de registro. Só é montado quando o sheet abre (ver `SheetContent`),
 * então o estado inicial pré-preenche a partir do último valor sem precisar de
 * effect — evita o anti-padrão de setState dentro de useEffect.
 */
function MeasurementsForm({
  entries,
  onClose,
}: {
  entries: MeasurementEntry[];
  onClose: () => void;
}) {
  const { record } = useMeasurements();
  const toast = useToast();
  const [vals, setVals] = useState<Partial<Record<MeasurementKey, string>>>(
    () => {
      const init: Partial<Record<MeasurementKey, string>> = {};
      for (const def of MEASUREMENTS) {
        const latest = latestFor(entries, def.key);
        init[def.key] = latest != null ? String(latest) : "";
      }
      return init;
    },
  );

  function handleSave() {
    const out: Partial<Record<MeasurementKey, number>> = {};
    for (const def of MEASUREMENTS) {
      const raw = (vals[def.key] ?? "").trim();
      if (!raw) continue;
      const n = Number(raw.replace(",", "."));
      if (!n || n < def.min || n > def.max) {
        toast({
          variant: "error",
          title: `${def.label} fora da faixa`,
          description: `Informe entre ${def.min} e ${def.max} cm.`,
        });
        return;
      }
      out[def.key] = Math.round(n * 10) / 10;
    }
    if (Object.keys(out).length === 0) {
      toast({
        variant: "error",
        title: "Nada pra salvar",
        description: "Preencha ao menos uma medida.",
      });
      return;
    }
    record(out);
    toast({
      variant: "success",
      title: "Medidas registradas 📏",
      description: "Sua evolução foi atualizada.",
    });
    onClose();
  }

  return (
    <>
      <SheetHeader className="border-b border-white/5 p-6">
        <p className="text-xs font-medium tracking-wide text-brl-purple uppercase">
          Hoje
        </p>
        <SheetTitle className="font-display text-2xl font-extrabold tracking-tight">
          Registrar medidas
        </SheetTitle>
        <SheetDescription>
          Anote as circunferências em cm. Preencha só as que medir.
        </SheetDescription>
      </SheetHeader>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6">
        {MEASUREMENTS.map((def) => (
          <div key={def.key}>
            <label
              htmlFor={`measure-${def.key}`}
              className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground"
            >
              <span aria-hidden>{def.emoji}</span>
              {def.label}
            </label>
            <div className="relative">
              <Input
                id={`measure-${def.key}`}
                type="number"
                inputMode="decimal"
                step="0.1"
                placeholder="—"
                value={vals[def.key] ?? ""}
                onChange={(e) =>
                  setVals((prev) => ({ ...prev, [def.key]: e.target.value }))
                }
                className="h-11 pr-10"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                cm
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-white/5 p-4">
        <Button
          type="button"
          onClick={handleSave}
          className="h-11 w-full bg-brl-purple text-white hover:bg-brl-purple/90"
        >
          Salvar medidas
        </Button>
      </div>
    </>
  );
}

export function MeasurementsCard() {
  const { entries } = useMeasurements();
  const [open, setOpen] = useState(false);
  const hasAny = entries.some((e) => Object.keys(e.values).length > 0);

  return (
    <div className="rounded-2xl border border-white/5 bg-brl-card p-6 md:p-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-display text-lg font-bold">
          <RulerIcon className="size-4 text-brl-purple" />
          Medidas
        </h3>
        <Button
          type="button"
          onClick={() => setOpen(true)}
          className="h-9 gap-1.5 bg-brl-purple px-4 text-white hover:bg-brl-purple/90"
        >
          <PlusIcon className="size-4" />
          Registrar
        </Button>
      </div>

      {hasAny ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {MEASUREMENTS.map((def) => (
            <MeasureTile key={def.key} def={def} entries={entries} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-10 text-center">
          <span className="text-3xl" aria-hidden>
            📐
          </span>
          <p className="max-w-xs text-sm text-muted-foreground">
            Registre cintura, quadril e mais pra acompanhar sua evolução além da
            balança.
          </p>
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
          {open ? (
            <MeasurementsForm
              entries={entries}
              onClose={() => setOpen(false)}
            />
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
