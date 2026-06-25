"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { animate } from "animejs";
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  EyeIcon,
  EyeOffIcon,
  Loader2Icon,
  SparklesIcon,
  WandSparklesIcon,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { z } from "zod";

import { PasswordStrength } from "@/components/forms/password-strength";
import { OptionCard } from "@/components/onboarding/option-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import {
  ACTIVITY_OPTIONS,
  activityLabel,
  DIET_OPTIONS,
  dietLabel,
  GOAL_OPTIONS,
  goalLabel,
  RESTRICTION_OPTIONS,
  restrictionLabel,
  SEX_OPTIONS,
} from "@/lib/nutri-options";
import {
  autoScheduleMeals,
  defaultRoutine,
  defaultSchedule,
  MEAL_OPTIONS,
  needsTrainTime,
} from "@/lib/meals";
import {
  completeOnboarding,
  getNutriProfileServerSnapshot,
  getNutriProfileSnapshot,
  saveNutriProfileForCurrentUser,
  subscribeNutriProfile,
} from "@/services/nutri.service";
import { cn } from "@/lib/utils";
import type {
  ActivityLevel,
  BiologicalSex,
  DietStyle,
  Goal,
  MealEntry,
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
  goalWeightKg: string;
  goal: Goal | null;
  activity: ActivityLevel | null;
  diet: DietStyle | null;
  restrictions: Restriction[];
  meals: MealEntry[];
  wakeTime: string;
  sleepTime: string;
  trainTime: string;
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
  goalWeightKg: "",
  goal: null,
  activity: null,
  diet: null,
  restrictions: [],
  meals: defaultSchedule(),
  wakeTime: defaultRoutine().wakeTime,
  sleepTime: defaultRoutine().sleepTime,
  trainTime: "",
  waterGlasses: "",
};

const ALL_STEPS = [
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
    title: "Hora de personalizar seu cardápio",
    subtitle: "Confere se está tudo certo — pode editar qualquer coisa antes de gerar.",
  },
] as const;

const GEN_MESSAGES = [
  "Analisando seu perfil...",
  "Calculando calorias e macros...",
  "Montando suas refeições...",
  "Encaixando os horários na sua rotina...",
  "Finalizando seu cardápio ✨",
];

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

function TimeField({
  id,
  label,
  value,
  optional,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  optional?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
        {optional ? (
          <span className="ml-1 font-normal text-muted-foreground/60">
            (opcional)
          </span>
        ) : null}
      </Label>
      <input
        id={id}
        type="time"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-12 w-full rounded-lg border border-input bg-transparent px-3 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
    </div>
  );
}

function GeneratingScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-brl-dark px-6 text-center">
      <div className="relative mb-8">
        <span
          aria-hidden
          className="absolute inset-0 -z-10 animate-ping rounded-full bg-brl-purple/20 motion-reduce:hidden"
        />
        <span
          aria-hidden
          className="flex size-24 items-center justify-center rounded-full bg-brl-purple/15 text-5xl ring-1 ring-brl-purple/30"
        >
          🤖
        </span>
      </div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">
        Gerando seu cardápio
      </h1>
      <p
        aria-live="polite"
        className="mt-3 h-5 text-sm text-muted-foreground md:text-base"
      >
        {message}
      </p>
      <div aria-hidden className="mt-8 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-2 animate-bounce rounded-full bg-brl-purple motion-reduce:animate-none"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

