import type { Metadata } from "next";

import { RequireAuth } from "@/components/auth/require-auth";
import { FitProfileEditor } from "@/components/fit/fit-profile-editor";

export const metadata: Metadata = {
  title: "Editar perfil de treino — BRL Fit",
};

export default function FitProfilePage() {
  return (
    <RequireAuth>
      <FitProfileEditor />
    </RequireAuth>
  );
}
