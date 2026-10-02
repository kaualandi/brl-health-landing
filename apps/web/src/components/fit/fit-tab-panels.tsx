"use client";

import Link from "next/link";
import { Loader2Icon, PencilIcon, RefreshCwIcon } from "lucide-react";
import { useState } from "react";

import { FitPlanPreview } from "@/components/fit/fit-plan-preview";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { FitPlan } from "@/lib/fit-plan";
import { generateFitPlan } from "@/services/fit-plan.service";

/** Gera (ou refaz) o plano a partir do perfil, com toast de erro. */
export function useGenerate() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      await generateFitPlan();
    } catch (e) {
      toast({ variant: "error", title: "Não foi possível gerar o plano", description: (e as Error).message });
    }
    setBusy(false);
  };
  return { busy, run };
}

export function GenerateButton({ label }: { label: string }) {
  const { busy, run } = useGenerate();
  return (
    <Button type="button" variant="outline" className="h-12" onClick={run} disabled={busy}>
      {busy ? <Loader2Icon aria-hidden className="animate-spin" /> : <RefreshCwIcon aria-hidden />}
      {label}
    </Button>
  );
}

export function PlanTab({ plan }: { plan: FitPlan }) {
  return (
    <section aria-label="Plano da semana" className="flex flex-col gap-5 pt-8 md:pt-12">
      <h2 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">Sua semana de treino</h2>
      <FitPlanPreview plan={plan} />
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button render={<Link href="/fit/perfil" />} nativeButton={false} variant="outline" className="h-12">
          <PencilIcon aria-hidden /> Editar perfil
        </Button>
        <GenerateButton label="Gerar outro plano" />
      </div>
    </section>
  );
}

export function ProgressTab() {
  return (
    <section aria-label="Progresso" className="pt-8 md:pt-12">
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-foreground/15 bg-card p-10 text-center">
        <span aria-hidden className="text-5xl">
          📈
        </span>
        <h2 className="font-display text-xl font-bold">Sua evolução vai aparecer aqui</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Seus treinos aparecem aqui quando você registrar o primeiro. Cargas, repetições e constância num só lugar.
        </p>
      </div>
    </section>
  );
}
