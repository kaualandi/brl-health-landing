import type { Metadata } from "next";

import { RequireAuth } from "@/components/auth/require-auth";
import { FitWorkout } from "@/components/fit/fit-workout";

export const metadata: Metadata = {
  title: "Treino em andamento — BRL Fit",
};

export default async function FitWorkoutPage({ searchParams }: { searchParams: Promise<{ dia?: string }> }) {
  const dia = Number.parseInt((await searchParams).dia ?? "", 10);
  return (
    <RequireAuth>
      <FitWorkout day={Number.isInteger(dia) ? dia : undefined} />
    </RequireAuth>
  );
}
