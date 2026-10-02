import type { Metadata } from "next";
import { Suspense } from "react";

import { RequireAuth } from "@/components/auth/require-auth";
import { FitApp } from "@/components/fit/fit-app";

export const metadata: Metadata = {
  title: "Meu BRL Fit — seu treino de hoje",
};

export default function FitAppPage() {
  return (
    <RequireAuth>
      <Suspense>
        <FitApp />
      </Suspense>
    </RequireAuth>
  );
}
