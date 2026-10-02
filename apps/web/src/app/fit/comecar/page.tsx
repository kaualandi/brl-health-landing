import type { Metadata } from "next";

import { RequireAuth } from "@/components/auth/require-auth";
import { FitOnboarding } from "@/components/fit/fit-onboarding";

export const metadata: Metadata = {
  title: "Monte seu perfil de treino — BRL Fit",
};

export default function FitStartPage() {
  return (
    <RequireAuth>
      <FitOnboarding />
    </RequireAuth>
  );
}
