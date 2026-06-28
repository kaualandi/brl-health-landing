"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  LogOutIcon,
  RotateCcwIcon,
  SaladIcon,
  Trash2Icon,
} from "lucide-react";
import { useState, useSyncExternalStore } from "react";

import { SharePlan } from "@/components/account/share-plan";
import { PlanManager } from "@/components/plan/plan-manager";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/use-auth";
import { computeNutriPlan } from "@/lib/nutri-plan";
import { goalLabel } from "@/lib/nutri-options";
import {
  clearNutriProfile,
  getNutriProfileServerSnapshot,
  getNutriProfileSnapshot,
  subscribeNutriProfile,
} from "@/services/nutri.service";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-foreground/5 bg-brl-card p-6 md:p-8">
      <h2 className="font-display text-lg font-bold text-foreground">
        {title}
      </h2>
      {description ? (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      ) : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-foreground/5 py-3 first:pt-0 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

export function AccountView() {
  const router = useRouter();
  const toast = useToast();
  const { user, logout } = useAuth();
  const profile = useSyncExternalStore(
    subscribeNutriProfile,
    getNutriProfileSnapshot,
    getNutriProfileServerSnapshot,
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!user) return null;

  const memberSince =
    profile && profile.createdAt
      ? new Date(profile.createdAt).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : null;

  const plan = profile ? computeNutriPlan(profile) : null;

  function handleLogout() {
    logout();
    toast({ title: "Você saiu da sua conta." });
    router.push("/");
  }

  function handleResetPlan() {
    clearNutriProfile();
    toast({ title: "Plano apagado", description: "Vamos montar um novo." });
    router.push("/cadastro");
  }

  function handleDelete() {
    clearNutriProfile();
    logout();
    toast({ title: "Conta excluída", description: "Sentiremos sua falta. 💜" });
    router.push("/");
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-28 pb-20 md:px-6 md:pt-32">
      <header className="mb-8">
        <p className="text-sm text-muted-foreground">Configurações</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight md:text-4xl">
          Minha conta
        </h1>
      </header>

      <div className="flex flex-col gap-5">
        <Section title="Dados da conta">
          <Row label="Nome" value={user.name} />
          <Row label="E-mail" value={user.email} />
          {memberSince ? <Row label="Membro desde" value={memberSince} /> : null}
        </Section>

        <Section
          title="Seu BRL Nutri"
          description={
            profile
              ? "Seu plano alimentar personalizado."
              : "Você ainda não montou seu plano alimentar."
          }
        >
          {profile && plan ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-foreground/10 bg-foreground/5 px-3 py-1 text-xs font-medium">
                  🎯 {goalLabel(profile.goal)}
                </span>
                <span className="rounded-full border border-foreground/10 bg-foreground/5 px-3 py-1 text-xs font-medium">
                  🔥 {plan.targetCalories} kcal/dia
                </span>
                <span className="rounded-full border border-foreground/10 bg-foreground/5 px-3 py-1 text-xs font-medium">
                  💧 {plan.waterMl} ml de água
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  nativeButton={false}
                  className="w-fit bg-brl-purple text-white hover:bg-brl-purple/90"
                  render={
                    <Link href="/nutri">
                      <SaladIcon />
                      Abrir meu Nutri
                    </Link>
                  }
                />
                <SharePlan />
              </div>
            </div>
          ) : (
            <Button
              nativeButton={false}
              className="w-fit bg-brl-purple text-white hover:bg-brl-purple/90"
              render={
                <Link href="/cadastro">
                  Montar meu plano
                  <ArrowRightIcon />
                </Link>
              }
            />
          )}
        </Section>

        <Section
          title="Assinatura"
          description="Faça upgrade, mude de plano ou cancele quando quiser."
        >
          <PlanManager />
        </Section>

        <Section
          title="Zona de perigo"
          description="Ações que mudam ou apagam seus dados."
        >
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                className="border-foreground/15 bg-foreground/5 hover:bg-foreground/10"
                onClick={handleResetPlan}
              >
                <RotateCcwIcon />
                Refazer meu plano
              </Button>
              <Button
                variant="outline"
                className="border-foreground/15 bg-foreground/5 hover:bg-foreground/10"
                onClick={handleLogout}
              >
                <LogOutIcon />
                Sair da conta
              </Button>
            </div>

            <div className="mt-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              {confirmDelete ? (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-foreground">
                    Tem certeza? Isso apaga seu plano e sua conta neste
                    dispositivo.
                  </p>
                  <div className="flex gap-3">
                    <Button variant="destructive" onClick={handleDelete}>
                      <Trash2Icon />
                      Sim, excluir
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setConfirmDelete(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Excluir conta
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Remove seus dados deste navegador.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2Icon />
                    Excluir conta
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
