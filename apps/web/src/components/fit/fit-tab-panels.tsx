"use client";

import Link from "next/link";
import { Loader2Icon, PencilIcon, RefreshCwIcon } from "lucide-react";
import { useRef, useState } from "react";

import { FitHistory } from "@/components/fit/fit-history";
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
  return (
    <section aria-label="Progresso" className="flex flex-col gap-4 pt-8 md:pt-12">
      <h2 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">Seus treinos</h2>
      <FitHistory />
    </section>
  );
}
