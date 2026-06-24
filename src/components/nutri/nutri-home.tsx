"use client";

import Link from "next/link";
import {
  ArrowRightIcon,
  ClockIcon,
  DumbbellIcon,
  Loader2Icon,
  ShoppingCartIcon,
} from "lucide-react";
import { useState, useSyncExternalStore, type ReactNode } from "react";

import { AnimatedSection } from "@/components/animations/animated-section";
import { UserMenu } from "@/components/layout/user-menu";
import { MealDiary } from "@/components/nutri/meal-diary";
import { PlanSummary } from "@/components/nutri/plan-summary";
import { WaterCard } from "@/components/nutri/water-card";
import { WeightCard } from "@/components/nutri/weight-card";
import { UpgradeNudge } from "@/components/plan/upgrade-nudge";
import { Button } from "@/components/ui/button";
import { Confetti } from "@/components/ui/confetti";
import { useAuth } from "@/hooks/use-auth";
import { useHabits } from "@/hooks/use-nutri-tracking";
import { computeNutriPlan } from "@/lib/nutri-plan";
import { curatedArticles, DAILY_HABITS, QUICK_TIPS, recipeForDiet } from "@/lib/nutri-content";
import {
  activityLabel,
  dietLabel,
  goalLabel,
} from "@/lib/nutri-options";
import {
  getNutriProfileServerSnapshot,
  getNutriProfileSnapshot,
  subscribeNutriProfile,
} from "@/services/nutri.service";
import { cn } from "@/lib/utils";
import type { Goal, NutriProfile } from "@/types";

const GOAL_HEADLINE: Record<Goal, string> = {
  lose: "Seu plano foca em perder gordura sem passar fome.",
  recomp: "Vamos trocar gordura por músculo, no seu ritmo.",
  gain: "Hora de construir músculo com um superávit inteligente.",
  performance: "Energia no ponto certo pra render mais no treino.",
  health: "Comer melhor e manter o peso, com leveza.",
};

function NutriBar({ showShopping = false }: { showShopping?: boolean }) {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 md:px-6">
        <Link
          href="/"
          className="font-display text-lg font-extrabold tracking-tight"
          aria-label="BRL Health — página inicial"
        >
          <span className="text-brl-purple">BRL</span>
          <span className="text-foreground"> Nutri</span>
        </Link>
        <div className="flex items-center gap-2">
          {showShopping ? (
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              className="border-brl-purple/30 bg-brl-purple/10 text-brl-purple hover:bg-brl-purple/20"
              render={
                <Link href="/nutri/compras" aria-label="Lista de compras">
                  <ShoppingCartIcon />
                  <span className="hidden sm:inline">Lista de compras</span>
                </Link>
              }
            />
          ) : null}
          {user ? <UserMenu user={user} /> : null}
        </div>
      </div>
    </header>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-foreground/90">
      {children}
    </span>
  );
}

function SectionTitle({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="mb-5">
      <p className="text-xs font-medium tracking-wide text-brl-purple uppercase">
        {eyebrow}
      </p>
      <h2 className="mt-1.5 font-display text-2xl font-extrabold tracking-tight md:text-3xl">
        {title}
      </h2>
    </div>
  );
}

