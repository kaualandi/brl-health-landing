"use client";

import Link from "next/link";
import { ArrowLeftIcon, ArrowRightIcon, CheckCircle2Icon, Loader2Icon } from "lucide-react";
import { useState, type ComponentType } from "react";

import {
  GoalStep,
  LevelStep,
  LimitationsStep,
  LocationStep,
  RoutineStep,
  type StepProps,
} from "@/components/fit/fit-steps";
import { FitGenerating } from "@/components/fit/fit-generating";
import { FitPlanPreview } from "@/components/fit/fit-plan-preview";
import { FitSummary } from "@/components/fit/fit-summary";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/use-auth";
import { useFitProfile } from "@/hooks/use-fit-profile";
import { clearFitDraft, readFitDraft, saveFitDraft } from "@/lib/fit-draft";
import {
  fitFormError,
  fitGoalFromNutri,
  INITIAL_FIT_FORM,
  toFitProfile,
  type FitForm,
  type FitProfile,
} from "@/lib/fit-profile";
import type { FitPlan } from "@/lib/fit-plan";
import { generateFitPlan } from "@/services/fit-plan.service";
import { saveFitProfile } from "@/services/fit.service";
import { getNutriProfile } from "@/services/nutri.service";

type StepDef = {
  title: string;
  subtitle: string;
  Body: ComponentType<StepProps>;
  check?: "goal" | "level" | "location";
};

const STEPS: StepDef[] = [
  { title: "Qual é o seu objetivo?", subtitle: "Isso define como o treino é montado.", Body: GoalStep, check: "goal" },
  { title: "Qual é o seu nível?", subtitle: "Seja sincero: dá pra ajustar depois.", Body: LevelStep, check: "level" },
  { title: "Como é a sua rotina?", subtitle: "Quantos dias e quanto tempo você consegue treinar.", Body: RoutineStep },
  { title: "Onde você treina?", subtitle: "Marque o que você tem à disposição.", Body: LocationStep, check: "location" },
  { title: "Alguma limitação?", subtitle: "Evitamos exercícios que sobrecarregam essas regiões.", Body: LimitationsStep },
];
const REVIEW = STEPS.length;
const EDIT_STEP: Record<string, number> = { Objetivo: 0, Nível: 1, Rotina: 2, Local: 3, Equipamentos: 3, Limitações: 4 };

type WizardInit = { step: number; data: FitForm; fromNutri: boolean };

function initialState(userId: string, saved: FitProfile | null): WizardInit {
  const draft = readFitDraft(userId);
  if (draft) return { ...draft, step: Math.min(draft.step, REVIEW), fromNutri: false };
  if (saved) return { step: REVIEW, data: saved, fromNutri: false };
  const nutri = getNutriProfile();
  const goal = nutri ? fitGoalFromNutri(nutri.goal) : null;
  return { step: 0, data: { ...INITIAL_FIT_FORM, goal }, fromNutri: goal !== null };
}

function Loader() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <Loader2Icon className="size-6 animate-spin text-brl-purple" aria-label="Carregando" />
    </div>
  );
}

function Success({ plan }: { plan: FitPlan }) {
  return (
    <div className="flex flex-col gap-6" role="status">
      <div className="flex items-center gap-3">
        <CheckCircle2Icon aria-hidden className="size-8 text-emerald-400" />
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Seu plano está pronto</h1>
      </div>
      <p className="text-sm text-muted-foreground">Essa é a sua semana de treino, montada a partir do seu perfil.</p>
      <FitPlanPreview plan={plan} />
      <Button render={<Link href="/fit/app" />} nativeButton={false} className="h-12">
        Abrir o BRL Fit
      </Button>
      <Button render={<Link href="/fit/perfil" />} nativeButton={false} variant="outline" className="h-12">
        Editar perfil
      </Button>
    </div>
  );
}

