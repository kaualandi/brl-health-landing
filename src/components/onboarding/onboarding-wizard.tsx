"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { animate } from "animejs";
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  Loader2Icon,
  SparklesIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";

import { PlanSummary } from "@/components/nutri/plan-summary";
import { OptionCard } from "@/components/onboarding/option-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { computeNutriPlan } from "@/lib/nutri-plan";
import {
  ACTIVITY_OPTIONS,
  DIET_OPTIONS,
  GOAL_OPTIONS,
  MEALS_OPTIONS,
  RESTRICTION_OPTIONS,
  SEX_OPTIONS,
} from "@/lib/nutri-options";
import { completeOnboarding } from "@/services/nutri.service";
import { cn } from "@/lib/utils";
import type {
  ActivityLevel,
  BiologicalSex,
  DietStyle,
  Goal,
  NutriProfile,
  Restriction,
} from "@/types";

type WizardData = {
  name: string;
  email: string;
  password: string;
  sex: BiologicalSex | null;
  age: string;
  heightCm: string;
  weightKg: string;
  goal: Goal | null;
  activity: ActivityLevel | null;
  diet: DietStyle | null;
  restrictions: Restriction[];
  mealsPerDay: number | null;
  waterGlasses: string;
};

const INITIAL: WizardData = {
  name: "",
  email: "",
  password: "",
  sex: null,
  age: "",
  heightCm: "",
  weightKg: "",
  goal: null,
  activity: null,
  diet: null,
  restrictions: [],
  mealsPerDay: null,
  waterGlasses: "",
};

const STEPS = [
  {
    id: "account",
    title: "Bora criar sua conta",
    subtitle: "Um cadastro só, pro ecossistema BRL inteiro.",
  },
  {
    id: "body",
    title: "Conta um pouco sobre você",
    subtitle: "É o que usamos pra calcular seu gasto de energia.",
  },
  {
    id: "goal",
    title: "Qual é o seu objetivo?",
    subtitle: "Pode mudar depois — a gente se adapta com você.",
  },
  {
    id: "activity",
    title: "Como é a sua rotina de treino?",
    subtitle: "Seja honesto. É isso que ajusta suas calorias.",
  },
  {
    id: "diet",
    title: "Qual seu estilo de alimentação?",
    subtitle: "Pra sugerir refeições que fazem sentido pra você.",
  },
  {
    id: "restrictions",
    title: "Tem alguma restrição?",
    subtitle: "Marque tudo que se aplica. A gente respeita.",
  },
  {
    id: "routine",
    title: "Como é o seu dia a dia?",
    subtitle: "Pra encaixar o plano na sua vida real.",
  },
  {
    id: "review",
    title: "Seu plano está pronto 🎉",
    subtitle: "Olha só o que montamos a partir das suas respostas.",
  },
] as const;

