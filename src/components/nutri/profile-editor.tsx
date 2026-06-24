"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, Loader2Icon, SaveIcon } from "lucide-react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { PlanSummary } from "@/components/nutri/plan-summary";
import { OptionCard } from "@/components/onboarding/option-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { computeNutriPlan } from "@/lib/nutri-plan";
import {
  ACTIVITY_OPTIONS,
  DIET_OPTIONS,
  GOAL_OPTIONS,
  MEALS_OPTIONS,
  RESTRICTION_OPTIONS,
  SEX_OPTIONS,
} from "@/lib/nutri-options";
import {
  getNutriProfileServerSnapshot,
  getNutriProfileSnapshot,
  saveNutriProfile,
  subscribeNutriProfile,
} from "@/services/nutri.service";
import { cn } from "@/lib/utils";
import type {
  ActivityLevel,
  BiologicalSex,
  DietStyle,
  Goal,
  NutriProfile,
  Restriction,
} from "@/types";

type FormState = {
  sex: BiologicalSex;
  age: string;
  heightCm: string;
  weightKg: string;
  goal: Goal;
  activity: ActivityLevel;
  diet: DietStyle;
  restrictions: Restriction[];
  mealsPerDay: number;
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
    goal: initial.goal,
    activity: initial.activity,
    diet: initial.diet,
    restrictions: initial.restrictions,
    mealsPerDay: initial.mealsPerDay,
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

  function build(): NutriProfile {
    return {
      ...initial,
      sex: state.sex,
      age: Number(state.age),
      heightCm: Number(state.heightCm),
      weightKg: Number(state.weightKg),
      goal: state.goal,
      activity: state.activity,
      diet: state.diet,
      restrictions: state.restrictions,
      mealsPerDay: state.mealsPerDay,
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
      mealsPerDay: state.mealsPerDay,
      waterGlasses: Number(state.waterGlasses),
    });
  }, [state, initial]);

  function handleSave() {
    const age = Number(state.age);
    const height = Number(state.heightCm);
    const weight = Number(state.weightKg);
    const water = Number(state.waterGlasses);
    if (
      age < 14 ||
      age > 100 ||
      height < 120 ||
      height > 230 ||
      weight < 35 ||
      weight > 250 ||
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
    setSaving(true);
    saveNutriProfile(build());
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
              label="Peso"
              suffix="kg"
              value={state.weightKg}
              onChange={(v) => update("weightKg", v)}
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

          <FieldGroup label="Refeições por dia">
            <div className="grid grid-cols-4 gap-3">
              {MEALS_OPTIONS.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => update("mealsPerDay", count)}
                  aria-pressed={state.mealsPerDay === count}
                  className={cn(
                    "flex h-16 items-center justify-center rounded-2xl border bg-brl-card font-display text-2xl font-bold transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    state.mealsPerDay === count
                      ? "border-brl-purple/60 bg-brl-purple/10 text-foreground"
                      : "border-white/8 text-muted-foreground hover:border-brl-purple/50",
                  )}
                >
                  {count}
                </button>
              ))}
            </div>
          </FieldGroup>

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
