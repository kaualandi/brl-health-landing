import type { Metadata } from "next";

import { RequireAuth } from "@/components/auth/require-auth";
import { ExerciseDetail } from "@/components/fit/exercise-detail";

export const metadata: Metadata = {
  title: "Exercício — BRL Fit",
};

export default async function ExerciseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <RequireAuth>
      <ExerciseDetail id={id} />
    </RequireAuth>
  );
}
