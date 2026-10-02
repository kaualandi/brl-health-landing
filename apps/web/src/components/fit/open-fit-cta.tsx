"use client";

import Link from "next/link";
import { ArrowRightIcon, DumbbellIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

/** CTAs do hero do /fit: logado abre o app; visitante começa grátis ou entra. */
export function OpenFitCta() {
  const { isAuthenticated, status } = useAuth();
  if (status === "loading") return <div className="mt-8 h-12" />;
  if (isAuthenticated) {
    return (
      <div className="mt-8 flex justify-center">
        <Button
          size="lg"
          nativeButton={false}
          className="h-12 bg-brl-orange px-6 text-base text-brl-dark hover:bg-brl-orange/90"
          render={
            <Link href="/fit/app">
              <DumbbellIcon />
              Abrir o BRL Fit
            </Link>
          }
        />
      </div>
    );
  }
  return (
    <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
      <Button
        size="lg"
        nativeButton={false}
        className="h-12 bg-brl-orange px-6 text-base text-brl-dark hover:bg-brl-orange/90"
        render={
          <Link href="/cadastro?next=/fit/comecar">
            Começar grátis
            <ArrowRightIcon />
          </Link>
        }
      />
      <Button
        size="lg"
        variant="outline"
        nativeButton={false}
        className="h-12 px-6 text-base"
        render={<Link href="/login?next=/fit/app">Entrar</Link>}
      />
    </div>
  );
}
