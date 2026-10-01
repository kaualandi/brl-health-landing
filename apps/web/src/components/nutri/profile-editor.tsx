"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  Loader2Icon,
  SaveIcon,
  WandSparklesIcon,
} from "lucide-react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { PlanSummary } from "@/components/nutri/plan-summary";
import { OptionCard } from "@/components/onboarding/option-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { computeNutriPlan } from "@/lib/nutri-plan";
import {
  autoScheduleMeals,
  defaultRoutine,
  defaultSchedule,
  MEAL_OPTIONS,
  needsTrainTime,
} from "@/lib/meals";
import {
  ACTIVITY_OPTIONS,
  DIET_OPTIONS,
  GOAL_OPTIONS,
  RESTRICTION_OPTIONS,
  SEX_OPTIONS,
} from "@/lib/nutri-options";
import {
  getNutriProfileServerSnapshot,
  getNutriProfileSnapshot,
  pushNutriProfile,
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

type FormState = {
  sex: BiologicalSex;
  age: string;
  heightCm: string;
  weightKg: string;
  goalWeightKg: string;
  goal: Goal;
  activity: ActivityLevel;
  diet: DietStyle;
  restrictions: Restriction[];
  meals: MealEntry[];
  wakeTime: string;
  sleepTime: string;
  trainTime: string;
  waterGlasses: string;
};

function NumberField({
  id,
  label,
  suffix,
  value,
  onChange,
}: {
  id: string;
  label: string;
  suffix: string;
  value: string;
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
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 pr-12 text-base"
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
          {suffix}
        </span>
      </div>
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

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="mb-3 block">{label}</Label>
      {children}
    </div>
  );
}

function EditorForm({ initial }: { initial: NutriProfile }) {
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<FormState>({
    sex: initial.sex,
    age: String(initial.age),
    heightCm: String(initial.heightCm),
    weightKg: String(initial.weightKg),
    goalWeightKg: String(initial.goalWeightKg ?? initial.weightKg),
    goal: initial.goal,
    activity: initial.activity,
    diet: initial.diet,
    restrictions: initial.restrictions,
    meals: initial.meals ?? defaultSchedule(),
    wakeTime: initial.wakeTime ?? defaultRoutine().wakeTime,
    sleepTime: initial.sleepTime ?? defaultRoutine().sleepTime,
    trainTime: initial.trainTime ?? "",
    waterGlasses: String(initial.waterGlasses),
  });

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  function toggleRestriction(value: Restriction) {
    setState((prev) => {
      if (value === "none") return { ...prev, restrictions: ["none"] };
      const without = prev.restrictions.filter((r) => r !== "none");
      const next = without.includes(value)
        ? without.filter((r) => r !== value)
        : [...without, value];
      return { ...prev, restrictions: next.length ? next : ["none"] };
    });
  }

  function toggleMeal(name: string) {
    setState((prev) => {
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
  }

  function setMealTime(name: string, time: string) {
    setState((prev) => ({
      ...prev,
      meals: prev.meals.map((m) => (m.name === name ? { ...m, time } : m)),
    }));
  }

  function applyAutoTiming() {
    setState((prev) => ({
      ...prev,
      meals: autoScheduleMeals(prev.meals, {
        wakeTime: prev.wakeTime,
        sleepTime: prev.sleepTime,
        trainTime: prev.trainTime,
      }),
    }));
  }

  function build(): NutriProfile {
    return {
      ...initial,
      sex: state.sex,
      age: Number(state.age),
      heightCm: Number(state.heightCm),
      weightKg: Number(state.weightKg),
      goalWeightKg: Number(state.goalWeightKg),
      goal: state.goal,
      activity: state.activity,
      diet: state.diet,
      restrictions: state.restrictions,
      mealsPerDay: state.meals.length,
      meals: state.meals,
      wakeTime: state.wakeTime,
      sleepTime: state.sleepTime,
      trainTime: state.trainTime || undefined,
      waterGlasses: Number(state.waterGlasses),
    };
  }

  const previewPlan = useMemo(() => {
    const age = Number(state.age);
    const height = Number(state.heightCm);
    const weight = Number(state.weightKg);
    if (!age || !height || !weight) return null;
    return computeNutriPlan({
      ...initial,
      sex: state.sex,
      age,
      heightCm: height,
      weightKg: weight,
      goal: state.goal,
      activity: state.activity,
      diet: state.diet,
      restrictions: state.restrictions,
      mealsPerDay: state.meals.length,
      meals: state.meals,
      waterGlasses: Number(state.waterGlasses),
    });
  }, [state, initial]);

  async function handleSave() {
    const age = Number(state.age);
    const height = Number(state.heightCm);
    const weight = Number(state.weightKg);
    const goalWeight = Number(state.goalWeightKg);
    const water = Number(state.waterGlasses);
    if (
      age < 14 ||
      age > 100 ||
      height < 120 ||
      height > 230 ||
      weight < 35 ||
      weight > 250 ||
      goalWeight < 35 ||
      goalWeight > 250 ||
      water < 0 ||
      water > 25
    ) {
      toast({
        variant: "error",
        title: "Confere os campos",
        description: "Tem algum valor fora do intervalo esperado.",
      });
      return;
    }
    if (state.meals.length === 0) {
      toast({
        variant: "error",
        title: "Escolha as refeições",
        description: "Selecione pelo menos uma refeição.",
      });
      return;
    }
    setSaving(true);
    try {
      await pushNutriProfile(build());
    } catch (error) {
      setSaving(false);
      toast({
        variant: "error",
        title: "Não consegui salvar",
        description: error instanceof Error ? error.message : "Tente de novo.",
      });
      return;
    }
    toast({
      variant: "success",
      title: "Perfil atualizado ✅",
      description: "Recalculamos seu plano.",
    });
    router.push("/nutri");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-brl-dark pb-20">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-2xl items-center justify-between px-4 md:px-6">
          <Link
            href="/nutri"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4" />
            Voltar
          </Link>
          <span className="font-display text-lg font-extrabold tracking-tight">
            <span className="text-brl-purple">BRL</span>
            <span className="text-foreground"> Nutri</span>
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 pt-8 md:px-6 md:pt-10">
        <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">
          Editar meus dados
        </h1>
        <p className="mt-2 text-sm text-muted-foreground md:text-base">
          Ajuste o que mudou — a gente recalcula seu plano na hora.
        </p>

        <div className="mt-8 flex flex-col gap-7">
          <FieldGroup label="Sexo biológico">
            <div className="grid grid-cols-2 gap-3">
              {SEX_OPTIONS.map((option) => (
                <OptionCard
                  key={option.value}
                  emoji={option.emoji}
                  label={option.label}
                  selected={state.sex === option.value}
                  onSelect={() => update("sex", option.value)}
                  compact
                />
              ))}
            </div>
          </FieldGroup>

          <div className="grid gap-4 sm:grid-cols-3">
            <NumberField
              id="age"
              label="Idade"
              suffix="anos"
              value={state.age}
              onChange={(v) => update("age", v)}
            />
            <NumberField
              id="height"
              label="Altura"
              suffix="cm"
              value={state.heightCm}
              onChange={(v) => update("heightCm", v)}
            />
            <NumberField
              id="weight"
              label="Peso atual"
              suffix="kg"
              value={state.weightKg}
              onChange={(v) => update("weightKg", v)}
            />
          </div>

          <div className="max-w-xs">
            <NumberField
              id="goalWeight"
              label="Meta de peso"
              suffix="kg"
              value={state.goalWeightKg}
              onChange={(v) => update("goalWeightKg", v)}
            />
          </div>

          <FieldGroup label="Objetivo">
            <div className="grid gap-3 sm:grid-cols-2">
              {GOAL_OPTIONS.map((option) => (
                <OptionCard
                  key={option.value}
                  emoji={option.emoji}
                  label={option.label}
                  description={option.description}
                  selected={state.goal === option.value}
                  onSelect={() => update("goal", option.value)}
                />
              ))}
            </div>
          </FieldGroup>

          <FieldGroup label="Nível de atividade">
            <div className="grid gap-3">
              {ACTIVITY_OPTIONS.map((option) => (
                <OptionCard
                  key={option.value}
                  emoji={option.emoji}
                  label={option.label}
                  description={option.description}
                  selected={state.activity === option.value}
                  onSelect={() => update("activity", option.value)}
                  compact
                />
              ))}
            </div>
          </FieldGroup>

          <FieldGroup label="Estilo de alimentação">
            <div className="grid gap-3 sm:grid-cols-2">
              {DIET_OPTIONS.map((option) => (
                <OptionCard
                  key={option.value}
                  emoji={option.emoji}
                  label={option.label}
                  description={option.description}
                  selected={state.diet === option.value}
                  onSelect={() => update("diet", option.value)}
                />
              ))}
            </div>
          </FieldGroup>

          <FieldGroup label="Restrições">
            <div className="grid gap-3 sm:grid-cols-2">
              {RESTRICTION_OPTIONS.map((option) => (
                <OptionCard
                  key={option.value}
                  emoji={option.emoji}
                  label={option.label}
                  description={option.description}
                  selected={state.restrictions.includes(option.value)}
                  onSelect={() => toggleRestriction(option.value)}
                  compact
                />
              ))}
            </div>
          </FieldGroup>

          <FieldGroup label="Rotina do dia">
            <p className="-mt-1 mb-3 text-xs text-muted-foreground">
              A gente usa pra distribuir as refeições nos melhores horários.
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <TimeField
                id="wakeTime"
                label="Acordo às"
                value={state.wakeTime}
                onChange={(v) => update("wakeTime", v)}
              />
              <TimeField
                id="sleepTime"
                label="Durmo às"
                value={state.sleepTime}
                onChange={(v) => update("sleepTime", v)}
              />
              <TimeField
                id="trainTime"
                label="Treino às"
                optional
                value={state.trainTime}
                onChange={(v) => update("trainTime", v)}
              />
            </div>
          </FieldGroup>

          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <Label className="mb-0">Refeições e horários</Label>
              <button
                type="button"
                onClick={applyAutoTiming}
                className="inline-flex items-center gap-1.5 rounded-lg border border-brl-purple/40 bg-brl-purple/10 px-2.5 py-1.5 text-xs font-semibold text-brl-purple transition-colors outline-none hover:bg-brl-purple/20 focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <WandSparklesIcon className="size-3.5" />
                Sugerir horários
              </button>
            </div>
            <div className="flex flex-col gap-2.5">
              {MEAL_OPTIONS.map((option) => {
                const selected = state.meals.find(
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
                          "flex size-5 shrink-0 items-center justify-center rounded-md border text-xs transition-colors",
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
                      <span className="text-sm font-medium text-foreground">
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
            {needsTrainTime(state.meals) && !state.trainTime ? (
              <p className="mt-2 text-xs text-muted-foreground">
                💡 Informe o horário do treino acima pra encaixar o pré e o
                pós-treino.
              </p>
            ) : null}
          </div>

          <div className="max-w-xs">
            <NumberField
              id="water"
              label="Copos de água por dia"
              suffix="copos"
              value={state.waterGlasses}
              onChange={(v) => update("waterGlasses", v)}
            />
          </div>
        </div>

        {/* Prévia */}
        {previewPlan ? (
          <section className="mt-10">
            <p className="mb-4 text-xs font-medium tracking-wide text-brl-purple uppercase">
              Prévia do seu plano
            </p>
            <PlanSummary plan={previewPlan} />
          </section>
        ) : null}

        <div className="mt-8 flex items-center gap-3">
          <Button
            variant="ghost"
            nativeButton={false}
            className="h-12 text-muted-foreground hover:text-foreground"
            render={<Link href="/nutri">Cancelar</Link>}
          />
          <Button
            onClick={handleSave}
            disabled={saving}
            className="ml-auto h-12 bg-brl-purple px-6 text-base text-white hover:bg-brl-purple/90"
          >
            {saving ? (
              <>
                <Loader2Icon className="animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <SaveIcon />
                Salvar e recalcular
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}

export function ProfileEditor() {
  const router = useRouter();
  const profile = useSyncExternalStore(
    subscribeNutriProfile,
    getNutriProfileSnapshot,
    getNutriProfileServerSnapshot,
  );

  // Sem plano não há o que editar — manda montar um.
  useEffect(() => {
    if (profile === null) router.replace("/cadastro");
  }, [profile, router]);

  if (profile === undefined || profile === null) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-brl-dark">
        <Loader2Icon className="size-6 animate-spin text-brl-purple" />
      </div>
    );
  }

  return <EditorForm initial={profile} />;
}
