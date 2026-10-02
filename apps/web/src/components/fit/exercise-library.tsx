"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftIcon, Loader2Icon, SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Attribution, Chips, ExerciseGif } from "@/components/fit/exercise-parts";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useExerciseFilters, useExerciseList } from "@/hooks/use-exercises";
import { librarySearch, parseExerciseQuery, sentenceCase, type Exercise, type ExerciseQuery, type Option } from "@/lib/exercises";

const FIELD = "min-h-11 w-full rounded-xl border border-foreground/10 bg-card px-3 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

function Select({ label, value, options, onChange }: { label: string; value: string; options: Option[]; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-1 flex-col gap-1 text-xs text-muted-foreground">
      {label}
      <select className={FIELD} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Todos</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ExerciseCard({ ex, href }: { ex: Exercise; href: string }) {
  return (
    <li>
      <Link
        href={href}
        className="flex h-full flex-col gap-3 rounded-2xl border border-foreground/5 bg-card p-3 outline-none transition-colors hover:border-brl-purple/50 focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ExerciseGif src={ex.gifUrl} name={ex.name} />
        <h2 className="font-display text-base font-bold leading-tight">{sentenceCase(ex.name)}</h2>
        <div className="flex flex-wrap gap-1.5">
          <Chips items={ex.targetMuscles.slice(0, 2)} />
          <Chips items={ex.equipments.slice(0, 1)} tone="orange" />
        </div>
      </Link>
    </li>
  );
}

function GridSkeleton() {
  return (
    <ul aria-hidden className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <li key={i} className="flex flex-col gap-3 rounded-2xl bg-card p-3">
          <Skeleton className="aspect-square w-full" rounded="xl" />
          <Skeleton height={20} width="70%" />
          <Skeleton height={24} width="50%" rounded="full" />
        </li>
      ))}
    </ul>
  );
}

function useLibraryQuery(embedded: boolean) {
  const router = useRouter();
  const pathname = usePathname();
  const query = parseExerciseQuery(useSearchParams());
  const apply = (next: ExerciseQuery) => {
    const qs = librarySearch(next, embedded);
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
  return { query, apply };
}

/** Biblioteca; `embedded` = dentro da aba do app (sem moldura própria, filtros preservam `aba`). */
export function ExerciseLibrary({ embedded = false }: { embedded?: boolean }) {
  const { query, apply } = useLibraryQuery(embedded);
  const [text, setText] = useState(query.q);
  const filters = useExerciseFilters();
  const list = useExerciseList(query);

  useEffect(() => {
    if (text.trim() === query.q) return;
    const t = setTimeout(() => apply({ ...query, q: text.trim() }), 300);
    return () => clearTimeout(t);
  });

  const items = list.data?.pages.flatMap((p) => p.items) ?? [];
  const total = list.data?.pages[0]?.total ?? 0;
  const clear = () => {
    setText("");
    apply({ q: "", bodyPart: "", equipment: "" });
  };
  const back = librarySearch(query, embedded);
  const Frame = embedded ? "div" : "main";

  return (
    <div className={embedded ? undefined : "min-h-dvh bg-background"}>
      <Frame className={embedded ? "flex flex-col gap-5 pt-8" : "mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-8 md:px-6"}>
        {embedded ? null : (
          <Link href="/fit/app" className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeftIcon aria-hidden className="size-4" /> BRL Fit
          </Link>
        )}
        <h1 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">Biblioteca de exercícios</h1>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex flex-[2] flex-col gap-1 text-xs text-muted-foreground">
            Buscar
            <span className="relative">
              <SearchIcon aria-hidden className="absolute left-3 top-1/2 size-4 -translate-y-1/2" />
              <input type="search" className={`${FIELD} pl-9`} value={text} placeholder="Ex.: agachamento" onChange={(e) => setText(e.target.value)} />
            </span>
          </label>
          <Select label="Grupo muscular" value={query.bodyPart} options={filters.data?.bodyParts ?? []} onChange={(v) => apply({ ...query, bodyPart: v })} />
          <Select label="Equipamento" value={query.equipment} options={filters.data?.equipments ?? []} onChange={(v) => apply({ ...query, equipment: v })} />
        </div>
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {list.data ? `${total} ${total === 1 ? "exercício" : "exercícios"}` : " "}
        </p>
        {list.isPending ? <GridSkeleton /> : null}
        {list.isError ? (
          <EmptyState className="bg-card" icon="⚠️" title="Não foi possível carregar" description="Confira sua conexão e tente de novo." action={<Button className="h-11" onClick={() => list.refetch()}>Tentar de novo</Button>} />
        ) : null}
        {list.data && items.length === 0 ? (
          <EmptyState className="bg-card" icon="🔎" title="Nenhum exercício com esses filtros" action={<Button className="h-11" onClick={clear}>Limpar filtros</Button>} />
        ) : null}
        {items.length > 0 ? (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((ex) => (
              <ExerciseCard key={ex.id} ex={ex} href={`/fit/exercicios/${ex.id}${back ? `?${back}` : ""}`} />
            ))}
          </ul>
        ) : null}
        {list.hasNextPage ? (
          <Button variant="outline" className="h-12" onClick={() => list.fetchNextPage()} disabled={list.isFetchingNextPage}>
            {list.isFetchingNextPage ? <Loader2Icon aria-hidden className="animate-spin" /> : null}
            Carregar mais
          </Button>
        ) : null}
        <Attribution />
      </Frame>
    </div>
  );
}
