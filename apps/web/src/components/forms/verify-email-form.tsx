"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  CheckCircle2Icon,
  Loader2Icon,
  MailCheckIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { requestEmailVerification, verifyEmail } from "@/services/auth.service";

const RESEND_COOLDOWN_SECONDS = 30;

const verifyEmailSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Digite o código de 6 dígitos"),
});

type VerifyEmailValues = z.infer<typeof verifyEmailSchema>;

function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-1.5 text-xs font-medium text-destructive">
      {children}
    </p>
  );
}

export function VerifyEmailForm() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  // O e-mail pode vir da URL (logo após o cadastro) ou da sessão atual.
  const email = searchParams.get("email") ?? user?.email ?? "";

  const [verified, setVerified] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  // Já começa em contagem: assumimos que o código foi enviado ao chegar aqui.
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  // Conta regressiva do reenvio, 1s por tick (sem live region pra não spammar
  // leitores de tela a cada segundo).
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const verifyMutation = useMutation<
    { message: string },
    Error,
    VerifyEmailValues
  >({
    mutationFn: ({ code }) => verifyEmail(code),
    onSuccess: () => {
      setAuthError(null);
      setVerified(true);
      toast({
        variant: "success",
        title: "E-mail verificado!",
        description: "Sua conta está confirmada.",
      });
    },
    onError: (error) => {
      setAuthError(error.message);
    },
  });

  const resendMutation = useMutation<{ message: string }, Error, void>({
    mutationFn: () => requestEmailVerification(),
    onSuccess: () => {
      setCooldown(RESEND_COOLDOWN_SECONDS);
      toast({
        variant: "success",
        title: "Código reenviado",
        description: "Confira sua caixa de entrada (e o spam).",
      });
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: "Não consegui reenviar",
        description: error.message,
      });
    },
  });

  const form = useForm({
    defaultValues: { code: "" } as VerifyEmailValues,
    validators: { onSubmit: verifyEmailSchema },
    onSubmit: async ({ value }) => {
      setAuthError(null);
      await verifyMutation.mutateAsync(value);
    },
  });

  if (verified) {
    return (
      <div className="flex flex-col gap-5">
        <div
          role="status"
          className="flex items-start gap-3 rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-foreground"
        >
          <CheckCircle2Icon
            aria-hidden
            className="mt-0.5 size-5 shrink-0 text-emerald-400"
          />
          <span>Tudo certo! Seu e-mail foi verificado com sucesso.</span>
        </div>

        <Button
          size="lg"
          nativeButton={false}
          className="h-11 bg-brl-purple text-white hover:bg-brl-purple/90"
          render={<Link href="/nutri">Ir para o app</Link>}
        />
      </div>
    );
  }

  const resendDisabled = cooldown > 0 || resendMutation.isPending;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
      noValidate
      className="flex flex-col gap-5"
    >
      <div
        role="status"
        className="flex items-start gap-3 rounded-lg border border-foreground/10 bg-brl-purple/5 p-4 text-sm text-muted-foreground"
      >
        <MailCheckIcon
          aria-hidden
          className="mt-0.5 size-5 shrink-0 text-brl-purple"
        />
        <span>
          Enviamos um código de 6 dígitos
          {email ? (
            <>
              {" "}
              para{" "}
              <span className="font-medium text-foreground">{email}</span>
            </>
          ) : (
            " para o seu e-mail"
          )}
          . Digite-o abaixo para confirmar sua conta.
        </span>
      </div>

      {authError ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertCircleIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>{authError}</span>
        </div>
      ) : null}

      <form.Field name="code">
        {(field) => {
          const error = field.state.meta.errors?.[0];
          const errorMessage =
            typeof error === "string" ? error : error?.message;
          return (
            <div>
              <Label htmlFor={field.name}>Código de verificação</Label>
              <Input
                id={field.name}
                name={field.name}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) =>
                  field.handleChange(
                    event.target.value.replace(/\D/g, "").slice(0, 6),
                  )
                }
                aria-invalid={Boolean(errorMessage)}
                className={cn(
                  "mt-2 h-12 text-center font-mono text-2xl tracking-[0.5em]",
                )}
              />
              <FieldError>{errorMessage}</FieldError>
            </div>
          );
        }}
      </form.Field>

      <Button
        type="submit"
        size="lg"
        className="mt-2 h-11 bg-brl-purple text-white hover:bg-brl-purple/90"
        disabled={verifyMutation.isPending}
      >
        {verifyMutation.isPending ? (
          <>
            <Loader2Icon className="animate-spin" />
            Verificando...
          </>
        ) : (
          "Verificar e-mail"
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Não recebeu o código?{" "}
        <button
          type="button"
          onClick={() => resendMutation.mutate()}
          disabled={resendDisabled}
          className="font-medium text-brl-purple outline-none hover:underline focus-visible:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
        >
          {resendMutation.isPending
            ? "Reenviando..."
            : cooldown > 0
              ? `Reenviar em ${cooldown}s`
              : "Reenviar código"}
        </button>
      </p>

      <Link
        href="/login"
        className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-brl-purple hover:underline"
      >
        <ArrowLeftIcon className="size-4" />
        Voltar para o login
      </Link>
    </form>
  );
}
