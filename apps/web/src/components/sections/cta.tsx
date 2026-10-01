"use client";

import Link from "next/link";
import { animate } from "animejs";
import { useEffect, useRef } from "react";

import { AnimatedSection } from "@/components/animations/animated-section";
import { Button } from "@/components/ui/button";
import { useButtonAnimation } from "@/hooks/use-button-animation";

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function CtaButton() {
  const ref = useRef<HTMLDivElement | null>(null);
  const hover = useButtonAnimation();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) return;

    el.style.opacity = "0";
    el.style.transform = "scale(0.9)";

    const pulseRef: { current: ReturnType<typeof animate> | null } = {
      current: null,
    };
    let entrance: ReturnType<typeof animate> | null = null;
    let played = false;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !played) {
            played = true;
            entrance = animate(el, {
              opacity: [0, 1],
              scale: [0.9, 1],
              duration: 500,
              delay: 200,
              ease: "outBack",
              onComplete: () => {
                pulseRef.current = animate(el, {
                  scale: [1, 1.03, 1],
                  duration: 1500,
                  ease: "inOutQuad",
                  loop: true,
                });
              },
            });
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -60px 0px" },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      if (entrance) entrance.cancel();
      if (pulseRef.current) pulseRef.current.cancel();
    };
  }, []);

  return (
    <div ref={ref} className="inline-block">
      <Button
        size="lg"
        nativeButton={false}
        className="h-12 bg-brl-purple px-6 text-base text-white hover:bg-brl-purple/90"
        onMouseEnter={hover.onMouseEnter}
        onMouseLeave={hover.onMouseLeave}
        onMouseDown={hover.onMouseDown}
        onMouseUp={hover.onMouseUp}
        render={<Link href="/cadastro">Criar minha conta</Link>}
      />
    </div>
  );
}

export function Cta() {
  return (
    <section
      aria-labelledby="cta-title"
      className="relative overflow-hidden py-20 md:py-28"
      style={{
        background:
          "linear-gradient(135deg, var(--background) 0%, rgba(150,86,161,0.25) 100%)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 right-0 size-80 rounded-full bg-brl-purple/20 blur-3xl"
      />
      <AnimatedSection
        className="relative mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-4 text-center md:px-6"
        translateY={40}
        duration={600}
        delay={120}
        ease="outExpo"
      >
        <h2
          id="cta-title"
          className="font-display text-3xl font-extrabold tracking-tight md:text-5xl"
        >
          Do objetivo à conquista.
        </h2>
        <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
          Comece grátis. Sem cartão. Sem desculpa.
        </p>
        <CtaButton />
      </AnimatedSection>
    </section>
  );
}
