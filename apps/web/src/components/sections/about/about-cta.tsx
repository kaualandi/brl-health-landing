import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function AboutCta() {
  return (
    <section
      aria-labelledby="about-cta-title"
      className="relative overflow-hidden py-20 md:py-28"
      style={{
        background:
          "linear-gradient(135deg, var(--background) 0%, rgba(150,86,161,0.15) 100%)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 right-0 size-80 rounded-full bg-brl-purple/20 blur-3xl"
      />
      <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-4 text-center md:px-6">
        <h2
          id="about-cta-title"
          className="font-display text-3xl font-extrabold tracking-tight md:text-5xl"
        >
          Quer conhecer o produto?
        </h2>
        <div className="mt-2 flex flex-col items-center gap-4 sm:flex-row">
          <Button
            size="lg"
            nativeButton={false}
            className="h-12 bg-brl-purple px-6 text-base text-white hover:bg-brl-purple/90"
            render={
              <Link href="/cadastro">
                Começar grátis
                <ArrowRightIcon />
              </Link>
            }
          />
          <Link
            href="/contato"
            className="rounded text-sm font-medium text-muted-foreground underline-offset-4 transition-colors outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Fala com a gente
          </Link>
        </div>
      </div>
    </section>
  );
}
