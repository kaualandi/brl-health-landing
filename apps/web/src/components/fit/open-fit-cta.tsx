"use client";

import Link from "next/link";
import { DumbbellIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

/** CTA pro app do Fit; só aparece logado. */
export function OpenFitCta() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return null;
  return (
    <Button
      size="lg"
      nativeButton={false}
      className="mt-8 h-12 bg-brl-orange px-6 text-base text-brl-dark hover:bg-brl-orange/90"
      render={
        <Link href="/fit/app">
          <DumbbellIcon />
          Abrir o BRL Fit
        </Link>
      }
    />
  );
}
