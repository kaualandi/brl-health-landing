"use client";

import Link from "next/link";
import { ArrowRightIcon, SparklesIcon } from "lucide-react";
import { useState } from "react";

import { OptionCard } from "@/components/onboarding/option-card";
import { PlanSummary } from "@/components/nutri/plan-summary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { computeNutriPlan } from "@/lib/nutri-plan";
import {
  ACTIVITY_OPTIONS,
  GOAL_OPTIONS,
  SEX_OPTIONS,
} from "@/lib/nutri-options";
import type {
  ActivityLevel,
  BiologicalSex,
  Goal,
  NutriProfile,
} from "@/types";

function NumberField({
  id,
  label,
  suffix,
  value,
  onChange,
  min,
  max,
}: {
  id: string;
  label: string;
  suffix: string;
  value: string;
  onChange: (value: string) => void;
  min: number;
  max: number;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-foreground"
      >
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 pr-12"
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
          {suffix}
        </span>
      </div>
    </div>
  );
}

export function CalculatorForm() {
  const [sex, setSex] = useState<BiologicalSex>("male");
  const [activity, setActivity] = useState<ActivityLevel>("moderate");
  const [goal, setGoal] = useState<Goal>("lose");
  const [age, setAge] = useState("30");
  const [heightCm, setHeightCm] = useState("175");
  const [weightKg, setWeightKg] = useState("75");

  const ageN = Number(age);
  const heightN = Number(heightCm);
  const weightN = Number(weightKg.replace(",", "."));

  const valid =
    Number.isFinite(ageN) &&
    ageN >= 14 &&
    ageN <= 100 &&
    Number.isFinite(heightN) &&
    heightN >= 120 &&
    heightN <= 230 &&
    Number.isFinite(weightN) &&
    weightN >= 35 &&
    weightN <= 250;

  const plan = valid
    ? computeNutriPlan({
        name: "",
        email: "",
        sex,
        age: ageN,
        heightCm: heightN,
        weightKg: weightN,
        goal,
        activity,
        diet: "omnivore",
        restrictions: ["none"],
        mealsPerDay: 4,
        waterGlasses: 8,
        createdAt: "",
      } satisfies NutriProfile)
    : null;

  return (
    <div className="flex flex-col gap-8">
      {/* Formulário */}
      <div className="rounded-2xl border border-white/5 bg-brl-card p-6 md:p-8">
        <div className="flex flex-col gap-6">
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Sexo</p>
            <div className="grid grid-cols-2 gap-3">
              {SEX_OPTIONS.map((option) => (
                <OptionCard
                  key={option.value}
                  compact
                  emoji={option.emoji}
                  label={option.label}
                  selected={sex === option.value}
                  onSelect={() => setSex(option.value)}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <NumberField
              id="calc-age"
              label="Idade"
              suffix="anos"
              value={age}
              onChange={setAge}
              min={14}
              max={100}
            />
            <NumberField
              id="calc-height"
              label="Altura"
              suffix="cm"
              value={heightCm}
              onChange={setHeightCm}
              min={120}
              max={230}
            />
            <NumberField
              id="calc-weight"
              label="Peso"
              suffix="kg"
              value={weightKg}
              onChange={setWeightKg}
              min={35}
              max={250}
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">
              Nível de atividade
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {ACTIVITY_OPTIONS.map((option) => (
                <OptionCard
                  key={option.value}
                  compact
                  emoji={option.emoji}
                  label={option.label}
                  description={option.description}
                  selected={activity === option.value}
                  onSelect={() => setActivity(option.value)}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Objetivo</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {GOAL_OPTIONS.map((option) => (
                <OptionCard
                  key={option.value}
                  compact
                  emoji={option.emoji}
                  label={option.label}
                  description={option.description}
                  selected={goal === option.value}
                  onSelect={() => setGoal(option.value)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Resultado */}
      <div>
        <div className="mb-5">
          <p className="text-xs font-medium tracking-wide text-brl-purple uppercase">
            Seu resultado
          </p>
          <h2 className="mt-1.5 font-display text-2xl font-extrabold tracking-tight md:text-3xl">
            Suas metas estimadas
          </h2>
        </div>

        {plan ? (
          <>
            <PlanSummary plan={plan} />
            <p className="mt-4 text-xs text-muted-foreground">
              Estimativa por Mifflin-St Jeor (gasto) e IMC. É um ponto de partida
              — o plano completo ajusta refeições, alimentos e horários ao seu
              dia.
            </p>

            <div
              className="mt-8 overflow-hidden rounded-2xl border border-white/5 p-7 md:p-8"
              style={{
                background:
                  "linear-gradient(135deg, #13131f 0%, rgba(150,86,161,0.22) 100%)",
              }}
            >
              <h3 className="font-display text-xl font-extrabold tracking-tight md:text-2xl">
                Quer isso virando um plano de verdade?
              </h3>
              <p className="mt-2 text-sm text-muted-foreground md:text-base">
                Crie sua conta grátis e o BRL Nutri monta o cardápio com essas
                metas — alimentos, porções e horários.
              </p>
              <Button
                size="lg"
                nativeButton={false}
                className="mt-5 h-12 bg-brl-purple px-6 text-base text-white hover:bg-brl-purple/90"
                render={
                  <Link href="/cadastro">
                    <SparklesIcon />
                    Montar meu plano grátis
                    <ArrowRightIcon />
                  </Link>
                }
              />
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-sm text-muted-foreground">
            Preencha idade (14–100), altura (120–230 cm) e peso (35–250 kg) pra
            ver suas metas.
          </div>
        )}
      </div>
    </div>
  );
}
