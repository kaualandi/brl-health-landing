import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRightIcon, HomeIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Página não encontrada — BRL Health",
};

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-brl-dark px-4 py-16 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(45% 35% at 50% 30%, rgba(150,86,161,0.12) 0%, rgba(13,13,26,0) 70%)",
        }}
      />
      <Link
        href="/"
        className="mb-10 font-display text-xl font-extrabold tracking-tight"
        aria-label="BRL Health — página inicial"
      >
        <span className="text-brl-purple">BRL</span>
        <span className="text-foreground"> Health</span>
      </Link>

      <p className="font-display text-7xl font-extrabold tracking-tight text-brl-purple md:text-8xl">
        404
      </p>
      <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-balance md:text-3xl">
        Essa página saiu da dieta.
      </h1>
      <p className="mt-3 max-w-md text-base text-muted-foreground">
        O link que você seguiu não existe (ou mudou de lugar). Bora voltar pra
        um caminho que leva a algum lugar.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button
          size="lg"
          nativeButton={false}
          className="h-12 bg-brl-purple px-6 text-base text-white hover:bg-brl-purple/90"
          render={
            <Link href="/">
              <HomeIcon />
              Voltar pra home
            </Link>
          }
        />
        <Button
          size="lg"
          variant="outline"
          nativeButton={false}
          className="h-12 border-white/15 bg-white/5 px-6 text-base hover:bg-white/10"
          render={
            <Link href="/conteudos">
              Ver conteúdos
              <ArrowRightIcon />
            </Link>
          }
        />
      </div>
    </main>
  );
}
