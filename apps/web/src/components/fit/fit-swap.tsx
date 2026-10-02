"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRightIcon, Loader2Icon } from "lucide-react";
import { useRef, useState } from "react";

import { ExerciseGif } from "@/components/fit/exercise-parts";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { useSwapAlternatives } from "@/hooks/use-fit-plan";
import { sentenceCase } from "@/lib/exercises";
import type { FitAlternative, FitPlanExercise } from "@/lib/fit-plan";
import { swapFitExercise } from "@/services/fit-plan.service";

type Target = { day: number; item: FitPlanExercise };

function Option({ alt, busy, onPick }: { alt: FitAlternative; busy: boolean; onPick: () => void }) {
  const meta = [...alt.targetMuscles, ...alt.equipments].map((o) => o.label).join(" · ");
  return (
    <li>
      <button
        type="button"
        disabled={busy}
        onClick={onPick}
        aria-label={`Trocar por ${alt.name}`}
        className="flex w-full items-center gap-3 rounded-xl border border-foreground/10 p-2 text-left outline-none transition-colors hover:border-brl-purple/50 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
      >
        <ExerciseGif src={alt.gifUrl} name={alt.name} className="size-14 w-14 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{sentenceCase(alt.name)}</span>
          <span className="block truncate text-xs text-muted-foreground">{meta}</span>
        </span>
      </button>
    </li>
  );
}

function Alternatives({ target, onDone }: { target: Target; onDone: () => void }) {
  const toast = useToast();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const { day, item } = target;
  const query = useSwapAlternatives(day, item.order, item.exercise.id);

  async function pick(alt: FitAlternative) {
    setBusy(true);
    try {
      await swapFitExercise(day, item.order, alt.id);
      void qc.invalidateQueries({ queryKey: ["fit-progression"] });
      toast({ variant: "success", title: "Exercício trocado", description: sentenceCase(alt.name) });
      onDone();
    } catch (e) {
      toast({ variant: "error", title: "Não foi possível trocar", description: (e as Error).message });
      setBusy(false);
    }
  }

  if (query.isPending) return <Loader2Icon role="status" aria-label="Carregando alternativas" className="mx-auto my-8 size-6 animate-spin text-brl-purple" />;
  if (query.isError)
    return (
      <div role="alert" className="flex flex-col items-start gap-3 text-sm">
        Não foi possível carregar as alternativas.
        <Button type="button" variant="outline" onClick={() => void query.refetch()}>
          Tentar de novo
        </Button>
      </div>
    );
  if (query.data.length === 0) return <p className="text-sm text-muted-foreground">Sem alternativas com seu equipamento.</p>;
  return (
    <ul className="flex flex-col gap-2">
      {query.data.map((alt) => (
        <Option key={alt.id} alt={alt} busy={busy} onPick={() => void pick(alt)} />
      ))}
    </ul>
  );
}

/** Botão "Trocar" + sheet com alternativas equivalentes do exercício. */
export function SwapButton({ day, item }: Target) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <>
      <Button ref={trigger} type="button" variant="ghost" size="sm" onClick={() => setOpen(true)} aria-label={`Trocar ${item.exercise.name}`}>
        <ArrowLeftRightIcon aria-hidden /> Trocar
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md" finalFocus={trigger}>
          <SheetHeader className="border-b border-foreground/10 p-6">
            <SheetTitle className="font-display text-xl font-extrabold tracking-tight">Trocar exercício</SheetTitle>
            <SheetDescription>
              Em vez de {sentenceCase(item.exercise.name)}: movimento equivalente, só com o seu equipamento. Séries e descanso continuam.
            </SheetDescription>
          </SheetHeader>
          <div className="overflow-y-auto p-6">{open ? <Alternatives target={{ day, item }} onDone={() => setOpen(false)} /> : null}</div>
        </SheetContent>
      </Sheet>
    </>
  );
}
