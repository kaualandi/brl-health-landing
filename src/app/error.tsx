"use client";

import Link from "next/link";
import { HomeIcon, RotateCcwIcon } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // TODO: enviar para serviço de monitoramento (Sentry) na fase de produção.
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-brl-dark px-4 py-16 text-center">
      <span className="text-6xl" aria-hidden>
        🛠️
      </span>
      <h1 className="mt-6 font-display text-2xl font-extrabold tracking-tight text-balance md:text-3xl">
        Algo quebrou do nosso lado.
      </h1>
      <p className="mt-3 max-w-md text-base text-muted-foreground">
        Não foi você — foi a gente. Tenta de novo; se continuar, volta pra home
        e respira.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button
          size="lg"
          onClick={reset}
          className="h-12 bg-brl-purple px-6 text-base text-white hover:bg-brl-purple/90"
        >
          <RotateCcwIcon />
          Tentar de novo
        </Button>
        <Button
          size="lg"
          variant="outline"
          nativeButton={false}
          className="h-12 border-white/15 bg-white/5 px-6 text-base hover:bg-white/10"
          render={
            <Link href="/">
              <HomeIcon />
              Voltar pra home
            </Link>
          }
        />
      </div>
    </main>
  );
}
