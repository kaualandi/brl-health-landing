import type { Metadata } from "next";
import { Suspense } from "react";

import { RequireAuth } from "@/components/auth/require-auth";
import { ExerciseLibrary } from "@/components/fit/exercise-library";

export const metadata: Metadata = {
  title: "Biblioteca de exercícios — BRL Fit",
};

export default function ExercisesPage() {
  return (
    <RequireAuth>
      <Suspense>
        <ExerciseLibrary />
      </Suspense>
    </RequireAuth>
  );
}