function useWizardState(userId: string, saved: FitProfile | null) {
  const [{ step, data, fromNutri }, setState] = useState(() => initialState(userId, saved));
  const [error, setError] = useState<string | null>(null);
  const go = (nextStep: number, nextData = data) => {
    setState({ step: nextStep, data: nextData, fromNutri });
    saveFitDraft({ userId, step: nextStep, data: nextData });
    setError(null);
  };
  const patch: StepProps["patch"] = (changes) => go(step, { ...data, ...changes });
  const update: StepProps["update"] = (key, value) => patch({ [key]: value });
  const next = () => {
    const check = STEPS[step]?.check;
    const problem = check ? fitFormError(data, check) : null;
    if (problem) setError(problem);
    else go(step + 1);
  };
  return { step, data, error, setError, go, update, patch, next, nutriNote: fromNutri && step === 0 };
}

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function useSave(data: FitForm, setError: (e: string | null) => void) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<FitPlan | null>(null);
  const submit = async () => {
    const profile = toFitProfile(data);
    if (!profile) return setError(fitFormError(data, "all"));
    setSaving(true);
    try {
      await saveFitProfile(profile);
      clearFitDraft();
      // Segura a tela de "gerando" por um tempo mínimo pra a animação respirar.
      const minDelay = new Promise((resolve) => setTimeout(resolve, prefersReducedMotion() ? 500 : 2000));
      const [plan] = await Promise.all([generateFitPlan(), minDelay]);
      setDone(plan);
    } catch (e) {
      toast({ variant: "error", title: "Não foi possível gerar o plano", description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };
  return { saving, done, submit };
}

function StepBody({ w }: { w: ReturnType<typeof useWizardState> }) {
  const current = STEPS[w.step];
  const profile = toFitProfile(w.data);
  return (
    <>
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-balance md:text-3xl">
        {current ? current.title : "Revise seu perfil"}
      </h1>
      <p className="mt-2 mb-7 text-sm text-muted-foreground md:text-base">
        {current ? current.subtitle : "Confira as respostas. Toque em Editar pra mudar algo."}
      </p>
      {w.nutriNote ? (
        <p className="mb-4 rounded-xl bg-brl-purple/10 p-3 text-sm text-muted-foreground">
          Puxamos do seu perfil do Nutri — confirme ou troque.
        </p>
      ) : null}
      {current ? <current.Body data={w.data} update={w.update} patch={w.patch} /> : null}
      {!current && profile ? <FitSummary profile={profile} onEdit={(l) => w.go(EDIT_STEP[l] ?? 0)} /> : null}
      {w.error ? (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {w.error}
        </p>
      ) : null}
    </>
  );
}

function Wizard({ userId, saved }: { userId: string; saved: FitProfile | null }) {
  const w = useWizardState(userId, saved);
  const { saving, done, submit } = useSave(w.data, w.setError);
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 pt-6 md:px-6">
        <Link href="/fit/app" className="font-display text-lg font-extrabold tracking-tight" aria-label="BRL Fit">
          <span className="text-brl-purple">BRL</span> Fit
        </Link>
        {done || saving ? null : (
          <span className="text-xs font-medium text-muted-foreground tabular-nums">
            Passo {w.step + 1} de {REVIEW + 1}
          </span>
        )}
      </header>
      {done || saving ? null : <Progress value={((w.step + 1) / (REVIEW + 1)) * 100} />}
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8 md:px-6 md:py-10">
        {done ? (
          <Success plan={done} />
        ) : saving ? (
          <FitGenerating />
        ) : (
          <>
            <StepBody w={w} />
            <Nav step={w.step} saving={saving} onBack={() => w.go(w.step - 1)} onNext={w.next} onSave={submit} />
          </>
        )}
      </main>
    </div>
  );
}

function Progress({ value }: { value: number }) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-4 md:px-6">
      <div className="h-1.5 overflow-hidden rounded-full bg-foreground/8" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-brl-purple transition-[width] duration-500 ease-out" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

type NavProps = { step: number; saving: boolean; onBack: () => void; onNext: () => void; onSave: () => void };

function Nav({ step, saving, onBack, onNext, onSave }: NavProps) {
  const last = step === REVIEW;
  return (
    <div className="mt-8 flex gap-3">
      {step > 0 ? (
        <Button type="button" variant="outline" className="h-12 px-5" onClick={onBack} disabled={saving}>
          <ArrowLeftIcon aria-hidden /> Voltar
        </Button>
      ) : null}
      <Button type="button" className="h-12 flex-1" onClick={last ? onSave : onNext} disabled={saving}>
        {saving ? <Loader2Icon aria-hidden className="animate-spin" /> : null}
        {last ? "Salvar perfil" : "Continuar"}
        {last ? null : <ArrowRightIcon aria-hidden />}
      </Button>
    </div>
  );
}

export function FitOnboarding() {
  const saved = useFitProfile();
  const { user } = useAuth();
  if (saved === undefined || !user) return <Loader />;
  return <Wizard userId={user.id} saved={saved} />;
}
