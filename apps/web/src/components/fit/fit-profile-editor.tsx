"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, Loader2Icon, SaveIcon } from "lucide-react";
import { useEffect, useState } from "react";

import {
  GoalStep,
  LevelStep,
  LimitationsStep,
  LocationStep,
  RoutineStep,
  type StepProps,
} from "@/components/fit/fit-steps";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useFitProfile } from "@/hooks/use-fit-profile";
import { fitFormError, toFitProfile, type FitForm, type FitProfile } from "@/lib/fit-profile";
import { generateFitPlan } from "@/services/fit-plan.service";
import { saveFitProfile } from "@/services/fit.service";

const SECTIONS = [
  ["Objetivo", GoalStep],
  ["Nível", LevelStep],
  ["Rotina", RoutineStep],
  ["Local e equipamentos", LocationStep],
  ["Limitações", LimitationsStep],
] as const;

function useGeneratePlan() {
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const generate = async () => {
    try {
      await generateFitPlan();
      setPending(false);
      toast({ variant: "success", title: "Plano atualizado", description: "Seu perfil foi salvo e a semana de treino refeita." });
    } catch (e) {
      toast({ variant: "error", title: "Perfil salvo, mas o plano não foi gerado", description: (e as Error).message });
      setPending(true);
    }
  };
  return { pending, generate };
}

function useSaveAndGenerate(data: FitForm) {
  const toast = useToast();
  const { pending, generate } = useGeneratePlan();
  const [saving, setSaving] = useState(false);
  const busy = async (work: () => Promise<void>) => {
    setSaving(true);
    await work();
    setSaving(false);
  };
  const save = () =>
    busy(async () => {
      const profile = toFitProfile(data);
      if (!profile) return toast({ variant: "error", title: "Confere os campos", description: fitFormError(data, "all") ?? undefined });
      try {
        await saveFitProfile(profile);
      } catch (e) {
        return toast({ variant: "error", title: "Não foi possível salvar", description: (e as Error).message });
      }
      await generate();
    });
  return { saving, pending, save, retry: () => busy(generate) };
}

type ActionsProps = { error: string | null; saving: boolean; pending: boolean; save: () => void; retry: () => void };

function Actions({ error, saving, pending, save, retry }: ActionsProps) {
  return (
    <>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="button" className="h-12" onClick={save} disabled={saving}>
        {saving ? <Loader2Icon aria-hidden className="animate-spin" /> : <SaveIcon aria-hidden />}
        Salvar alterações
      </Button>
      {pending ? (
        <Button type="button" variant="outline" className="h-12" disabled={saving} onClick={retry}>
          Tentar gerar de novo
        </Button>
      ) : null}
    </>
  );
}

function EditorForm({ initial }: { initial: FitProfile }) {
  const [data, setData] = useState<FitForm>(initial);
  const { saving, pending, save, retry } = useSaveAndGenerate(data);
  const update: StepProps["update"] = (key, value) => setData((d) => ({ ...d, [key]: value }));
  const patch: StepProps["patch"] = (changes) => setData((d) => ({ ...d, ...changes }));
  const error = fitFormError(data, "all");

  return (
    <div className="min-h-dvh bg-background">
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-8 md:px-6">
        <Link href="/fit/app" className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground">
          <ArrowLeftIcon aria-hidden className="size-4" /> BRL Fit
        </Link>
        <h1 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">Editar perfil de treino</h1>
        {SECTIONS.map(([title, Body]) => (
          <section key={title} aria-label={title}>
            <h2 className="mb-3 font-display text-lg font-bold">{title}</h2>
            <Body data={data} update={update} patch={patch} />
          </section>
        ))}
        <Actions error={error} saving={saving} pending={pending} save={save} retry={retry} />
      </main>
    </div>
  );
}

export function FitProfileEditor() {
  const profile = useFitProfile();
  const router = useRouter();

  useEffect(() => {
    if (profile === null) router.replace("/fit/comecar");
  }, [profile, router]);

  if (!profile) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Loader2Icon className="size-6 animate-spin text-brl-purple" aria-label="Carregando" />
      </div>
    );
  }
  return <EditorForm initial={profile} />;
}