const accountSchema = z.object({
  name: z.string().min(2, "Conta seu nome pra gente"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-1.5 text-xs font-medium text-destructive">
      {children}
    </p>
  );
}

function NumberField({
  id,
  label,
  suffix,
  placeholder,
  value,
  error,
  onChange,
}: {
  id: string;
  label: string;
  suffix: string;
  placeholder: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative mt-2">
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          className="h-12 pr-12 text-base"
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
          {suffix}
        </span>
      </div>
      <FieldError>{error}</FieldError>
    </div>
  );
}

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const contentRef = useRef<HTMLDivElement | null>(null);
  const directionRef = useRef(1);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  useEffect(() => {
    const el = contentRef.current;
    if (!el || prefersReducedMotion()) return;
    const anim = animate(el, {
      opacity: [0, 1],
      translateX: [directionRef.current * 28, 0],
      duration: 350,
      ease: "outQuad",
    });
    return () => {
      anim.cancel();
    };
  }, [step]);

  function update<K extends keyof WizardData>(key: K, value: WizardData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key as string]) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  }

  function toggleRestriction(value: Restriction) {
    setData((prev) => {
      if (value === "none") return { ...prev, restrictions: ["none"] };
      const without = prev.restrictions.filter((r) => r !== "none");
      const next = without.includes(value)
        ? without.filter((r) => r !== value)
        : [...without, value];
      return { ...prev, restrictions: next };
    });
    setErrors((prev) => {
      if (!prev.restrictions) return prev;
      const next = { ...prev };
      delete next.restrictions;
      return next;
    });
  }

  function validateStep(): boolean {
    const next: Record<string, string> = {};

    if (current.id === "account") {
      const result = accountSchema.safeParse({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      if (!result.success) {
        for (const issue of result.error.issues) {
          const field = issue.path[0];
          if (typeof field === "string" && !next[field]) {
            next[field] = issue.message;
          }
        }
      }
    }

    if (current.id === "body") {
      if (!data.sex) next.sex = "Selecione uma opção";
      const age = Number(data.age);
      const height = Number(data.heightCm);
      const weight = Number(data.weightKg);
      if (!data.age || age < 14 || age > 100)
        next.age = "Idade entre 14 e 100";
      if (!data.heightCm || height < 120 || height > 230)
        next.heightCm = "Altura entre 120 e 230 cm";
      if (!data.weightKg || weight < 35 || weight > 250)
        next.weightKg = "Peso entre 35 e 250 kg";
    }

    if (current.id === "goal" && !data.goal) next.goal = "Escolha um objetivo";
    if (current.id === "activity" && !data.activity)
      next.activity = "Escolha um nível";
    if (current.id === "diet" && !data.diet) next.diet = "Escolha um estilo";
    if (current.id === "restrictions" && data.restrictions.length === 0)
      next.restrictions = "Marque ao menos uma opção (ou ‘Nenhuma’)";
    if (current.id === "routine") {
      if (!data.mealsPerDay) next.mealsPerDay = "Escolha quantas refeições";
      const glasses = Number(data.waterGlasses);
      if (!data.waterGlasses || glasses < 0 || glasses > 25)
        next.waterGlasses = "Entre 0 e 25 copos";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function goNext() {
    if (!validateStep()) return;
    directionRef.current = 1;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    directionRef.current = -1;
    setStep((s) => Math.max(s - 1, 0));
  }

  const profile = useMemo<NutriProfile | null>(() => {
    if (
      !data.sex ||
      !data.goal ||
      !data.activity ||
      !data.diet ||
      !data.mealsPerDay
    ) {
      return null;
    }
    return {
      name: data.name,
      email: data.email,
      sex: data.sex,
      age: Number(data.age),
      heightCm: Number(data.heightCm),
      weightKg: Number(data.weightKg),
      goal: data.goal,
      activity: data.activity,
      diet: data.diet,
      restrictions: data.restrictions,
      mealsPerDay: data.mealsPerDay,
      waterGlasses: Number(data.waterGlasses),
      createdAt: "",
    };
  }, [data]);

  const plan = useMemo(
    () => (profile ? computeNutriPlan(profile) : null),
    [profile],
  );

  async function handleSubmit() {
    if (!profile) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await completeOnboarding({
        name: profile.name,
        email: profile.email,
        password: data.password,
        sex: profile.sex,
        age: profile.age,
        heightCm: profile.heightCm,
        weightKg: profile.weightKg,
        goal: profile.goal,
        activity: profile.activity,
        diet: profile.diet,
        restrictions: profile.restrictions,
        mealsPerDay: profile.mealsPerDay,
        waterGlasses: profile.waterGlasses,
      });
      router.push("/nutri");
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Algo deu errado.",
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-brl-dark">
      <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 pt-6 md:px-6">
        <Link
          href="/"
          className="font-display text-lg font-extrabold tracking-tight"
          aria-label="BRL Health — página inicial"
        >
          <span className="text-brl-purple">BRL</span>
          <span className="text-foreground"> Nutri</span>
        </Link>
        <span className="text-xs font-medium text-muted-foreground tabular-nums">
          Passo {step + 1} de {STEPS.length}
        </span>
      </header>

      <div className="mx-auto w-full max-w-2xl px-4 pt-4 md:px-6">
        <div
          className="h-1.5 overflow-hidden rounded-full bg-white/8"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-brl-purple transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8 md:px-6 md:py-10">
        <div ref={contentRef} className="flex flex-1 flex-col">
          <div className="mb-7">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-balance md:text-3xl">
              {current.title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              {current.subtitle}
            </p>
          </div>

          {current.id === "account" ? (
            <div className="flex flex-col gap-5">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Como podemos te chamar?"
                  value={data.name}
                  onChange={(event) => update("name", event.target.value)}
                  aria-invalid={Boolean(errors.name)}
                  className="mt-2 h-12 text-base"
                />
                <FieldError>{errors.name}</FieldError>
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@brl.com"
                  value={data.email}
                  onChange={(event) => update("email", event.target.value)}
                  aria-invalid={Boolean(errors.email)}
                  className="mt-2 h-12 text-base"
                />
                <FieldError>{errors.email}</FieldError>
              </div>
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  value={data.password}
                  onChange={(event) => update("password", event.target.value)}
                  aria-invalid={Boolean(errors.password)}
                  className="mt-2 h-12 text-base"
                />
                <FieldError>{errors.password}</FieldError>
              </div>
            </div>
          ) : null}

          {current.id === "body" ? (
            <div className="flex flex-col gap-5">
              <div>
                <Label>Sexo biológico</Label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  {SEX_OPTIONS.map((option) => (
                    <OptionCard
                      key={option.value}
                      emoji={option.emoji}
                      label={option.label}
                      selected={data.sex === option.value}
                      onSelect={() => update("sex", option.value)}
                      compact
                    />
                  ))}
                </div>
                <FieldError>{errors.sex}</FieldError>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <NumberField
                  id="age"
                  label="Idade"
                  suffix="anos"
                  placeholder="28"
                  value={data.age}
                  error={errors.age}
                  onChange={(value) => update("age", value)}
                />
                <NumberField
                  id="height"
                  label="Altura"
                  suffix="cm"
                  placeholder="175"
                  value={data.heightCm}
                  error={errors.heightCm}
                  onChange={(value) => update("heightCm", value)}
                />
                <NumberField
                  id="weight"
                  label="Peso"
                  suffix="kg"
                  placeholder="72"
                  value={data.weightKg}
                  error={errors.weightKg}
                  onChange={(value) => update("weightKg", value)}
                />
              </div>
            </div>
          ) : null}

          {current.id === "goal" ? (
            <div>
              <div className="grid gap-3 sm:grid-cols-2">
                {GOAL_OPTIONS.map((option) => (
                  <OptionCard
                    key={option.value}
                    emoji={option.emoji}
                    label={option.label}
                    description={option.description}
                    selected={data.goal === option.value}
                    onSelect={() => update("goal", option.value)}
                  />
                ))}
              </div>
              <FieldError>{errors.goal}</FieldError>
            </div>
          ) : null}

          {current.id === "activity" ? (
            <div>
              <div className="grid gap-3">
                {ACTIVITY_OPTIONS.map((option) => (
                  <OptionCard
                    key={option.value}
                    emoji={option.emoji}
                    label={option.label}
                    description={option.description}
                    selected={data.activity === option.value}
                    onSelect={() => update("activity", option.value)}
                    compact
                  />
                ))}
              </div>
              <FieldError>{errors.activity}</FieldError>
            </div>
          ) : null}

          {current.id === "diet" ? (
            <div>
              <div className="grid gap-3 sm:grid-cols-2">
                {DIET_OPTIONS.map((option) => (
                  <OptionCard
                    key={option.value}
                    emoji={option.emoji}
                    label={option.label}
                    description={option.description}
                    selected={data.diet === option.value}
                    onSelect={() => update("diet", option.value)}
                  />
                ))}
              </div>
              <FieldError>{errors.diet}</FieldError>
            </div>
          ) : null}

          {current.id === "restrictions" ? (
            <div>
              <div className="grid gap-3 sm:grid-cols-2">
                {RESTRICTION_OPTIONS.map((option) => (
                  <OptionCard
                    key={option.value}
                    emoji={option.emoji}
                    label={option.label}
                    description={option.description}
                    selected={data.restrictions.includes(option.value)}
                    onSelect={() => toggleRestriction(option.value)}
                    compact
                  />
                ))}
              </div>
              <FieldError>{errors.restrictions}</FieldError>
            </div>
          ) : null}

          {current.id === "routine" ? (
            <div className="flex flex-col gap-6">
              <div>
                <Label>Quantas refeições por dia?</Label>
                <div className="mt-2 grid grid-cols-4 gap-3">
                  {MEALS_OPTIONS.map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => update("mealsPerDay", count)}
                      aria-pressed={data.mealsPerDay === count}
                      className={cn(
                        "flex h-16 flex-col items-center justify-center rounded-2xl border bg-brl-card font-display text-2xl font-bold transition-all duration-200 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px",
                        data.mealsPerDay === count
                          ? "border-brl-purple/60 bg-brl-purple/10 text-foreground shadow-[0_0_0_1px_rgba(150,86,161,0.5)]"
                          : "border-white/8 text-muted-foreground hover:border-brl-purple/50",
                      )}
                    >
                      {count}
                    </button>
                  ))}
                </div>
                <FieldError>{errors.mealsPerDay}</FieldError>
              </div>
              <div className="max-w-xs">
                <NumberField
                  id="water"
                  label="Quantos copos de água por dia hoje?"
                  suffix="copos"
                  placeholder="6"
                  value={data.waterGlasses}
                  error={errors.waterGlasses}
                  onChange={(value) => update("waterGlasses", value)}
                />
              </div>
            </div>
          ) : null}

          {current.id === "review" && plan ? (
            <div className="flex flex-col gap-5">
              <PlanSummary plan={plan} />
              {submitError ? (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
                >
                  <AlertCircleIcon
                    aria-hidden
                    className="mt-0.5 size-4 shrink-0"
                  />
                  <span>{submitError}</span>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mt-8 flex items-center gap-3">
          <Button
            variant="ghost"
            size="lg"
            nativeButton={false}
            className="h-12 px-3 text-muted-foreground hover:text-foreground"
            disabled={submitting}
            render={
              step === 0 ? (
                <Link href="/" aria-label="Voltar para a tela inicial">
                  <ArrowLeftIcon />
                  Voltar
                </Link>
              ) : (
                <button type="button" onClick={goBack}>
                  <ArrowLeftIcon />
                  Voltar
                </button>
              )
            }
          />

          {isLast ? (
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={submitting}
              className="ml-auto h-12 bg-brl-purple px-6 text-base text-white hover:bg-brl-purple/90"
            >
              {submitting ? (
                <>
                  <Loader2Icon className="animate-spin" />
                  Criando seu plano...
                </>
              ) : (
                <>
                  <SparklesIcon />
                  Criar conta e ver meu BRL Nutri
                </>
              )}
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={goNext}
              className="ml-auto h-12 bg-brl-purple px-6 text-base text-white hover:bg-brl-purple/90"
            >
              Continuar
              <ArrowRightIcon />
            </Button>
          )}
        </div>

        {step === 0 ? (
          <p className="mt-5 text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link
              href="/login"
              className="font-medium text-brl-purple hover:underline"
            >
              Entrar
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}
