"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeftIcon, Loader2Icon } from "lucide-react";
import { Suspense } from "react";

import { Attribution, Chips, ExerciseGif } from "@/components/fit/exercise-parts";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useExercise } from "@/hooks/use-exercises";
import { buildExerciseSearch, parseExerciseQuery, sentenceCase, type Exercise } from "@/lib/exercises";

function BackLink() {
  const qs = buildExerciseSearch(parseExerciseQuery(useSearchParams()));
  return (
    <Link href={`/fit/exercicios${qs ? `?${qs}` : ""}`} className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground">
      <ArrowLeftIcon aria-hidden className="size-4" /> Biblioteca
    </Link>
  );
}

function Group({ title, items, tone }: { title: string; items: Exercise["targetMuscles"]; tone?: "orange" }) {
  if (items.length === 0) return null;
  return (
    <section aria-label={title}>
      <h2 className="mb-2 font-display text-lg font-bold">{title}</h2>
      <div className="flex flex-wrap gap-1.5">
        <Chips items={items} tone={tone} />
      </div>
    </section>
  );
}

function Body({ ex }: { ex: Exercise }) {
  return (
    <>
      <h1 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">{sentenceCase(ex.name)}</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <ExerciseGif src={ex.gifUrl} name={ex.name} eager />
        <div className="flex flex-col gap-5">
          <Group title="Músculos-alvo" items={ex.targetMuscles} />
          <Group title="Músculos secundários" items={ex.secondaryMuscles} />
          <Group title="Equipamento" items={ex.equipments} tone="orange" />
        </div>
      </div>
      {ex.instructions.length > 0 ? (
        <section aria-label="Passo a passo">
          <h2 className="mb-3 font-display text-lg font-bold">Passo a passo</h2>
          <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm leading-relaxed marker:font-bold marker:text-brl-orange">
            {ex.instructions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </section>
      ) : null}
    </>
  );
}

export function ExerciseDetail({ id }: { id: string }) {
  const q = useExercise(id);
  const notFound = (q.error as { status?: number } | null)?.status === 404;
  return (
    <div className="min-h-dvh bg-background">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 md:px-6">
        <Suspense>
          <BackLink />
        </Suspense>
        {q.isPending ? (
          <div role="status" className="mx-auto">
            <Loader2Icon aria-hidden className="size-8 animate-spin" />
            <span className="sr-only">Carregando exercício…</span>
          </div>
        ) : null}
        {notFound ? (
          <EmptyState className="bg-card" icon="🤷" title="Exercício não encontrado" description="Ele pode ter saído do catálogo." action={<Link href="/fit/exercicios" className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">Ver biblioteca</Link>} />
        ) : q.isError ? (
          <EmptyState className="bg-card" icon="⚠️" title="Não foi possível carregar" action={<Button className="h-11" onClick={() => q.refetch()}>Tentar de novo</Button>} />
        ) : null}
        {q.data ? <Body ex={q.data} /> : null}
        <Attribution />
      </main>
    </div>
  );
}
