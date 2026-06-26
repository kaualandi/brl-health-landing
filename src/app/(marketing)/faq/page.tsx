import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { FaqAccordion } from "@/components/faq/faq-accordion";
import { Button } from "@/components/ui/button";
import { FAQ } from "@/lib/faq";

export const metadata: Metadata = {
  title: "Perguntas frequentes — BRL Health",
  description:
    "Tire suas dúvidas sobre o BRL Nutri, planos e cobrança, conta e privacidade.",
};

// Dados estruturados pra rich results de FAQ no Google.
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.flatMap((category) => category.items).map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

export default function FaqPage() {
  return (
    <div className="bg-brl-dark pt-28 pb-24 md:pt-32 md:pb-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="mx-auto w-full max-w-3xl px-4 md:px-6">
        <header>
          <p className="text-sm font-medium tracking-wide text-brl-purple uppercase">
            Ajuda
          </p>
          <h1 className="mt-1.5 font-display text-4xl leading-[1.1] font-extrabold tracking-tight text-balance md:text-5xl">
            Perguntas frequentes
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            As dúvidas mais comuns sobre a BRL Health. Não achou a sua? A gente
            responde.
          </p>
        </header>

        <div className="mt-10">
          <FaqAccordion />
        </div>

        <div
          className="mt-12 overflow-hidden rounded-2xl border border-white/5 p-7 md:p-8"
          style={{
            background:
              "linear-gradient(135deg, #13131f 0%, rgba(150,86,161,0.22) 100%)",
          }}
        >
          <h2 className="font-display text-xl font-extrabold tracking-tight md:text-2xl">
            Ainda com dúvida?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            Fala com a gente — respondemos por e-mail o quanto antes.
          </p>
          <Button
            size="lg"
            nativeButton={false}
            className="mt-5 h-12 bg-brl-purple px-6 text-base text-white hover:bg-brl-purple/90"
            render={
              <Link href="/contato">
                Falar com a gente
                <ArrowRightIcon />
              </Link>
            }
          />
        </div>
      </div>
    </div>
  );
}
