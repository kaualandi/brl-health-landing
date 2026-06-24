"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  CheckIcon,
  LockIcon,
  Loader2Icon,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { usePlan } from "@/hooks/use-plan";
import { getPlanById } from "@/services/plans.service";
import {
  processPayment,
  type CardPayload,
  type CheckoutResult,
} from "@/services/billing.service";
import type { PlanId } from "@/types";

function formatCardNumber(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-1.5 text-xs font-medium text-destructive">
      {children}
    </p>
  );
}

export function Checkout({ planId }: { planId: string }) {
  const router = useRouter();
  const toast = useToast();
  const { setTier } = usePlan();

  const plan = getPlanById(planId as PlanId);

  const [holder, setHolder] = useState("");
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  // Plano inválido ou gratuito não tem checkout.
  useEffect(() => {
    if (!plan || plan.id === "free") {
      router.replace("/precos");
    }
  }, [plan, router]);

  const mutation = useMutation<CheckoutResult, Error, CardPayload>({
    mutationFn: (card) => processPayment(plan!.id, card),
    onSuccess: () => {
      setTier(plan!.id);
      setDone(true);
      toast({
        variant: "success",
        title: "Pagamento aprovado! 🎉",
        description: `Bem-vindo ao ${plan!.name}.`,
      });
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: "Pagamento não aprovado",
        description: error.message,
      });
    },
  });

  if (!plan || plan.id === "free") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-brl-dark">
        <Loader2Icon className="size-6 animate-spin text-brl-purple" />
      </div>
    );
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (holder.trim().length < 3) next.holder = "Informe o nome impresso no cartão";
    if (number.replace(/\D/g, "").length !== 16)
      next.number = "Número do cartão incompleto";
    const [mm, yy] = expiry.split("/");
    const month = Number(mm);
    if (!mm || !yy || yy.length !== 2 || month < 1 || month > 12)
      next.expiry = "Validade inválida (MM/AA)";
    if (cvv.replace(/\D/g, "").length < 3) next.cvv = "CVV inválido";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validate()) return;
    mutation.mutate({ holder: holder.trim(), number, expiry, cvv });
  }

  if (done) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-brl-dark px-4 py-16 text-center">
        <CheckCircle2Icon
          aria-hidden
          className="size-16 text-emerald-400"
          strokeWidth={1.5}
        />
        <h1 className="mt-6 font-display text-3xl font-extrabold tracking-tight text-balance md:text-4xl">
          Você agora é {plan.name}. 🎉
        </h1>
        <p className="mt-3 max-w-sm text-base text-muted-foreground">
          Tudo certo com o pagamento. Seus recursos já estão liberados — bora
          usar.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            size="lg"
            nativeButton={false}
            className="h-12 bg-brl-purple px-6 text-base text-white hover:bg-brl-purple/90"
            render={<Link href="/nutri">Ir pro meu Nutri</Link>}
          />
          <Button
            size="lg"
            variant="outline"
            nativeButton={false}
            className="h-12 border-white/15 bg-white/5 px-6 text-base hover:bg-white/10"
            render={<Link href="/conta">Ver minha conta</Link>}
          />
        </div>
      </div>
    );
  }

  const submitting = mutation.isPending;

  return (
    <div className="min-h-dvh bg-brl-dark">
      <header className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 pt-6 md:px-6">
        <Link
          href="/precos"
          className="font-display text-lg font-extrabold tracking-tight"
          aria-label="BRL Health — planos"
        >
          <span className="text-brl-purple">BRL</span>
          <span className="text-foreground"> Health</span>
        </Link>
        <Link
          href="/precos"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          Voltar aos planos
        </Link>
      </header>

      <main className="mx-auto grid w-full max-w-4xl gap-8 px-4 py-10 md:grid-cols-[1fr_1.1fr] md:px-6 md:py-14">
        {/* Resumo */}
        <section className="order-2 md:order-1">
          <h2 className="font-display text-sm font-medium tracking-wide text-brl-purple uppercase">
            Resumo
          </h2>
          <div className="mt-4 rounded-2xl border border-white/5 bg-brl-card p-6">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-xl font-bold">
                {plan.name}
              </span>
              <span className="font-display text-2xl font-extrabold tracking-tight">
                {plan.priceLabel}
                <span className="text-sm font-normal text-muted-foreground">
                  /mês
                </span>
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
            <ul className="mt-5 flex flex-col gap-2.5 border-t border-white/5 pt-5">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2.5 text-sm text-foreground/90"
                >
                  <CheckIcon className="mt-0.5 size-4 shrink-0 text-brl-purple" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <LockIcon className="size-3.5" />
            Cobrança mensal. Cancele quando quiser.
          </p>
        </section>

        {/* Pagamento */}
        <section className="order-1 md:order-2">
          <h2 className="font-display text-sm font-medium tracking-wide text-brl-purple uppercase">
            Pagamento
          </h2>
          <form
            onSubmit={handleSubmit}
            noValidate
            className="mt-4 flex flex-col gap-5 rounded-2xl border border-white/5 bg-brl-card p-6 md:p-7"
          >
            <div>
              <Label htmlFor="holder">Nome no cartão</Label>
              <Input
                id="holder"
                autoComplete="cc-name"
                placeholder="Como está impresso"
                value={holder}
                onChange={(e) => setHolder(e.target.value)}
                aria-invalid={Boolean(errors.holder)}
                disabled={submitting}
                className="mt-2 h-11"
              />
              <FieldError>{errors.holder}</FieldError>
            </div>

            <div>
              <Label htmlFor="number">Número do cartão</Label>
              <Input
                id="number"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="0000 0000 0000 0000"
                value={number}
                onChange={(e) => setNumber(formatCardNumber(e.target.value))}
                aria-invalid={Boolean(errors.number)}
                disabled={submitting}
                className="mt-2 h-11 tabular-nums"
              />
              <FieldError>{errors.number}</FieldError>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiry">Validade</Label>
                <Input
                  id="expiry"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  placeholder="MM/AA"
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  aria-invalid={Boolean(errors.expiry)}
                  disabled={submitting}
                  className="mt-2 h-11 tabular-nums"
                />
                <FieldError>{errors.expiry}</FieldError>
              </div>
              <div>
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  placeholder="123"
                  value={cvv}
                  onChange={(e) =>
                    setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  aria-invalid={Boolean(errors.cvv)}
                  disabled={submitting}
                  className="mt-2 h-11 tabular-nums"
                />
                <FieldError>{errors.cvv}</FieldError>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="mt-1 h-12 w-full bg-brl-purple text-base text-white hover:bg-brl-purple/90"
            >
              {submitting ? (
                <>
                  <Loader2Icon className="animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <LockIcon />
                  Pagar {plan.priceLabel}/mês
                </>
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              É um checkout de demonstração — não use um cartão real.
            </p>
          </form>
        </section>
      </main>
    </div>
  );
}
