"use client";

import { Share2Icon } from "lucide-react";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { computeNutriPlan } from "@/lib/nutri-plan";
import { dietLabel, goalLabel } from "@/lib/nutri-options";
import {
  getNutriProfileServerSnapshot,
  getNutriProfileSnapshot,
  subscribeNutriProfile,
} from "@/services/nutri.service";
import type { NutriPlan, NutriProfile } from "@/types";

/** Resumo em texto do plano, pronto pra compartilhar/colar. */
function buildSummary(profile: NutriProfile, plan: NutriPlan): string {
  return [
    "Meu plano BRL Nutri 🥗",
    "",
    `🎯 Objetivo: ${goalLabel(profile.goal)}`,
    `🥦 Dieta: ${dietLabel(profile.diet)}`,
    `🔥 Meta: ${plan.targetCalories} kcal/dia`,
    `🍗 Proteína ${plan.protein}g · 🍚 Carbo ${plan.carbs}g · 🥑 Gordura ${plan.fat}g`,
    `💧 Água: ${plan.waterMl} ml/dia`,
    "",
    "Monte o seu em brl.health",
  ].join("\n");
}

/** Compartilha o plano nutricional via Web Share API, com fallback pro clipboard. */
export function SharePlan() {
  const toast = useToast();
  const profile = useSyncExternalStore(
    subscribeNutriProfile,
    getNutriProfileSnapshot,
    getNutriProfileServerSnapshot,
  );

  if (!profile) return null;

  const plan = computeNutriPlan(profile);
  const summary = buildSummary(profile, plan);

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(summary);
      toast({
        variant: "success",
        title: "Resumo copiado!",
        description: "Cole onde quiser compartilhar.",
      });
    } catch {
      toast({
        variant: "error",
        title: "Não consegui copiar",
        description: "Tenta de novo daqui a pouco.",
      });
    }
  }

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Meu plano BRL Nutri", text: summary });
      } catch (error) {
        // Usuário cancelou o share nativo — sem erro a mostrar.
        if ((error as Error)?.name !== "AbortError") {
          await copyToClipboard();
        }
      }
      return;
    }
    await copyToClipboard();
  }

  return (
    <Button
      variant="outline"
      onClick={handleShare}
      className="w-fit border-foreground/15 bg-foreground/5 hover:bg-foreground/10"
    >
      <Share2Icon />
      Compartilhar meu plano
    </Button>
  );
}
