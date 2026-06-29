import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeftIcon, Loader2Icon } from "lucide-react";
import { Suspense } from "react";

import { RedirectIfAuth } from "@/components/auth/redirect-if-auth";
import { LoginForm } from "@/components/forms/login-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Entrar — BRL Health",
};

export default function LoginPage() {
  return (
    <RedirectIfAuth>
      <main className="flex min-h-dvh items-center justify-center bg-brl-dark px-4 py-12">
        <div className="w-full max-w-md">
          <Button
            variant="ghost"
            nativeButton={false}
            className="mb-4 pl-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
            render={
              <Link href="/" aria-label="Voltar para a landing page">
                <ArrowLeftIcon />
                Voltar para a tela inicial
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
                Bem-vindo de volta.
              </CardTitle>
              <CardDescription>
                Entre para continuar do ponto onde parou.
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
                <LoginForm />
              </Suspense>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Não tem conta?{" "}
                <Link
                  href="/cadastro"
                  className="font-medium text-brl-purple hover:underline"
                >
                  Criar conta
                </Link>
              </p>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Dica: use <span className="font-mono">demo@brl.com</span> /{" "}
            <span className="font-mono">123456</span> pra testar.
          </p>
        </div>
      </main>
    </RedirectIfAuth>
  );
}
