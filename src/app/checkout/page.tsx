import type { Metadata } from "next";

import { RequireAuth } from "@/components/auth/require-auth";
import { Checkout } from "@/components/checkout/checkout";

export const metadata: Metadata = {
  title: "Checkout — BRL Health",
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plano?: string }>;
}) {
  const { plano } = await searchParams;
  return (
    <RequireAuth>
      <Checkout planId={plano ?? "pro"} />
    </RequireAuth>
  );
}
