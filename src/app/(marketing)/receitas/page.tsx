import type { Metadata } from "next";

import { RecipeExplorer } from "@/components/content/recipe-explorer";
import { SITE_NAME } from "@/lib/site";

const TITLE = "Receitas — BRL Health";
const DESCRIPTION =
  "Receitas realistas por dieta e objetivo, em nível de alimento: ingredientes, modo de preparo, calorias e macros de cada prato.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/receitas" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: SITE_NAME,
    url: "/receitas",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/opengraph-image"],
  },
};

export default function RecipesPage() {
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
            Receitas
          </p>
          <h1 className="mt-3 font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-balance md:text-6xl">
            Comida de verdade, em nível de alimento.
          </h1>
          <p className="mt-5 text-base text-muted-foreground md:text-lg">
            Receitas brasileiras por dieta e objetivo, com ingredientes, modo de
            preparo, calorias e macros. Do café da manhã à sobremesa fit.
          </p>
        </header>

        <div className="mt-12 md:mt-16">
          <RecipeExplorer />
        </div>
      </div>
    </section>
  );
}
