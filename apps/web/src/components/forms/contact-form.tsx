"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  Loader2Icon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { sendContactMessage } from "@/services/contact.service";
import type { ContactFormData, ContactSubject } from "@/types";

const contactSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  email: z.string().email("E-mail inválido"),
  subject: z.enum(["duvida", "sugestao", "parceria", "outro"], {
    message: "Selecione um assunto",
  }),
  message: z
    .string()
    .min(10, "Mensagem muito curta")
    .max(500, "Máximo 500 caracteres"),
});

type ContactValues = z.infer<typeof contactSchema>;

const MESSAGE_MAX = 500;

const subjectOptions: { value: ContactSubject; label: string }[] = [
  { value: "duvida", label: "Tenho uma dúvida" },
  { value: "sugestao", label: "Sugestão de melhoria" },
  { value: "parceria", label: "Proposta de parceria" },
  { value: "outro", label: "Outro assunto" },
];

const defaultValues: ContactValues = {
  name: "",
  email: "",
  subject: "" as ContactSubject,
  message: "",
};

function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-1.5 text-xs font-medium text-destructive">
      {children}
    </p>
  );
}

function SuccessCard({ onReset }: { onReset: () => void }) {
  return (
    <div
      role="status"
      className="flex flex-col items-center rounded-2xl border border-white/5 bg-brl-card p-10 text-center"
    >
      <CheckCircle2Icon
        aria-hidden
        className="size-16 text-emerald-400"
        strokeWidth={1.5}
      />
      <h3 className="mt-5 font-display text-2xl font-extrabold tracking-tight text-foreground">
        Mensagem enviada!
      </h3>
      <p className="mt-3 max-w-sm text-sm text-muted-foreground">
        A gente recebeu sua mensagem e vai responder em breve. 📬
      </p>
      <Button
        type="button"
        size="lg"
        variant="outline"
        className="mt-6 h-11 border-white/15 bg-white/5 px-5 text-sm hover:bg-white/10"
        onClick={onReset}
      >
        Enviar outra mensagem
      </Button>
    </div>
  );
}

export function ContactForm() {
  const toast = useToast();
  const [sent, setSent] = useState(false);

  const mutation = useMutation<void, Error, ContactFormData>({
    mutationFn: (data) => sendContactMessage(data),
    onSuccess: () => {
      setSent(true);
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: "Não consegui enviar",
        description: error.message || "Tenta de novo daqui a pouco.",
      });
    },
  });

  const form = useForm({
    defaultValues,
    validators: { onSubmit: contactSchema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value satisfies ContactFormData);
    },
  });

  if (sent) {
    return (
      <SuccessCard
        onReset={() => {
          form.reset();
          mutation.reset();
          setSent(false);
        }}
      />
    );
  }

  const isLoading = mutation.isPending;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
      noValidate
      aria-busy={isLoading}
      className="flex flex-col gap-5 rounded-2xl border border-white/5 bg-brl-card p-6 md:p-8"
    >
      <form.Field name="name">
        {(field) => {
          const error = field.state.meta.errors?.[0];
          const errorMessage =
            typeof error === "string" ? error : error?.message;
          return (
            <div>
              <Label htmlFor={field.name}>Nome completo</Label>
              <Input
                id={field.name}
                name={field.name}
                type="text"
                autoComplete="name"
                placeholder="Seu nome"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                disabled={isLoading}
                aria-invalid={Boolean(errorMessage)}
                className={cn("mt-2 h-11")}
              />
              <FieldError>{errorMessage}</FieldError>
            </div>
          );
        }}
      </form.Field>

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
                placeholder="seu@email.com"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                disabled={isLoading}
                aria-invalid={Boolean(errorMessage)}
                className={cn("mt-2 h-11")}
              />
              <FieldError>{errorMessage}</FieldError>
            </div>
          );
        }}
      </form.Field>

      <form.Field name="subject">
        {(field) => {
          const error = field.state.meta.errors?.[0];
          const errorMessage =
            typeof error === "string" ? error : error?.message;
          return (
            <div>
              <Label htmlFor={field.name}>Assunto</Label>
              <select
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) =>
                  field.handleChange(event.target.value as ContactSubject)
                }
                disabled={isLoading}
                aria-invalid={Boolean(errorMessage)}
                className={cn(
                  "mt-2 h-11 w-full rounded-lg border border-input bg-transparent px-3 text-sm text-foreground transition-colors outline-none",
                  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
                  "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
                  !field.state.value && "text-muted-foreground",
                )}
              >
                <option value="" disabled>
                  Selecione um assunto
                </option>
                {subjectOptions.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    className="bg-brl-card text-foreground"
                  >
                    {option.label}
                  </option>
                ))}
              </select>
              <FieldError>{errorMessage}</FieldError>
            </div>
          );
        }}
      </form.Field>

      <form.Field name="message">
        {(field) => {
          const error = field.state.meta.errors?.[0];
          const errorMessage =
            typeof error === "string" ? error : error?.message;
          const length = field.state.value.length;
          return (
            <div>
              <div className="flex items-baseline justify-between gap-3">
                <Label htmlFor={field.name}>Mensagem</Label>
                <span
                  aria-live="polite"
                  className={cn(
                    "text-xs tabular-nums text-brl-muted",
                    length > MESSAGE_MAX && "text-destructive",
                  )}
                >
                  {length} / {MESSAGE_MAX}
                </span>
              </div>
              <textarea
                id={field.name}
                name={field.name}
                rows={5}
                placeholder="Conta mais..."
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                disabled={isLoading}
                aria-invalid={Boolean(errorMessage)}
                className={cn(
                  "mt-2 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground transition-colors outline-none placeholder:text-muted-foreground",
                  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
                  "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
                  "resize-y",
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
        className="mt-2 h-12 w-full bg-brl-purple text-base text-white hover:bg-brl-purple/90"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2Icon className="animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            Enviar mensagem
            <ArrowRightIcon />
          </>
        )}
      </Button>
    </form>
  );
}
