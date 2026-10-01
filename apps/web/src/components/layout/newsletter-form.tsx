"use client";

import { useMutation } from "@tanstack/react-query";
import { ArrowRightIcon, CheckCircle2Icon, Loader2Icon } from "lucide-react";
import { useId, useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { joinWaitlist } from "@/services/waitlist.service";
import { cn } from "@/lib/utils";

const emailSchema = z.string().email("Digite um e-mail válido");

/** Inscrição na newsletter (reusa o waitlist com source "newsletter"). */
export function NewsletterForm({ className }: { className?: string }) {
  const toast = useToast();
  const inputId = useId();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: (value: string) => joinWaitlist(value, "newsletter"),
    onSuccess: () => {
      setDone(true);
      toast({
        variant: "success",
        title: "Inscrição confirmada! 🎉",
        description: "As melhores dicas chegam no seu e-mail.",
      });
    },
    onError: () => {
      toast({
        variant: "error",
        title: "Não deu pra inscrever",
        description: "Tenta de novo daqui a pouco.",
      });
    },
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const result = emailSchema.safeParse(email.trim());
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "E-mail inválido");
      return;
    }
    setError(null);
    mutation.mutate(result.data);
  }

  if (done) {
    return (
      <p
        role="status"
        className={cn(
          "flex items-center gap-2 text-sm text-foreground",
          className,
        )}
      >
        <CheckCircle2Icon className="size-4 shrink-0 text-emerald-400" />
        Prontinho! Te avisamos por e-mail.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className={cn("w-full", className)}>
      <div className="flex gap-2">
        <div className="flex-1">
          <label htmlFor={inputId} className="sr-only">
            Seu e-mail
          </label>
          <Input
            id={inputId}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (error) setError(null);
            }}
            aria-invalid={Boolean(error)}
            disabled={mutation.isPending}
            className="h-10"
          />
        </div>
        <Button
          type="submit"
          size="icon-lg"
          aria-label="Inscrever na newsletter"
          disabled={mutation.isPending}
          className="size-10 shrink-0 bg-brl-purple text-white hover:bg-brl-purple/90"
        >
          {mutation.isPending ? (
            <Loader2Icon className="animate-spin" />
          ) : (
            <ArrowRightIcon />
          )}
        </Button>
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </form>
  );
}
