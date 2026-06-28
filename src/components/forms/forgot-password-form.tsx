"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeftIcon, CheckCircle2Icon, Loader2Icon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { requestPasswordReset } from "@/services/auth.service";

const forgotPasswordSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-1.5 text-xs font-medium text-destructive">
      {children}
    </p>
  );
}

export function ForgotPasswordForm() {
  const toast = useToast();
  const [sent, setSent] = useState(false);

  const mutation = useMutation<{ message: string }, Error, ForgotPasswordValues>(
    {
      mutationFn: ({ email }) => requestPasswordReset(email),
      onSuccess: () => {
        setSent(true);
        toast({
          variant: "success",
          title: "Pronto!",
          description:
            "Se houver uma conta com esse e-mail, o link já está a caminho.",
        });
      },
      onError: (error) => {
        toast({
          variant: "error",
          title: "Algo deu errado",
          description: error.message,
        });
      },
    },
  );

  const form = useForm({
    defaultValues: { email: "" } as ForgotPasswordValues,
    validators: { onSubmit: forgotPasswordSchema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value);
    },
  });

  if (sent) {
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
          <span>
            Se houver uma conta com esse e-mail, enviamos um link para redefinir
            a senha.
          </span>
        </div>

        <Button
          size="lg"
          nativeButton={false}
          className="h-11 bg-brl-purple text-white hover:bg-brl-purple/90"
          render={<Link href="/login">Voltar para o login</Link>}
        />
      </div>
    );
  }

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
      <form.Field name="email">
        {(field) => {
          const error = field.state.meta.errors?.[0];
          const errorMessage =
            typeof error === "string" ? error : error?.message;
          return (
            <div>
              <Label htmlFor={field.name}>E-mail</Label>
              <Input
                id={field.name}
                name={field.name}
                type="email"
                autoComplete="email"
                placeholder="voce@brl.com"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                aria-invalid={Boolean(errorMessage)}
                className={cn("mt-2 h-11")}
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
        disabled={mutation.isPending}
      >
        {mutation.isPending ? (
          <>
            <Loader2Icon className="animate-spin" />
            Enviando...
          </>
        ) : (
          "Enviar link de redefinição"
        )}
      </Button>

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
