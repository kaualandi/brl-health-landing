import type { Metadata } from "next";

import { RequireAuth } from "@/components/auth/require-auth";
import { NutriHome } from "@/components/nutri/nutri-home";

export const metadata: Metadata = {
  title: "Meu BRL Nutri — seu plano personalizado",
  description:
    "Seu resumo nutricional: calorias, macros, hidratação e conteúdos úteis pra sua fase.",
};

export default function NutriPage() {
  return (
    <RequireAuth>
      <NutriHome />
    </RequireAuth>
  );
}
