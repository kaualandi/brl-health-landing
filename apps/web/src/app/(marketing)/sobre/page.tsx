import type { Metadata } from "next";

import { AboutCta } from "@/components/sections/about/about-cta";
import { MetricsSection } from "@/components/sections/about/metrics-section";
import { OriginSection } from "@/components/sections/about/origin-section";
import { ProductsSection } from "@/components/sections/about/products-section";
import { StackSection } from "@/components/sections/about/stack-section";
import { SITE_NAME } from "@/lib/site";

const TITLE = "Sobre — BRL Health";
const DESCRIPTION =
  "A história por trás do shape: como a BRL nasceu de uma conversa entre amigos que cansaram de treinar sem sistema.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/sobre" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: SITE_NAME,
    url: "/sobre",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/opengraph-image"],
  },
};

function AboutHero() {
  return (
    <section
      aria-labelledby="about-hero-title"
      className="relative overflow-hidden bg-brl-dark pt-32 pb-20 md:pt-40 md:pb-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(55% 50% at 50% 0%, rgba(150,86,161,0.10) 0%, rgba(13,13,26,0) 70%)",
        }}
      />
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-4 text-center md:px-6">
        <h1
          id="about-hero-title"
          className="font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-balance md:text-6xl lg:text-7xl"
        >
          A história por trás do{" "}
          <span className="text-brl-purple">shape.</span>
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
          A BRL não nasceu numa garagem no Vale do Silício. Nasceu numa
          conversa entre amigos que cancelaram academia pela terceira vez no
          mesmo ano.
        </p>
      </div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <OriginSection />
      <ProductsSection />
      <MetricsSection />
      <StackSection />
      <AboutCta />
    </>
  );
}
