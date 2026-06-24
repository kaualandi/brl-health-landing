import type { Metadata } from "next";

import { RequireAuth } from "@/components/auth/require-auth";
import { ShoppingList } from "@/components/nutri/shopping-list";

export const metadata: Metadata = {
  title: "Lista de compras — BRL Nutri",
};

export default function ShoppingPage() {
  return (
    <RequireAuth>
      <ShoppingList />
    </RequireAuth>
  );
}
