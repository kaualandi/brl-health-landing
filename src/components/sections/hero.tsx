"use client";

import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { useRef } from "react";

import { HeroCanvas } from "@/components/animations/hero-canvas";
import { Button } from "@/components/ui/button";
import { useButtonAnimation } from "@/hooks/use-button-animation";
import { useHeroAnimation } from "@/hooks/use-hero-animation";

export function Hero() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const badgeRef = useRef<HTMLSpanElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const subtitleRef = useRef<HTMLParagraphElement | null>(null);
  const ctasRef = useRef<HTMLDivElement | null>(null);

  useHeroAnimation({
    root: sectionRef,
    badge: badgeRef,
    heading: headingRef,
    subtitle: subtitleRef,
    ctas: ctasRef,
  });

  const primaryCtaAnim = useButtonAnimation();

  return (
    <section
      ref={sectionRef}
      aria-labelledby="hero-title"
      className="relative overflow-hidden pt-32 pb-24 md:pt-40 md:pb-32"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(150,86,161,0.18) 0%, rgba(13,13,26,0) 70%), radial-gradient(40% 40% at 80% 30%, rgba(255,137,6,0.08) 0%, rgba(13,13,26,0) 70%)",
        }}
      />
      <HeroCanvas />
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-8 px-4 text-center md:px-6">
        <span
          ref={badgeRef}
          className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-foreground/5 px-3 py-1 text-xs font-medium text-muted-foreground"
        >
          <span className="size-1.5 rounded-full bg-brl-orange" />
          BRL Fit + BRL Nutri — agora conversando
        </span>

        <h1
          id="hero-title"
          ref={headingRef}
          className="max-w-4xl font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-balance md:text-6xl lg:text-7xl"
        >
          Não é falta de vontade.{" "}
          <span className="text-brl-purple">Nunca foi.</span>
        </h1>

        <p
          ref={subtitleRef}
          className="max-w-2xl text-base text-muted-foreground md:text-lg"
        >
          Treino e nutrição que se falam — do objetivo à conquista.
        </p>

        <div ref={ctasRef} className="flex flex-col gap-3 sm:flex-row">
          <Button
            size="lg"
            nativeButton={false}
            className="h-12 bg-brl-purple px-6 text-base text-white hover:bg-brl-purple/90"
            onMouseEnter={primaryCtaAnim.onMouseEnter}
            onMouseLeave={primaryCtaAnim.onMouseLeave}
            onMouseDown={primaryCtaAnim.onMouseDown}
            onMouseUp={primaryCtaAnim.onMouseUp}
            render={
              <Link href="/cadastro">
                Começar grátis
                <ArrowRightIcon />
              </Link>
            }
          />
          <Button
            variant="outline"
            size="lg"
            nativeButton={false}
            className="h-12 border-foreground/15 bg-foreground/5 px-6 text-base text-foreground hover:bg-foreground/10"
            render={<a href="#como-funciona">Ver como funciona</a>}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          Sem cartão. Sem desculpa.
        </p>
      </div>
    </section>
  );
}
