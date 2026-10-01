"use client";

import { useMutation } from "@tanstack/react-query";
import { CheckCircle2Icon, Loader2Icon } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { joinWaitlist, type WaitlistSource } from "@/services/waitlist.service";
import { cn } from "@/lib/utils";

const emailSchema = z.string().email("Digite um e-mail válido");

export function WaitlistForm({
  source = "fit",
  cta = "Quero ser avisado",
  className,
}: {
  source?: WaitlistSource;
  cta?: string;
  className?: string;
}) {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: (value: string) => joinWaitlist(value, source),
    onSuccess: () => {
      setDone(true);
      toast({
        variant: "success",
        title: "Você está na lista! 🎉",
        description: "A gente te avisa assim que liberar.",
      });
    },
    onError: () => {
      toast({
        variant: "error",
        title: "Não deu pra cadastrar",
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
      <div
        role="status"
        className={cn(
          "flex items-center gap-3 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-foreground",
          className,
        )}
      >
        <CheckCircle2Icon className="size-5 shrink-0 text-emerald-400" />
        <span>
          Prontinho! Te avisamos no <strong>{email.trim()}</strong> assim que
          lançar.
        </span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className={cn("w-full", className)}>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor={`waitlist-${source}`} className="sr-only">
            Seu e-mail
          </label>
          <Input
            id={`waitlist-${source}`}
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
            className="h-12 text-base"
          />
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={mutation.isPending}
          className="h-12 shrink-0 bg-brl-orange px-6 text-base text-brl-dark hover:bg-brl-orange/90"
        >
          {mutation.isPending ? (
            <>
              <Loader2Icon className="animate-spin" />
              Enviando...
            </>
          ) : (
            cta
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
