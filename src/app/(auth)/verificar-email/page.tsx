import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeftIcon, Loader2Icon } from "lucide-react";
import { Suspense } from "react";

import { VerifyEmailForm } from "@/components/forms/verify-email-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Verificar e-mail — BRL Health",
};

export default function VerificarEmailPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-brl-dark px-4 py-12">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          nativeButton={false}
          className="mb-4 pl-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
          render={
            <Link href="/login" aria-label="Voltar para o login">
              <ArrowLeftIcon />
              Voltar para o login
            </Link>
          }
        />

        <Link
          href="/"
          className="mb-8 block text-center font-display text-2xl font-extrabold tracking-tight"
          aria-label="BRL Health — voltar para a página inicial"
        >
          <span className="text-brl-purple">BRL</span>
          <span className="text-foreground"> Health</span>
        </Link>

        <Card className="border border-foreground/10 bg-brl-card p-2">
          <CardHeader className="px-6 pt-6 pb-2">
            <CardTitle className="font-display text-2xl font-bold">
              Confirme seu e-mail
            </CardTitle>
            <CardDescription>
              Falta pouco: confirme seu e-mail para liberar tudo no BRL Health.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <Suspense
              fallback={
                <div className="flex h-48 items-center justify-center">
                  <Loader2Icon className="size-5 animate-spin text-brl-purple" />
                </div>
              }
            >
              <VerifyEmailForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
