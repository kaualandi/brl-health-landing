import type { Metadata } from "next";

import { PlansBoard } from "@/components/plan/plans-board";

export const metadata: Metadata = {
  title: "Planos e preços — BRL Health",
  description:
    "Comece grátis e evolua quando quiser. Compare o BRL Free, Pro e Family e assine em segundos.",
};

export default function PricingPage() {
  return (
    <section className="relative overflow-hidden bg-brl-dark pt-32 pb-24 md:pt-40 md:pb-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(50% 35% at 50% 0%, rgba(150,86,161,0.12) 0%, rgba(13,13,26,0) 70%)",
        }}
      />
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium tracking-wide text-brl-purple uppercase">
            Planos
          </p>
          <h1 className="mt-3 font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-balance md:text-6xl">
            Escolhe como você quer caminhar.
          </h1>
          <p className="mt-5 text-base text-muted-foreground md:text-lg">
            Começa grátis. Evolui quando quiser. Cancela quando precisar — sem
            pegadinha.
          </p>
        </header>

        <PlansBoard />

        <p className="mx-auto mt-12 max-w-xl text-center text-xs text-muted-foreground">
          Pagamento processado com segurança. Você pode trocar ou cancelar seu
          plano a qualquer momento pelo Minha conta.
        </p>
      </div>
    </section>
  );
}
