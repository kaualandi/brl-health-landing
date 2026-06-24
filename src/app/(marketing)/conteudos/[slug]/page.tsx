import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ClockIcon,
  SparklesIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ARTICLES,
  getArticle,
  relatedArticles,
} from "@/lib/nutri-content";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return ARTICLES.map((article) => ({ slug: article.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) {
    return { title: "Conteúdo não encontrado — BRL Health" };
  }
  return {
    title: `${article.title} — BRL Health`,
    description: article.excerpt,
  };
}

export default async function ArticlePage({ params }: Params) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const related = relatedArticles(slug, 3);

  return (
    <article className="bg-brl-dark pt-28 pb-24 md:pt-32 md:pb-28">
      <div className="mx-auto w-full max-w-2xl px-4 md:px-6">
        <Link
          href="/conteudos"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          Todos os conteúdos
        </Link>

        <header className="mt-6">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-brl-purple/15 px-3 py-1 text-xs font-semibold tracking-wide text-brl-purple uppercase">
              {article.category}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <ClockIcon className="size-3.5" />
              {article.readTime} de leitura
            </span>
          </div>
          <h1 className="mt-4 font-display text-3xl leading-[1.1] font-extrabold tracking-tight text-balance md:text-5xl">
            {article.title}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            {article.excerpt}
          </p>
          <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
            <span
              aria-hidden
              className="flex size-8 items-center justify-center rounded-full bg-brl-purple/20 text-base"
            >
              {article.emoji}
            </span>
            Por {article.author}
          </p>
        </header>

        <div className="mt-10 flex flex-col gap-8">
          {article.body.map((section, index) => (
            <section key={index}>
              {section.heading ? (
                <h2 className="mb-3 font-display text-xl font-bold tracking-tight text-foreground md:text-2xl">
                  {section.heading}
                </h2>
              ) : null}
              {section.paragraphs?.map((paragraph, pIndex) => (
                <p
                  key={pIndex}
                  className="mb-4 text-base leading-relaxed text-foreground/85 last:mb-0"
                >
                  {paragraph}
                </p>
              ))}
              {section.bullets ? (
                <ul className="mt-2 flex flex-col gap-2.5">
                  {section.bullets.map((bullet, bIndex) => (
                    <li
                      key={bIndex}
                      className="flex gap-3 text-base leading-relaxed text-foreground/85"
                    >
                      <span
                        aria-hidden
                        className="mt-2 size-1.5 shrink-0 rounded-full bg-brl-purple"
                      />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>

        {/* CTA */}
        <div
          className="mt-12 overflow-hidden rounded-2xl border border-white/5 p-7 md:p-8"
          style={{
            background:
              "linear-gradient(135deg, #13131f 0%, rgba(150,86,161,0.22) 100%)",
          }}
        >
          <h2 className="font-display text-xl font-extrabold tracking-tight md:text-2xl">
            Quer isso aplicado ao seu dia?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            O BRL Nutri transforma esse conhecimento num plano com as suas
            calorias, macros e refeições.
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

      {/* Relacionados */}
      {related.length > 0 ? (
        <div className="mx-auto mt-16 w-full max-w-6xl px-4 md:px-6">
          <h2 className="mb-6 font-display text-2xl font-extrabold tracking-tight">
            Continue lendo
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <Link
                key={item.id}
                href={`/conteudos/${item.id}`}
                className="group flex h-full flex-col gap-3 rounded-2xl border border-white/5 bg-brl-card p-6 transition-colors hover:border-brl-purple/40"
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl" aria-hidden>
                    {item.emoji}
                  </span>
                  <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium text-brl-muted">
                    {item.category}
                  </span>
                </div>
                <h3 className="font-display text-base font-bold leading-snug text-foreground">
                  {item.title}
                </h3>
                <span className="mt-auto inline-flex items-center gap-1 pt-2 text-xs font-medium text-brl-purple">
                  Ler · {item.readTime}
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
