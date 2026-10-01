import type { Metadata } from "next";

import { ContentExplorer } from "@/components/content/content-explorer";
import { SITE_NAME } from "@/lib/site";
import { fetchArticles } from "@/services/content.service";

// ISR: regenera a lista do banco de hora em hora, sem redeploy.
export const revalidate = 3600;

const TITLE = "Conteúdos — BRL Health";
const DESCRIPTION =
  "Artigos diretos sobre nutrição, treino e hábitos. Sem mito, sem enrolação — o que funciona na vida real.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/conteudos" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: SITE_NAME,
    url: "/conteudos",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/opengraph-image"],
  },
};

export default async function ContentPage() {
  const articles = await fetchArticles();
  return (
    <section className="relative overflow-hidden bg-brl-dark pt-32 pb-24 md:pt-40 md:pb-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(50% 35% at 50% 0%, rgba(150,86,161,0.10) 0%, rgba(13,13,26,0) 70%)",
        }}
      />
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium tracking-wide text-brl-purple uppercase">
            Conteúdos
          </p>
          <h1 className="mt-3 font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-balance md:text-6xl">
            Aprenda a comer com intenção.
          </h1>
          <p className="mt-5 text-base text-muted-foreground md:text-lg">
            Artigos curtos e honestos sobre nutrição, treino e hábitos. Sem
            mito, sem dieta da moda.
          </p>
        </header>

        <div className="mt-12 md:mt-16">
          <ContentExplorer articles={articles} />
        </div>
      </div>
    </section>
  );
}
