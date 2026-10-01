import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ClockIcon,
  FlameIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react";

import { FavoriteButton } from "@/components/content/favorite-button";
import { Button } from "@/components/ui/button";
import {
  fetchRecipe,
  fetchRecipes,
  relatedRecipesFrom,
} from "@/services/content.service";

// ISR: pré-renderiza os slugs no build e revalida do banco de hora em hora.
export const revalidate = 3600;

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const recipes = await fetchRecipes();
  return recipes.map((recipe) => ({ slug: recipe.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const recipe = await fetchRecipe(slug);
  if (!recipe) {
    return { title: "Receita não encontrada — BRL Health" };
  }
  return {
    title: `${recipe.title} — BRL Health`,
    description: recipe.excerpt,
  };
}

export default async function RecipePage({ params }: Params) {
  const { slug } = await params;
  const recipe = await fetchRecipe(slug);
  if (!recipe) notFound();

  const related = relatedRecipesFrom(await fetchRecipes(), slug, 3);

  const macros = [
    { label: "Proteína", value: recipe.macros.protein },
    { label: "Carboidrato", value: recipe.macros.carbs },
    { label: "Gordura", value: recipe.macros.fat },
  ];

  return (
    <article className="bg-brl-dark pt-28 pb-24 md:pt-32 md:pb-28">
      <div className="mx-auto w-full max-w-2xl px-4 md:px-6">
        <Link
          href="/receitas"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          Todas as receitas
        </Link>

        <header className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full bg-brl-purple/15 px-3 py-1 text-xs font-semibold tracking-wide text-brl-purple uppercase">
              {recipe.category}
            </span>
            <FavoriteButton type="recipe" id={recipe.id} />
          </div>
          <h1 className="mt-4 flex items-start gap-3 font-display text-3xl leading-[1.1] font-extrabold tracking-tight text-balance md:text-5xl">
            <span aria-hidden>{recipe.emoji}</span>
            <span>{recipe.title}</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">{recipe.excerpt}</p>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ClockIcon className="size-4" />
              {recipe.time}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <UsersIcon className="size-4" />
              {recipe.servings}{" "}
              {recipe.servings > 1 ? "porções" : "porção"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FlameIcon className="size-4" />
              {recipe.kcal} kcal
            </span>
          </div>
        </header>

        {/* Macros */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          {macros.map((macro) => (
            <div
              key={macro.label}
              className="rounded-2xl border border-foreground/5 bg-brl-card p-4 text-center"
            >
              <p className="font-display text-2xl font-extrabold text-foreground">
                {macro.value}
                <span className="text-base font-bold text-muted-foreground">
                  g
                </span>
              </p>
              <p className="mt-1 text-xs font-medium text-brl-muted">
                {macro.label}
              </p>
            </div>
          ))}
        </div>

        {/* Ingredientes */}
        <section className="mt-10">
          <h2 className="mb-3 font-display text-xl font-bold tracking-tight text-foreground md:text-2xl">
            Ingredientes
          </h2>
          <ul className="flex flex-col gap-2.5">
            {recipe.ingredients.map((ingredient, index) => (
              <li
                key={index}
                className="flex gap-3 text-base leading-relaxed text-foreground/85"
              >
                <span
                  aria-hidden
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-brl-purple"
                />
                <span>{ingredient}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Modo de preparo */}
        <section className="mt-10">
          <h2 className="mb-3 font-display text-xl font-bold tracking-tight text-foreground md:text-2xl">
            Modo de preparo
          </h2>
          <ol className="flex flex-col gap-4">
            {recipe.steps.map((step, index) => (
              <li key={index} className="flex gap-4">
                <span
                  aria-hidden
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brl-purple/20 font-display text-sm font-bold text-brl-purple"
                >
                  {index + 1}
                </span>
                <p className="pt-0.5 text-base leading-relaxed text-foreground/85">
                  {step}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* CTA */}
        <div
          className="mt-12 overflow-hidden rounded-2xl border border-foreground/5 p-7 md:p-8"
          style={{
            background:
              "linear-gradient(135deg, #13131f 0%, rgba(150,86,161,0.22) 100%)",
          }}
        >
          <h2 className="font-display text-xl font-extrabold tracking-tight md:text-2xl">
            Quer um cardápio inteiro assim?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            O BRL Nutri monta um plano com as suas calorias, macros e refeições —
            receitas como essa, no seu objetivo e na sua rotina.
          </p>
          <Button
            size="lg"
            nativeButton={false}
            className="mt-5 h-12 bg-brl-purple px-6 text-base text-white hover:bg-brl-purple/90"
            render={
              <Link href="/cadastro">
                <SparklesIcon />
                Montar meu plano grátis
              </Link>
            }
          />
        </div>
      </div>

      {/* Relacionadas */}
      {related.length > 0 ? (
        <div className="mx-auto mt-16 w-full max-w-6xl px-4 md:px-6">
          <h2 className="mb-6 font-display text-2xl font-extrabold tracking-tight">
            Mais receitas
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <Link
                key={item.id}
                href={`/receitas/${item.id}`}
                className="group flex h-full flex-col gap-3 rounded-2xl border border-foreground/5 bg-brl-card p-6 transition-colors hover:border-brl-purple/40"
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl" aria-hidden>
                    {item.emoji}
                  </span>
                  <span className="rounded-full bg-foreground/5 px-2.5 py-1 text-xs font-medium text-brl-muted">
                    {item.category}
                  </span>
                </div>
                <h3 className="font-display text-base font-bold leading-snug text-foreground">
                  {item.title}
                </h3>
                <span className="mt-auto inline-flex items-center gap-1 pt-2 text-xs font-medium text-brl-purple">
                  ⏱ {item.time} · {item.kcal} kcal
                  <ArrowRightIcon className="size-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}
