"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircleIcon, EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { loginUser } from "@/services/auth.service";
import type { AuthResponse } from "@/types";

/** Só aceita caminhos internos — evita open redirect via `?next=`. */
function safeNext(value: string | null): string {
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return "/nutri";
}

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

type LoginValues = z.infer<typeof loginSchema>;

function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className="mt-1.5 text-xs font-medium text-destructive"
    >
      {children}
    </p>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className="size-5">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      fill="currentColor"
      className="size-5"
    >
      <path d="M17.05 12.04c-.03-2.6 2.12-3.85 2.22-3.91-1.21-1.77-3.09-2.01-3.76-2.04-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.89-1.74.03-3.35 1.01-4.25 2.57-1.81 3.14-.46 7.79 1.3 10.34.86 1.25 1.89 2.65 3.23 2.6 1.3-.05 1.79-.84 3.36-.84 1.57 0 2.01.84 3.39.81 1.4-.02 2.29-1.27 3.15-2.53.99-1.45 1.4-2.86 1.42-2.93-.03-.01-2.72-1.04-2.75-4.13M14.6 4.59c.71-.86 1.19-2.06 1.06-3.25-1.02.04-2.26.68-3 1.54-.66.76-1.24 1.98-1.09 3.15 1.14.09 2.31-.58 3.03-1.44" />
    </svg>
  );
}

function SocialButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      onClick={onClick}
      aria-label={`Continuar com ${label}`}
      className="h-11 flex-1 gap-2 border-foreground/15 bg-foreground/5 text-sm text-foreground hover:bg-foreground/10"
    >
      {icon}
      {label}
    </Button>
  );
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { login } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const mutation = useMutation<AuthResponse, Error, LoginValues>({
    mutationFn: ({ email, password }) => loginUser(email, password),
    onSuccess: (data) => {
      setAuthError(null);
      login(data.user, data.token, data.refreshToken);
      toast({
        variant: "success",
        title: `Bem-vindo de volta, ${data.user.name.split(" ")[0]}!`,
      });
      router.push(safeNext(searchParams.get("next")));
    },
    onError: (error) => {
      setAuthError(error.message);
    },
  });

  const form = useForm({
    defaultValues: { email: "", password: "" } as LoginValues,
    validators: { onSubmit: loginSchema },
    onSubmit: async ({ value }) => {
      setAuthError(null);
      await mutation.mutateAsync(value);
    },
  });

  function handleSocial(provider: string) {
    toast({
      variant: "info",
      title: "Login social chega em breve",
      description: `Entrar com ${provider} vai estar disponível em breve.`,
    });
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
      <div className="flex gap-3">
        <SocialButton
          label="Google"
          icon={<GoogleIcon />}
          onClick={() => handleSocial("Google")}
        />
        <SocialButton
          label="Apple"
          icon={<AppleIcon />}
          onClick={() => handleSocial("Apple")}
        />
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span aria-hidden className="h-px flex-1 bg-foreground/10" />
        <span>ou continue com e-mail</span>
        <span aria-hidden className="h-px flex-1 bg-foreground/10" />
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

      <form.Field name="password">
        {(field) => {
          const error = field.state.meta.errors?.[0];
          const errorMessage =
            typeof error === "string" ? error : error?.message;
          return (
            <div>
              <Label htmlFor={field.name}>Senha</Label>
              <div className="relative mt-2">
                <Input
                  id={field.name}
                  name={field.name}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={Boolean(errorMessage)}
                  className={cn("h-11 pr-11")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground"
                >
                  {showPassword ? (
                    <EyeOffIcon className="size-4" />
                  ) : (
                    <EyeIcon className="size-4" />
                  )}
                </button>
              </div>
              <FieldError>{errorMessage}</FieldError>
            </div>
          );
        }}
      </form.Field>

      <div className="-mt-2 text-right">
        <Link
          href="/recuperar-senha"
          className="text-sm font-medium text-brl-purple hover:underline"
        >
          Esqueci minha senha
        </Link>
      </div>

      <Button
        type="submit"
        size="lg"
        className="mt-2 h-11 bg-brl-purple text-white hover:bg-brl-purple/90"
        disabled={mutation.isPending}
      >
        {mutation.isPending ? (
          <>
            <Loader2Icon className="animate-spin" />
            Entrando...
          </>
        ) : (
          "Entrar"
        )}
      </Button>
    </form>
  );
}
