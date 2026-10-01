import type { ReactNode } from "react";

import { AnimatedSection } from "@/components/animations/animated-section";
import { ProductCard } from "@/components/sections/product-card";

export function Products(): ReactNode {
  return (
    <section
      id="produtos"
      aria-labelledby="products-title"
      className="mx-auto w-full max-w-6xl px-4 py-20 md:px-6 md:py-28"
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium tracking-wide text-brl-purple uppercase">
          Dois apps. Um ecossistema.
        </p>
        <h2
          id="products-title"
          className="mt-3 font-display text-3xl font-extrabold tracking-tight md:text-5xl"
        >
          Treino e nutrição, finalmente no mesmo time.
        </h2>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <AnimatedSection
          translateX={-60}
          translateY={0}
          duration={700}
          ease="outExpo"
        >
          <ProductCard
            title="BRL Fit"
            tagline="Bora botar o shape. 💪"
            accent="orange"
            features={[
              "Planos adaptativos por objetivo",
              "Progressão inteligente sem platôs",
              "Integração em tempo real com o Nutri",
              "IA personalizada",
            ]}
            cta={{ href: "/fit", label: "Conhecer o BRL Fit" }}
          />
        </AnimatedSection>
        <AnimatedSection
          translateX={60}
          translateY={0}
          duration={700}
          ease="outExpo"
        >
          <ProductCard
            title="BRL Nutri"
            tagline="Comer bem, sem sofrimento. 🥗"
            accent="green"
            features={[
              "Diário alimentar que aprende com você",
              "Metas ajustadas pelo seu treino do dia",
              "Sugestões de refeição com IA",
              "Integração nativa com o BRL Fit",
            ]}
            cta={{ href: "/cadastro", label: "Conhecer o BRL Nutri" }}
          />
        </AnimatedSection>
      </div>
    </section>
  );
}
