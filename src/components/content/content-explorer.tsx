"use client";

import Link from "next/link";
import { ArrowRightIcon, SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { ARTICLES, articleCategories } from "@/lib/nutri-content";
import { cn } from "@/lib/utils";

const ALL = "Todos";

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function ContentExplorer() {
  const categories = useMemo(() => [ALL, ...articleCategories()], []);
  const [category, setCategory] = useState(ALL);
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = normalize(query.trim());
    return ARTICLES.filter((article) => {
      const matchesCategory = category === ALL || article.category === category;
      const matchesQuery =
        q.length === 0 ||
        normalize(article.title).includes(q) ||
        normalize(article.excerpt).includes(q) ||
        normalize(article.category).includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  return (
    <div>
      {/* Busca */}
      <div className="relative mx-auto max-w-md">
        <SearchIcon
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          placeholder="Buscar por assunto..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Buscar conteúdos"
          className="h-12 pl-10 text-base"
        />
      </div>

      {/* Filtros de categoria */}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            aria-pressed={category === item}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              category === item
                ? "border-brl-purple/60 bg-brl-purple/15 text-foreground"
                : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/20 hover:text-foreground",
            )}
          >
            {item}
          </button>
        ))}
      </div>

      {/* Resultados */}
      {results.length > 0 ? (
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((article) => (
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
              <h2 className="font-display text-base font-bold leading-snug text-foreground">
                {article.title}
              </h2>
              <p className="text-sm text-muted-foreground">{article.excerpt}</p>
              <span className="mt-auto inline-flex items-center gap-1 pt-2 text-xs font-medium text-brl-purple">
                Ler · {article.readTime}
                <ArrowRightIcon className="size-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-16 flex flex-col items-center text-center">
          <span className="text-5xl" aria-hidden>
            🔍
          </span>
          <p className="mt-4 font-display text-lg font-bold">
            Nada por aqui com esse filtro.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tenta outra busca ou volta pra “Todos”.
          </p>
        </div>
      )}
    </div>
  );
}
