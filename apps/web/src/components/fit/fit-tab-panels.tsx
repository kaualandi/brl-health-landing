"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Loader2Icon, PencilIcon, RefreshCwIcon } from "lucide-react";
import { useRef, useState } from "react";

import { FitAchievements } from "@/components/fit/fit-achievements";
import { FitHistory } from "@/components/fit/fit-history";
import { FitPlanPreview } from "@/components/fit/fit-plan-preview";
import { SummaryCards, WeeklyChart } from "@/components/fit/fit-progress";
import { RecordsList } from "@/components/fit/fit-records";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useFitStats, useInvalidateFitStats } from "@/hooks/use-fit-stats";
import { useFitSync } from "@/hooks/use-fit-sync";
import type { FitPlan } from "@/lib/fit-plan";
import { generateFitPlan } from "@/services/fit-plan.service";

/** Gera (ou refaz) o plano a partir do perfil, com toast de erro. */
export function useGenerate() {
  const toast = useToast();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      await generateFitPlan();
      void qc.invalidateQueries({ queryKey: ["fit-progression"] });
    } catch (e) {
      toast({ variant: "error", title: "Não foi possível gerar o plano", description: (e as Error).message });
    }
    setBusy(false);
  };
  return { busy, run };
}

export function GenerateButton({ label, confirm }: { label: string; confirm?: string }) {
  const { busy, run } = useGenerate();
  const [asking, setAsking] = useState(false);
  const main = useRef<HTMLButtonElement>(null);
  const close = () => {
    setAsking(false);
    requestAnimationFrame(() => main.current?.focus());
  };
  if (asking)
    return (
      <div role="alertdialog" aria-labelledby="fit-regen-confirm" className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <p id="fit-regen-confirm" className="text-sm">
          {confirm}
        </p>
        <Button type="button" className="h-12" onClick={() => void run().then(close)} disabled={busy}>
          {busy ? <Loader2Icon aria-hidden className="animate-spin" /> : null}
          Confirmar
        </Button>
        <Button type="button" variant="ghost" className="h-12" onClick={close} disabled={busy} autoFocus>
          Cancelar
        </Button>
      </div>
    );
  return (
    <Button ref={main} type="button" variant="outline" className="h-12" onClick={() => (confirm ? setAsking(true) : void run())} disabled={busy}>
      {busy ? <Loader2Icon aria-hidden className="animate-spin" /> : <RefreshCwIcon aria-hidden />}
      {label}
    </Button>
  );
}

export function PlanTab({ plan }: { plan: FitPlan }) {
  return (
    <section aria-label="Plano da semana" className="flex flex-col gap-5 pt-8 md:pt-12">
      <h2 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">Sua semana de treino</h2>
      <FitPlanPreview plan={plan} swappable />
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button render={<Link href="/fit/perfil" />} nativeButton={false} variant="outline" className="h-12">
          <PencilIcon aria-hidden /> Editar perfil
        </Button>
        <GenerateButton label="Gerar outro plano" confirm="Gerar outro plano? Isso desfaz suas trocas." />
      </div>
    </section>
  );
}

export function ProgressTab() {
  const q = useFitStats();
  useFitSync(useInvalidateFitStats());
  const stats = q.data;
  return (
    <section aria-label="Progresso" className="flex flex-col gap-5 pt-8 md:pt-12">
      <h2 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">Seu progresso</h2>
      {q.isError ? (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl border border-destructive/40 p-4 text-sm">
          Não foi possível carregar seu progresso.
          <Button type="button" size="sm" variant="outline" onClick={() => void q.refetch()}>
            Tentar de novo
          </Button>
        </div>
      ) : null}
      {q.isPending ? <p className="text-sm text-muted-foreground">Carregando progresso…</p> : null}
      {stats && stats.totals.sessions > 0 ? (
        <>
          <SummaryCards stats={stats} />
          <WeeklyChart weeks={stats.weeks} />
          <RecordsList />
        </>
      ) : null}
      {stats ? <FitAchievements stats={stats} /> : null}
      <FitHistory />
    </section>
  );
}