function SummaryCard({
  emoji,
  title,
  onEdit,
  children,
}: {
  emoji: string;
  title: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-brl-card p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <span aria-hidden>{emoji}</span>
          {title}
        </h3>
        <button
          type="button"
          onClick={onEdit}
          className="rounded text-xs font-semibold text-brl-purple outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Editar
        </button>
      </div>
      <dl className="flex flex-col gap-1">{children}</dl>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}

export function OnboardingWizard() {
  const router = useRouter();
  const { user, isAuthenticated, status } = useAuth();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [genMsg, setGenMsg] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const contentRef = useRef<HTMLDivElement | null>(null);
  const directionRef = useRef(1);

  // Plano que já existe (undefined = ainda lendo, null = sem plano).
  const existingProfile = useSyncExternalStore(
    subscribeNutriProfile,
    getNutriProfileSnapshot,
    getNutriProfileServerSnapshot,
  );

  // Já tem plano? Não refaz o onboarding à toa — vai direto pro /nutri.
  // (O "refazer" limpa o plano antes, então cai no wizard normalmente.)
  // Durante a geração o perfil é salvo, mas a navegação fica por conta do
  // handleSubmit (depois da animação) — por isso ignoramos enquanto generating.
  useEffect(() => {
    if (isAuthenticated && existingProfile && !generating) {
      router.replace("/nutri");
    }
  }, [isAuthenticated, existingProfile, router, generating]);

  // Já logado? Pula a etapa de criar conta — não pede credencial de novo.
  const steps = useMemo(
    () => (isAuthenticated ? ALL_STEPS.filter((s) => s.id !== "account") : ALL_STEPS),
    [isAuthenticated],
  );

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const progress = ((step + 1) / steps.length) * 100;

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

  // Mensagens rotativas enquanto "gera" o cardápio (parado se reduced-motion).
  useEffect(() => {
    if (!generating || prefersReducedMotion()) return;
    const id = setInterval(() => {
      setGenMsg((i) => Math.min(i + 1, GEN_MESSAGES.length - 1));
    }, 520);
    return () => clearInterval(id);
  }, [generating]);

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

  function toggleMeal(name: string) {
    setData((prev) => {
      const exists = prev.meals.some((m) => m.name === name);
      if (exists) {
        return { ...prev, meals: prev.meals.filter((m) => m.name !== name) };
      }
      const option = MEAL_OPTIONS.find((o) => o.name === name);
      return {
        ...prev,
        meals: [...prev.meals, { name, time: option?.defaultTime ?? "12:00" }],
      };
    });
    setErrors((prev) => {
      if (!prev.meals) return prev;
      const next = { ...prev };
      delete next.meals;
      return next;
    });
  }

  function setMealTime(name: string, time: string) {
    setData((prev) => ({
      ...prev,
      meals: prev.meals.map((m) => (m.name === name ? { ...m, time } : m)),
    }));
  }

  function applyAutoTiming() {
    setData((prev) => ({
      ...prev,
      meals: autoScheduleMeals(prev.meals, {
        wakeTime: prev.wakeTime,
        sleepTime: prev.sleepTime,
        trainTime: prev.trainTime,
      }),
    }));
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
      const goalWeight = Number(data.goalWeightKg);
      if (!data.goalWeightKg || goalWeight < 35 || goalWeight > 250)
        next.goalWeightKg = "Meta entre 35 e 250 kg";
    }

    if (current.id === "goal" && !data.goal) next.goal = "Escolha um objetivo";
    if (current.id === "activity" && !data.activity)
      next.activity = "Escolha um nível";
    if (current.id === "diet" && !data.diet) next.diet = "Escolha um estilo";
    if (current.id === "restrictions" && data.restrictions.length === 0)
      next.restrictions = "Marque ao menos uma opção (ou ‘Nenhuma’)";
    if (current.id === "routine") {
      if (data.meals.length === 0)
        next.meals = "Escolha pelo menos uma refeição";
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
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }

  function goBack() {
    directionRef.current = -1;
    setStep((s) => Math.max(s - 1, 0));
  }

  function goToStep(id: string) {
    const idx = steps.findIndex((s) => s.id === id);
    if (idx < 0) return;
    directionRef.current = idx < step ? -1 : 1;
    setStep(idx);
  }

  const profile = useMemo<NutriProfile | null>(() => {
    if (
      !data.sex ||
      !data.goal ||
      !data.activity ||
      !data.diet ||
      data.meals.length === 0
    ) {
      return null;
    }
    return {
      // Logado pula o passo de conta — usa nome/e-mail da sessão.
      name: data.name || user?.name || "",
      email: data.email || user?.email || "",
      sex: data.sex,
      age: Number(data.age),
      heightCm: Number(data.heightCm),
      weightKg: Number(data.weightKg),
      goalWeightKg: Number(data.goalWeightKg),
      goal: data.goal,
      activity: data.activity,
      diet: data.diet,
      restrictions: data.restrictions,
      mealsPerDay: data.meals.length,
      meals: data.meals,
      wakeTime: data.wakeTime,
      sleepTime: data.sleepTime,
      trainTime: data.trainTime || undefined,
      waterGlasses: Number(data.waterGlasses),
      createdAt: "",
    };
  }, [data, user]);

  async function handleSubmit() {
    if (!profile) return;
    setSubmitError(null);
    setGenMsg(0);
    setGenerating(true);
    // Segura a tela de "gerando" por um tempo mínimo pra a animação respirar.
    const minDelay = new Promise((resolve) =>
      setTimeout(resolve, prefersReducedMotion() ? 500 : 2400),
    );
    try {
      const work = (async () => {
        if (isAuthenticated) {
          // Já tem conta — só salva o plano, sem registrar de novo.
          const { createdAt: _omit, ...profileInput } = profile;
          void _omit;
          saveNutriProfileForCurrentUser(profileInput);
        } else {
          await completeOnboarding({
            name: profile.name,
            email: profile.email,
            password: data.password,
            sex: profile.sex,
            age: profile.age,
            heightCm: profile.heightCm,
            weightKg: profile.weightKg,
            goalWeightKg: profile.goalWeightKg,
            goal: profile.goal,
            activity: profile.activity,
            diet: profile.diet,
            restrictions: profile.restrictions,
            mealsPerDay: profile.mealsPerDay,
            meals: profile.meals,
            wakeTime: profile.wakeTime,
            sleepTime: profile.sleepTime,
            trainTime: profile.trainTime,
            waterGlasses: profile.waterGlasses,
          });
        }
      })();
      await Promise.all([work, minDelay]);
      router.push("/nutri");
    } catch (error) {
      setGenerating(false);
      setSubmitError(
        error instanceof Error ? error.message : "Algo deu errado.",
      );
    }
  }

  // Espera a sessão resolver, e segura a tela se for redirecionar quem já tem
  // plano (existingProfile undefined = lendo, truthy = tem plano → vai pro /nutri).
  // A tela de geração tem precedência: durante ela o perfil já foi salvo, então
  // os guards abaixo (que seguram quem já tem plano) não devem assumir.
  if (generating) {
    const message = prefersReducedMotion()
      ? GEN_MESSAGES[GEN_MESSAGES.length - 1]
      : GEN_MESSAGES[genMsg];
    return <GeneratingScreen message={message} />;
  }

  if (status === "loading" || (isAuthenticated && existingProfile !== null)) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-brl-dark">
        <Loader2Icon className="size-6 animate-spin text-brl-purple" />
      </div>
    );
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
          Passo {step + 1} de {steps.length}
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
                <div className="relative mt-2">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Mínimo 6 caracteres"
                    value={data.password}
                    onChange={(event) => update("password", event.target.value)}
                    aria-invalid={Boolean(errors.password)}
                    className="h-12 pr-12 text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-lg text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOffIcon className="size-4" />
                    ) : (
                      <EyeIcon className="size-4" />
                    )}
                  </button>
                </div>
                <PasswordStrength value={data.password} />
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
                  label="Peso atual"
                  suffix="kg"
                  placeholder="72"
                  value={data.weightKg}
                  error={errors.weightKg}
                  onChange={(value) => update("weightKg", value)}
                />
              </div>
              <div className="max-w-xs">
                <NumberField
                  id="goalWeight"
                  label="Meta de peso"
                  suffix="kg"
                  placeholder="70"
                  value={data.goalWeightKg}
                  error={errors.goalWeightKg}
                  onChange={(value) => update("goalWeightKg", value)}
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Onde você quer chegar — deixe igual ao atual pra manter.
                </p>
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
                <Label>Seus horários do dia</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  A gente usa pra encaixar as refeições na sua rotina.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <TimeField
                    id="wakeTime"
                    label="Acordo às"
                    value={data.wakeTime}
                    onChange={(value) => update("wakeTime", value)}
                  />
                  <TimeField
                    id="sleepTime"
                    label="Durmo às"
                    value={data.sleepTime}
                    onChange={(value) => update("sleepTime", value)}
                  />
                  <TimeField
                    id="trainTime"
                    label="Treino às"
                    optional
                    value={data.trainTime}
                    onChange={(value) => update("trainTime", value)}
                  />
                </div>
              </div>
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label>Quais refeições você faz? E a que horas?</Label>
                  <button
                    type="button"
                    onClick={applyAutoTiming}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-brl-purple/40 bg-brl-purple/10 px-2.5 py-1.5 text-xs font-semibold text-brl-purple transition-colors outline-none hover:bg-brl-purple/20 focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <WandSparklesIcon className="size-3.5" />
                    Sugerir horários
                  </button>
                </div>
                <div className="mt-2 flex flex-col gap-2.5">
                  {MEAL_OPTIONS.map((option) => {
                    const selected = data.meals.find(
                      (m) => m.name === option.name,
                    );
                    return (
                      <div
                        key={option.name}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border p-3 transition-colors",
                          selected
                            ? "border-brl-purple/50 bg-brl-purple/10"
                            : "border-white/8",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => toggleMeal(option.name)}
                          aria-pressed={Boolean(selected)}
                          className="flex flex-1 items-center gap-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                          <span
                            aria-hidden
                            className={cn(
                              "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                              selected
                                ? "border-brl-purple bg-brl-purple text-white"
                                : "border-white/20",
                            )}
                          >
                            {selected ? "✓" : ""}
                          </span>
                          <span className="text-lg" aria-hidden>
                            {option.emoji}
                          </span>
                          <span className="text-sm font-medium text-foreground md:text-base">
                            {option.name}
                          </span>
                        </button>
                        {selected ? (
                          <input
                            type="time"
                            value={selected.time}
                            onChange={(event) =>
                              setMealTime(option.name, event.target.value)
                            }
                            aria-label={`Horário de ${option.name}`}
                            className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                          />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                {needsTrainTime(data.meals) && !data.trainTime ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    💡 Informe o horário do treino acima pra encaixar o pré e o
                    pós-treino.
                  </p>
                ) : null}
                <FieldError>{errors.meals}</FieldError>
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

          {current.id === "review" ? (
            <div className="flex flex-col gap-3">
              {!isAuthenticated ? (
                <SummaryCard
                  emoji="👤"
                  title="Conta"
                  onEdit={() => goToStep("account")}
                >
                  <SummaryRow label="Nome" value={data.name || "—"} />
                  <SummaryRow label="E-mail" value={data.email || "—"} />
                </SummaryCard>
              ) : null}

              <SummaryCard
                emoji="📏"
                title="Sobre você"
                onEdit={() => goToStep("body")}
              >
                <SummaryRow
                  label="Sexo"
                  value={data.sex === "male" ? "Masculino" : "Feminino"}
                />
                <SummaryRow label="Idade" value={`${data.age} anos`} />
                <SummaryRow label="Altura" value={`${data.heightCm} cm`} />
                <SummaryRow label="Peso atual" value={`${data.weightKg} kg`} />
                <SummaryRow
                  label="Meta de peso"
                  value={`${data.goalWeightKg} kg`}
                />
              </SummaryCard>

              <SummaryCard
                emoji="🎯"
                title="Objetivo"
                onEdit={() => goToStep("goal")}
              >
                <SummaryRow
                  label="Meta"
                  value={data.goal ? goalLabel(data.goal) : "—"}
                />
              </SummaryCard>

              <SummaryCard
                emoji="🏃"
                title="Atividade"
                onEdit={() => goToStep("activity")}
              >
                <SummaryRow
                  label="Nível"
                  value={data.activity ? activityLabel(data.activity) : "—"}
                />
              </SummaryCard>

              <SummaryCard
                emoji="🍽️"
                title="Alimentação"
                onEdit={() => goToStep("diet")}
              >
                <SummaryRow
                  label="Estilo"
                  value={data.diet ? dietLabel(data.diet) : "—"}
                />
              </SummaryCard>

              <SummaryCard
                emoji="🚫"
                title="Restrições"
                onEdit={() => goToStep("restrictions")}
              >
                <SummaryRow
                  label="Evitar"
                  value={
                    data.restrictions.length === 0 ||
                    data.restrictions.includes("none")
                      ? "Nenhuma"
                      : data.restrictions.map(restrictionLabel).join(", ")
                  }
                />
              </SummaryCard>

              <SummaryCard
                emoji="🍴"
                title="Refeições e rotina"
                onEdit={() => goToStep("routine")}
              >
                <SummaryRow label="Acordar" value={data.wakeTime} />
                <SummaryRow label="Dormir" value={data.sleepTime} />
                <SummaryRow
                  label="Treino"
                  value={data.trainTime || "Sem horário fixo"}
                />
                <SummaryRow
                  label="Água"
                  value={`${data.waterGlasses} copos`}
                />
                <div className="mt-1 flex flex-col gap-1 border-t border-white/5 pt-2">
                  {[...data.meals]
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((meal) => (
                      <SummaryRow
                        key={meal.name}
                        label={meal.name}
                        value={meal.time}
                      />
                    ))}
                </div>
              </SummaryCard>

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
            disabled={generating}
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
              disabled={generating}
              className="ml-auto h-12 bg-brl-purple px-6 text-base text-white hover:bg-brl-purple/90"
            >
              <SparklesIcon />
              {isAuthenticated ? "Gerar meu cardápio" : "Criar conta e gerar"}
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

        {step === 0 && !isAuthenticated ? (
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
