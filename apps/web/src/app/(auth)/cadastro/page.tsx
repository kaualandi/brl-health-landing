import type { Metadata } from "next";

import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export const metadata: Metadata = {
  title: "Criar conta — BRL Nutri",
  description:
    "Monte seu plano alimentar personalizado em poucos passos. Sem cartão, sem complicação.",
};

export default function RegisterPage() {
  return <OnboardingWizard />;
}