function HabitsCard() {
  const { done, streak, setHabits, markDayComplete } = useHabits();
  const [fireKey, setFireKey] = useState(0);
  const total = DAILY_HABITS.length;
  const count = DAILY_HABITS.filter((habit) => done[habit.id]).length;
  const allDone = count === total;

  function toggleHabit(id: string) {
    const wasChecked = Boolean(done[id]);
    const next = { ...done, [id]: !wasChecked };
    setHabits(next);
    const nextCount = DAILY_HABITS.filter((habit) => next[habit.id]).length;
    // Comemora só na virada pro "tudo feito" — não a cada clique.
    if (!wasChecked && nextCount === total) {
      setFireKey((k) => k + 1);
      markDayComplete();
    }
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-brl-card p-6 md:p-8">
      <Confetti fireKey={fireKey} />
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h3 className="font-display text-lg font-bold">Hábitos de hoje</h3>
          {streak > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-brl-orange/15 px-2.5 py-0.5 text-xs font-semibold text-brl-orange">
              🔥 {streak} {streak === 1 ? "dia" : "dias"}
            </span>
          ) : null}
        </div>
        <span
          className={cn(
            "shrink-0 text-sm font-medium tabular-nums transition-colors",
            allDone ? "text-emerald-400" : "text-muted-foreground",
          )}
        >
          {allDone ? "Tudo feito! 🎉" : `${count}/${total}`}
        </span>
      </div>
      <ul className="flex flex-col gap-2.5">
        {DAILY_HABITS.map((habit) => {
          const checked = Boolean(done[habit.id]);
          return (
            <li key={habit.id}>
              <button
                type="button"
                onClick={() => toggleHabit(habit.id)}
                aria-pressed={checked}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  checked
                    ? "border-emerald-400/40 bg-emerald-400/10"
                    : "border-white/8 hover:border-white/15",
                )}
              >
                <span className="text-xl" aria-hidden>
                  {habit.emoji}
                </span>
                <span
                  className={cn(
                    "flex-1 text-sm font-medium",
                    checked
                      ? "text-muted-foreground line-through"
                      : "text-foreground",
                  )}
                >
                  {habit.label}
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "size-5 shrink-0 rounded-md border transition-colors",
                    checked
                      ? "border-emerald-400 bg-emerald-400"
                      : "border-white/20",
                  )}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ReadyHome({ profile }: { profile: NutriProfile }) {
  const plan = computeNutriPlan(profile);
  const firstName = profile.name.split(" ")[0] || profile.name;
  const recipe = recipeForDiet(profile.diet);
  const articles = curatedArticles(profile.goal, 6);

  return (
    <div className="min-h-dvh bg-brl-dark pb-20">
      <NutriBar showShopping />

      <main className="mx-auto w-full max-w-5xl px-4 md:px-6">
        {/* Greeting */}
        <section className="pt-10 md:pt-14">
          <p className="text-sm text-muted-foreground">Bom te ver de novo 👋</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-balance md:text-5xl">
            Olá, <span className="text-brl-purple">{firstName}</span>.
          </h1>
          <p className="mt-3 max-w-xl text-base text-muted-foreground md:text-lg">
            {GOAL_HEADLINE[profile.goal]}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Chip>🎯 {goalLabel(profile.goal)}</Chip>
            <Chip>🏃 {activityLabel(profile.activity)}</Chip>
            <Chip>🍽️ {dietLabel(profile.diet)}</Chip>
            <Chip>🍴 {profile.mealsPerDay} refeições/dia</Chip>
          </div>
        </section>

        {/* Resumo do plano */}
        <section className="pt-10 md:pt-14">
          <SectionTitle eyebrow="Seu resumo" title="O plano da sua semana" />
          <PlanSummary plan={plan} />
        </section>

        {/* Seu dia */}
        <section className="pt-10 md:pt-14">
          <SectionTitle eyebrow="Seu dia" title="Marque o que já comeu" />
          <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
            <MealDiary plan={plan} />

            <div className="relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-emerald-400/20 bg-brl-card p-6 md:p-8">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-emerald-500/10 blur-3xl"
              />
              <p className="text-xs font-medium tracking-wide text-emerald-400 uppercase">
                Receita do dia
              </p>
              <span className="text-4xl" aria-hidden>
                {recipe.emoji}
              </span>
              <h3 className="font-display text-xl font-bold text-foreground">
                {recipe.title}
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <ClockIcon className="size-4" />
                  {recipe.time}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  🔥 {recipe.kcal} kcal
                </span>
              </div>
              <div className="mt-1 flex flex-wrap gap-2">
                {recipe.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Acompanhe — água e peso */}
        <section className="pt-10 md:pt-14">
          <SectionTitle eyebrow="Acompanhe" title="Seu progresso de hoje" />
          <div className="grid gap-5 lg:grid-cols-2">
            <WaterCard goalMl={plan.waterMl} />
            <WeightCard profile={profile} plan={plan} />
          </div>
        </section>

        {/* Hábitos */}
        <section className="pt-10 md:pt-14">
          <HabitsCard />
        </section>

        {/* Conteúdos úteis */}
        <section className="pt-10 md:pt-14">
          <SectionTitle
            eyebrow="Pra você"
            title="Conteúdos úteis pra essa fase"
          />
          <AnimatedSection
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            translateY={28}
            duration={500}
            delay={70}
          >
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/conteudos/${article.id}`}
                className="group flex h-full flex-col gap-3 rounded-2xl border border-white/5 bg-brl-card p-6 transition-colors hover:border-brl-purple/40"
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl" aria-hidden>
                    {article.emoji}
                  </span>
                  <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium text-brl-muted">
                    {article.category}
                  </span>
                </div>
                <h3 className="font-display text-base font-bold leading-snug text-foreground">
                  {article.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {article.excerpt}
                </p>
                <span className="mt-auto inline-flex items-center gap-1 pt-2 text-xs font-medium text-brl-purple">
                  Ler · {article.readTime}
                  <ArrowRightIcon className="size-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </AnimatedSection>
        </section>

        {/* Dicas rápidas */}
        <section className="pt-10 md:pt-14">
          <SectionTitle eyebrow="Atalhos" title="Dicas rápidas do dia" />
          <ul className="grid gap-3 sm:grid-cols-2">
            {QUICK_TIPS.map((tip) => (
              <li
                key={tip.text}
                className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 text-sm text-foreground/90"
              >
                <span className="text-lg" aria-hidden>
                  {tip.emoji}
                </span>
                <span>{tip.text}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Upgrade — discreto e dispensável; some no Family */}
        <section className="pt-10 md:pt-14">
          <UpgradeNudge />
        </section>

        {/* Integração BRL Fit */}
        <section className="pt-10 md:pt-14">
          <div
            className="relative overflow-hidden rounded-3xl border border-white/5 p-8 md:p-10"
            style={{
              background:
                "linear-gradient(135deg, #13131f 0%, rgba(150,86,161,0.25) 100%)",
            }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -top-20 right-0 size-72 rounded-full bg-brl-orange/15 blur-3xl"
            />
            <div className="relative flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <h2 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">
                  Conecte com o BRL Fit
                </h2>
                <p className="mt-2 text-sm text-muted-foreground md:text-base">
                  Quando você treina, suas metas do dia se ajustam sozinhas.
                  Treino e nutrição, finalmente no mesmo time.
                </p>
              </div>
              <Button
                size="lg"
                nativeButton={false}
                className="h-12 shrink-0 bg-brl-orange px-6 text-base text-brl-dark hover:bg-brl-orange/90"
                render={
                  <Link href="/fit">
                    <DumbbellIcon />
                    Conhecer o BRL Fit
                  </Link>
                }
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function EmptyHome() {
  return (
    <div className="flex min-h-dvh flex-col bg-brl-dark">
      <NutriBar />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <span className="text-6xl" aria-hidden>
          🥗
        </span>
        <h1 className="mt-6 font-display text-3xl font-extrabold tracking-tight">
          Seu plano ainda não existe.
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Responda algumas perguntas rápidas e a gente monta um plano alimentar
          só seu — calorias, macros e tudo mais.
        </p>
        <Button
          size="lg"
          nativeButton={false}
          className="mt-8 h-12 bg-brl-purple px-6 text-base text-white hover:bg-brl-purple/90"
          render={
            <Link href="/cadastro">
              Montar meu plano
              <ArrowRightIcon />
            </Link>
          }
        />
        <Link
          href="/"
          className="mt-5 text-sm text-muted-foreground hover:text-foreground"
        >
          Voltar para o site
        </Link>
      </main>
    </div>
  );
}

export function NutriHome() {
  const profile = useSyncExternalStore(
    subscribeNutriProfile,
    getNutriProfileSnapshot,
    getNutriProfileServerSnapshot,
  );

  // undefined = ainda lendo o localStorage (servidor / primeiro paint)
  if (profile === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-brl-dark">
        <Loader2Icon className="size-6 animate-spin text-brl-purple" />
      </div>
    );
  }

  if (profile === null) {
    return <EmptyHome />;
  }

  return <ReadyHome profile={profile} />;
}
