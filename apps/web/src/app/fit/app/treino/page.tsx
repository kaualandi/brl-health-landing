import type { Metadata } from "next";

import { RequireAuth } from "@/components/auth/require-auth";
import { FitWorkout } from "@/components/fit/fit-workout";

export const metadata: Metadata = {
  title: "Treino em andamento — BRL Fit",
};

export default function FitWorkoutPage() {
  return (
    <RequireAuth>
      <FitWorkout />
    </RequireAuth>
  );
}
